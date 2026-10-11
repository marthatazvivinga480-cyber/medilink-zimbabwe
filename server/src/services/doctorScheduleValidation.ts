import { z } from "zod";
const time = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must use HH:mm format.");
const range = z.object({ startTime: time, endTime: time });
const day = range
  .extend({
    dayOfWeek: z.number().int().min(0).max(6),
    enabled: z.boolean(),
    breaks: z.array(range).max(24).default([]),
  })
  .superRefine((value, ctx) => {
    const issue = (message: string) =>
      ctx.addIssue({ code: "custom", message });
    if (value.startTime >= value.endTime)
      issue("Working hours must end after they start.");
    const breaks = [...value.breaks].sort((a, b) =>
      a.startTime.localeCompare(b.startTime),
    );
    breaks.forEach((b, index) => {
      if (
        b.startTime >= b.endTime ||
        b.startTime < value.startTime ||
        b.endTime > value.endTime
      )
        issue(
          "Breaks must end after they start and fall within working hours.",
        );
      if (index && b.startTime < breaks[index - 1].endTime)
        issue("Breaks cannot overlap.");
    });
  });
export const scheduleSchema = z.object({
  slotDurationMinutes: z.number().int().min(15).max(180),
  workingDays: z
    .array(day)
    .max(7)
    .refine(
      (days) => new Set(days.map((d) => d.dayOfWeek)).size === days.length,
      "Each weekday can appear only once.",
    ),
  blockedDates: z
    .array(
      z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .refine((date) => {
          const parsed = new Date(`${date}T00:00:00Z`);
          return (
            Number.isFinite(parsed.getTime()) &&
            parsed.toISOString().slice(0, 10) === date
          );
        }, "Blocked date must be a valid calendar date."),
    )
    .max(366)
    .default([]),
  bookingWindowDays: z.number().int().min(1).max(90).default(30),
});
export function defaultSchedule() {
  return {
    slotDurationMinutes: 30,
    bookingWindowDays: 30,
    blockedDates: [],
    workingDays: Array.from({ length: 7 }, (_, dayOfWeek) => ({
      dayOfWeek,
      enabled: false,
      startTime: "08:00",
      endTime: "16:00",
      breaks: [],
    })),
  };
}
