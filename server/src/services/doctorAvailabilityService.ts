import mongoose from "mongoose";
import { Appointment } from "../models/Appointment.js";
import { DoctorSchedule } from "../models/DoctorSchedule.js";
import { DoctorAvailability } from "../models/DoctorAvailability.js";

type TimeRange = { startTime: string; endTime: string };
type WorkingDay = TimeRange & {
  dayOfWeek: number;
  enabled: boolean;
  breaks?: TimeRange[];
};
type Slot = TimeRange & {
  isBooked?: boolean;
  generated?: boolean;
  claimToken?: string;
};
const minutes = (time: string) =>
  Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
const time = (value: number) =>
  `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
const overlaps = (a: TimeRange, b: TimeRange) =>
  a.startTime < b.endTime && a.endTime > b.startTime;

export function generateSlotsForDay(
  day: WorkingDay | undefined,
  duration: number,
): Slot[] {
  if (
    !day?.enabled ||
    !Number.isInteger(duration) ||
    duration < 15 ||
    duration > 180
  )
    return [];
  const slots: Slot[] = [];
  for (
    let start = minutes(day.startTime);
    start + duration <= minutes(day.endTime);
    start += duration
  ) {
    const slot = {
      startTime: time(start),
      endTime: time(start + duration),
      isBooked: false,
      generated: true,
    };
    if (!(day.breaks ?? []).some((b) => overlaps(slot, b))) slots.push(slot);
  }
  return slots;
}

export function mergeRecurringSlots(
  existing: Slot[],
  generated: Slot[],
): Slot[] {
  // Legacy slots have no provenance and must be treated as manual.
  const preserved = existing.filter((slot) => slot.isBooked || !slot.generated);
  return [
    ...preserved,
    ...generated.filter(
      (slot) => !preserved.some((other) => overlaps(slot, other)),
    ),
  ].sort((a, b) => a.startTime.localeCompare(b.startTime));
}

export function bookingDates(days: number, now = new Date()): string[] {
  // Zimbabwe uses UTC+02:00 year-round, independent of the server's timezone.
  const local = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const midnight = Date.UTC(
    local.getUTCFullYear(),
    local.getUTCMonth(),
    local.getUTCDate(),
  );
  return Array.from({ length: days }, (_, offset) =>
    new Date(midnight + offset * 86400000).toISOString().slice(0, 10),
  );
}

export async function replaceAvailabilitySlots(
  id: mongoose.Types.ObjectId,
  previousSlots: unknown[],
  slots: Slot[],
  manualOverride = false,
) {
  const cast = new DoctorAvailability({ slots });
  // Use raw BSON for the snapshot filter: Mongoose casting can reorder embedded
  // document fields, and MongoDB compares embedded documents by field order.
  return DoctorAvailability.collection.updateOne(
    {
      _id: id,
      slots: previousSlots,
      ...(!manualOverride ? { manualOverride: { $ne: true } } : {}),
    },
    {
      $set: {
        slots: cast.slots.toObject(),
        updatedAt: new Date(),
        ...(manualOverride ? { manualOverride: true } : {}),
      },
    },
  );
}

const refreshes = new Map<string, Promise<void>>();

export async function ensureDoctorRollingAvailability(
  doctorId: mongoose.Types.ObjectId | string,
): Promise<void> {
  const key = String(doctorId);
  const previous = refreshes.get(key) ?? Promise.resolve();
  // A schedule save must finish after any refresh that read the old schedule.
  const refresh = previous
    .catch(() => {})
    .then(() => refreshDoctorRollingAvailability(doctorId));
  refreshes.set(key, refresh);
  try {
    await refresh;
  } finally {
    if (refreshes.get(key) === refresh) refreshes.delete(key);
  }
}

async function refreshDoctorRollingAvailability(
  doctorId: mongoose.Types.ObjectId | string,
) {
  const schedule = await DoctorSchedule.findOne({ doctorId }).lean();
  if (!schedule) return;
  const dates = bookingDates(schedule.bookingWindowDays ?? 30);
  // Reconcile generated future dates beyond a shortened window too; never touch history.
  const existingDates = await DoctorAvailability.find({
    doctorId,
    date: { $gte: dates[0] },
    "slots.generated": true,
  }).distinct("date");
  const window = new Set(dates);
  const blocked = new Set(schedule.blockedDates);
  for (const date of new Set([...dates, ...existingDates])) {
    const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
    const generated =
      window.has(date) && !blocked.has(date)
        ? generateSlotsForDay(
            schedule.workingDays.find((day) => day.dayOfWeek === weekday) as
              WorkingDay | undefined,
            schedule.slotDurationMinutes ?? 30,
          )
        : [];
    let updated = false;
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const existing = await DoctorAvailability.findOne({
        doctorId,
        date,
      }).lean();
      if (existing?.manualOverride) {
        updated = true;
        break;
      }
      const appointments = await Appointment.find({
        doctorId,
        date,
        status: { $in: ["pending", "confirmed", "rescheduled"] },
      }).lean();
      const reservations: Slot[] = appointments.map((a) => ({
        startTime: a.startTime,
        endTime: a.endTime,
        isBooked: true,
        generated: true,
      }));
      if (!existing) {
        if (!generated.length && !reservations.length) {
          updated = true;
          break;
        }
        try {
          await DoctorAvailability.create({
            doctorId,
            date,
            slots: mergeRecurringSlots(reservations, generated),
          });
          updated = true;
          break;
        } catch (error) {
          if (
            !(error instanceof mongoose.mongo.MongoServerError) ||
            error.code !== 11000
          )
            throw error;
          continue;
        }
      }
      const current = existing.slots as Slot[];
      const protectedSlots = current.map((slot) =>
        appointments.some((a) => overlaps(slot, a))
          ? { ...slot, isBooked: true }
          : slot,
      );
      for (const appointment of appointments) {
        if (
          !protectedSlots.some(
            (slot) =>
              slot.startTime === appointment.startTime &&
              slot.endTime === appointment.endTime,
          )
        ) {
          protectedSlots.push({
            startTime: appointment.startTime,
            endTime: appointment.endTime,
            isBooked: true,
            generated: true,
          });
        }
      }
      const slots = mergeRecurringSlots(protectedSlots, generated);
      const signature = (items: Slot[]) =>
        JSON.stringify(
          items.map((slot) => [
            slot.startTime,
            slot.endTime,
            Boolean(slot.isBooked),
            Boolean(slot.generated),
            slot.claimToken ?? null,
          ]),
        );
      if (signature(current) === signature(slots)) {
        updated = true;
        break;
      }

      // Compare the full snapshot, so a concurrent booking or manual edit forces a retry.
      const result = await replaceAvailabilitySlots(
        existing._id,
        existing.slots,
        slots,
      );
      if (result.matchedCount) {
        updated = true;
        break;
      }
    }
    if (!updated)
      throw new Error(
        `Availability changed repeatedly for ${doctorId} on ${date}; retry refresh.`,
      );
  }
}

export async function ensureAllDoctorsRollingAvailability() {
  const schedules = await DoctorSchedule.find().select("doctorId").lean();
  for (const schedule of schedules) {
    try {
      await ensureDoctorRollingAvailability(schedule.doctorId);
    } catch (error) {
      console.error(
        `Could not refresh availability for doctor ${schedule.doctorId}:`,
        error,
      );
    }
  }
}
