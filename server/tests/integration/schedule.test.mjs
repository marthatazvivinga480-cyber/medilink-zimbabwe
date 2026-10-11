import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { startTestEnvironment } from "../../scripts/test-environment.mjs";

test(
  "recurring schedule API, rolling refresh, manual overrides and appointment lifecycle",
  { timeout: 180000 },
  async (t) => {
    const env = await startTestEnvironment();
    t.after(() => env.stop());
    const { DoctorAvailability, DoctorSchedule, Appointment } = mongoose.models;
    const request = async (path, method = "GET", body, token) => {
      const response = await fetch(env.origin + "/api" + path, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      return { status: response.status, body: await response.json() };
    };
    const login = async (role) =>
      (
        await request("/auth/login", "POST", {
          email: `${role}@medilink-test.invalid`,
          password: env.password,
        })
      ).body.token;
    const doctor = await login("doctor");
    const patient = await login("patient");
    assert.equal((await request("/doctors/me/schedule")).status, 401);
    assert.equal(
      (await request("/doctors/me/schedule", "GET", undefined, patient)).status,
      403,
    );
    const defaults = await request(
      "/doctors/me/schedule",
      "GET",
      undefined,
      doctor,
    );
    assert.equal(defaults.status, 200);
    assert.ok(defaults.body.schedule.workingDays.every((day) => !day.enabled));
    assert.equal(await DoctorSchedule.countDocuments(), 0);
    const { bookingDates, ensureAllDoctorsRollingAvailability } =
      await import("../../dist/services/doctorAvailabilityService.js");
    const dates = bookingDates(30);
    const date = dates[1];
    const next = dates[2];
    const schedule = {
      ...defaults.body.schedule,
      workingDays: defaults.body.schedule.workingDays.map((day) => ({
        ...day,
        enabled: true,
        startTime: "08:00",
        endTime: "12:00",
      })),
    };
    assert.equal(
      (
        await request(
          "/doctors/me/schedule",
          "PUT",
          { ...schedule, blockedDates: ["2026-02-30"] },
          doctor,
        )
      ).status,
      400,
    );
    assert.equal(
      (await request("/doctors/me/schedule", "PUT", schedule, doctor)).status,
      200,
    );
    assert.equal(
      await DoctorAvailability.countDocuments({ doctorId: env.doctor._id }),
      30,
    );
    const publicPath = `/doctors/${env.doctor._id}/availability`;
    assert.ok(
      (await request(publicPath)).body.availability
        .find((day) => day.date === date)
        .slots.some((s) => s.startTime === "08:00"),
    );
    const body = {
      doctorId: String(env.doctor._id),
      date,
      startTime: "08:00",
      endTime: "08:30",
      reason: "Synthetic booking",
    };
    const bookings = await Promise.all([
      request("/appointments", "POST", body, patient),
      request("/appointments", "POST", body, patient),
      request(publicPath),
    ]);
    assert.deepEqual(
      bookings
        .slice(0, 2)
        .map((r) => r.status)
        .sort(),
      [201, 409],
    );
    const appointment = bookings.find((r) => r.status === 201).body.appointment;
    const edited = {
      ...schedule,
      slotDurationMinutes: 15,
      blockedDates: [date],
    };
    assert.equal(
      (
        await request(
          "/doctors/me/schedule",
          "PUT",
          { ...edited, blockedDates: [] },
          doctor,
        )
      ).status,
      200,
    );
    const resized = await DoctorAvailability.findOne({
      doctorId: env.doctor._id,
      date,
    });
    assert.equal(
      resized.slots.find((slot) => slot.startTime === "08:00").endTime,
      "08:30",
    );
    assert.equal(
      resized.slots.some((slot) => slot.startTime === "08:15"),
      false,
    );
    assert.equal(
      (await request("/doctors/me/schedule", "PUT", edited, doctor)).status,
      200,
    );
    let day = await DoctorAvailability.findOne({
      doctorId: env.doctor._id,
      date,
    });
    assert.equal(day.slots.length, 2);
    assert.ok(day.slots.every((slot) => slot.isBooked));
    assert.equal(day.slots[0].isBooked, true);
    assert.equal(
      (
        await request(
          `/appointments/${appointment._id}/reschedule`,
          "PATCH",
          { date: next, startTime: "08:00", endTime: "08:15" },
          patient,
        )
      ).status,
      200,
    );
    day = await DoctorAvailability.findOne({ doctorId: env.doctor._id, date });
    assert.deepEqual(
      day.slots.map((slot) => slot.startTime),
      ["10:00"],
    );
    assert.equal(
      (
        await request(
          `/appointments/${appointment._id}/status`,
          "PATCH",
          { status: "cancelled" },
          patient,
        )
      ).status,
      200,
    );
    day = await DoctorAvailability.findOne({
      doctorId: env.doctor._id,
      date: next,
    });
    assert.equal(
      day.slots.find((s) => s.startTime === "08:00").isBooked,
      false,
    );
    assert.equal(
      (
        await request(
          "/appointments",
          "POST",
          { ...body, date: next, endTime: "08:30" },
          patient,
        )
      ).status,
      409,
    );
    const manual = {
      date: dates[3],
      slots: [{ startTime: "14:00", endTime: "14:30" }],
    };
    assert.equal(
      (await request("/doctors/availability", "POST", manual, doctor)).status,
      200,
    );
    await request(publicPath);
    day = await DoctorAvailability.findOne({
      doctorId: env.doctor._id,
      date: manual.date,
    });
    assert.deepEqual(
      day.slots.map((s) => s.startTime),
      ["14:00"],
    );
    assert.equal(
      (
        await request(
          `/doctors/availability/${manual.date}`,
          "DELETE",
          undefined,
          doctor,
        )
      ).status,
      200,
    );
    await request(publicPath);
    assert.equal(
      (
        await DoctorAvailability.findOne({
          doctorId: env.doctor._id,
          date: manual.date,
        })
      ).slots.length,
      0,
    );
    // Missing future dates are caught up at request time and maintenance time.
    await DoctorAvailability.deleteOne({
      doctorId: env.doctor._id,
      date: dates[29],
    });
    await request(publicPath);
    assert.ok(
      await DoctorAvailability.exists({
        doctorId: env.doctor._id,
        date: dates[29],
      }),
    );
    await DoctorAvailability.deleteOne({
      doctorId: env.doctor._id,
      date: dates[28],
    });
    await ensureAllDoctorsRollingAvailability();
    assert.ok(
      await DoctorAvailability.exists({
        doctorId: env.doctor._id,
        date: dates[28],
      }),
    );
    t.mock.timers.enable({ apis: ["Date"], now: Date.now() + 86400000 });
    try {
      const rolledDate = bookingDates(30)[29];
      await ensureAllDoctorsRollingAvailability();
      assert.ok(
        await DoctorAvailability.exists({
          doctorId: env.doctor._id,
          date: rolledDate,
        }),
      );
    } finally {
      t.mock.timers.reset();
    }
    // Doctors without schedules and legacy manual slots remain untouched.
    await DoctorSchedule.deleteMany({ doctorId: env.doctor._id });
    const before = JSON.stringify(await DoctorAvailability.find().lean());
    await request(publicPath);
    assert.equal(
      JSON.stringify(await DoctorAvailability.find().lean()),
      before,
    );
    assert.equal(
      (await Appointment.findById(appointment._id)).status,
      "cancelled",
    );
  },
);
