import { test, expect } from "@playwright/test";

for (const width of [390, 1280]) {
  test(`doctor loads and saves recurring schedule at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    let saved: unknown;
    let schedule = {
      slotDurationMinutes: 30,
      bookingWindowDays: 30,
      blockedDates: [] as string[],
      workingDays: Array.from({ length: 7 }, (_, dayOfWeek) => ({
        dayOfWeek,
        enabled: false,
        startTime: "08:00",
        endTime: "16:00",
        breaks: [] as { startTime: string; endTime: string }[],
      })),
    };
    await page.route("**/api/**", async (route) => {
      const path = new URL(route.request().url()).pathname;
      let body: unknown = {};
      if (path.endsWith("/auth/me"))
        body = {
          user: {
            id: "u1",
            name: "Test doctor",
            email: "doctor@example.invalid",
            role: "doctor",
          },
        };
      else if (path === "/api/doctors")
        body = {
          doctors: [
            {
              _id: "d1",
              userId: { _id: "u1", name: "Test doctor" },
              speciality: "Test care",
            },
          ],
        };
      else if (path.endsWith("/me/schedule")) {
        if (route.request().method() === "PUT") {
          saved = route.request().postDataJSON();
          schedule = saved as typeof schedule;
        }
        body = { schedule };
      } else if (path.includes("availability")) body = { availability: [] };
      else if (path.includes("appointments")) body = { appointments: [] };
      else if (path.includes("prescriptions")) body = { prescriptions: [] };
      else if (path.includes("notifications"))
        body = { notifications: [], unreadCount: 0 };
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify(body),
      });
    });
    await page.goto("/doctor");
    await page
      .getByRole("button", { name: "Availability", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Recurring weekly schedule" }),
    ).toBeVisible();
    await page.getByLabel("Monday", { exact: true }).check();
    await page.getByLabel("Monday start", { exact: true }).fill("09:00");
    await page.getByLabel("Monday end", { exact: true }).fill("17:00");
    await page.getByLabel("Appointment duration (minutes)").fill("45");
    await page.getByRole("button", { name: "Add break", exact: true }).click();
    await page.getByLabel("Monday break 1 start").fill("12:00");
    await page.getByLabel("Monday break 1 end").fill("13:00");
    await page.getByLabel("Blocked dates / time off").fill("2027-01-05");
    await page.getByRole("button", { name: "Add date", exact: true }).click();
    await page
      .getByRole("button", { name: "Save recurring schedule", exact: true })
      .click();
    await expect(
      page.getByRole("status").filter({ hasText: "Weekly schedule saved" }),
    ).toBeVisible();
    expect(saved).toMatchObject({
      slotDurationMinutes: 45,
      bookingWindowDays: 30,
      blockedDates: ["2027-01-05"],
    });
    expect(schedule.workingDays[1]).toMatchObject({
      enabled: true,
      startTime: "09:00",
      endTime: "17:00",
      breaks: [{ startTime: "12:00", endTime: "13:00" }],
    });
    await page
      .getByRole("button", { name: "Remove break", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Remove blocked date 2027-01-05" })
      .click();
    await expect(page.getByLabel("Monday break 1 start")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Remove blocked date 2027-01-05" }),
    ).toHaveCount(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    expect(errors).toEqual([]);
  });
}
