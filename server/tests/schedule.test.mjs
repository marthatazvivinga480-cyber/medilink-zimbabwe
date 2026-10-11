import test from "node:test";
import assert from "node:assert/strict";
import {
  scheduleSchema,
  defaultSchedule,
} from "../dist/services/doctorScheduleValidation.js";
import {
  generateSlotsForDay,
  mergeRecurringSlots,
  bookingDates,
} from "../dist/services/doctorAvailabilityService.js";

test("safe default and strict schedule validation", () => {
  const schedule = defaultSchedule();
  assert.ok(schedule.workingDays.every((day) => !day.enabled));
  assert.equal(
    scheduleSchema.parse({ ...schedule, bookingWindowDays: undefined })
      .bookingWindowDays,
    30,
  );
  for (const patch of [
    { slotDurationMinutes: 14 },
    { slotDurationMinutes: 181 },
    { blockedDates: ["2026-02-30"] },
    { bookingWindowDays: 0 },
    { workingDays: [{ ...schedule.workingDays[0], dayOfWeek: 7 }] },
    { workingDays: [schedule.workingDays[0], schedule.workingDays[0]] },
  ]) {
    assert.equal(
      scheduleSchema.safeParse({ ...schedule, ...patch }).success,
      false,
    );
  }
  for (const patch of [
    { startTime: "25:00" },
    { endTime: "07:00" },
    { breaks: [{ startTime: "07:00", endTime: "09:00" }] },
    {
      breaks: [
        { startTime: "10:00", endTime: "11:00" },
        { startTime: "10:30", endTime: "12:00" },
      ],
    },
  ]) {
    assert.equal(
      scheduleSchema.safeParse({
        ...schedule,
        workingDays: [{ ...schedule.workingDays[0], ...patch }],
      }).success,
      false,
    );
  }
});

test("generation respects duration, breaks, disabled days and booked overlaps", () => {
  const day = {
    enabled: true,
    dayOfWeek: 1,
    startTime: "08:00",
    endTime: "10:00",
    breaks: [{ startTime: "08:30", endTime: "09:00" }],
  };
  const generated = generateSlotsForDay(day, 30);
  assert.deepEqual(
    generated.map((s) => s.startTime),
    ["08:00", "09:00", "09:30"],
  );
  assert.deepEqual(generateSlotsForDay({ ...day, enabled: false }, 30), []);
  const booked = {
    startTime: "08:15",
    endTime: "09:15",
    isBooked: true,
    generated: true,
  };
  const manual = { startTime: "11:00", endTime: "11:30", isBooked: false };
  assert.deepEqual(
    mergeRecurringSlots([booked, manual], generated).map((s) => s.startTime),
    ["08:15", "09:30", "11:00"],
  );
  assert.deepEqual(mergeRecurringSlots([booked, manual, ...generated], []), [
    booked,
    manual,
  ]);
});

test("window rolls across midnight in Zimbabwe and year boundaries", () => {
  const dates = bookingDates(30, new Date("2026-12-31T22:01:00Z"));
  assert.equal(dates.length, 30);
  assert.equal(dates[0], "2027-01-01");
  assert.equal(dates[29], "2027-01-30");
  assert.equal(
    bookingDates(30, new Date("2027-01-01T22:01:00Z"))[29],
    "2027-01-31",
  );
});
