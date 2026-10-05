import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";

import { Appointment } from "../models/Appointment.js";
import { Patient } from "../models/Patient.js";
import { Doctor } from "../models/Doctor.js";
import { DoctorAvailability } from "../models/DoctorAvailability.js";
import { Notification } from "../models/Notification.js";

import {
  requireAuth,
  requireRole,
} from "../middleware/auth.js";

const router = Router();

const appointmentStatusSchema = z.enum([
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "rescheduled",
  "no-show",
]);

type AppointmentStatus = z.infer<
  typeof appointmentStatusSchema
>;

const rescheduleSchema = z.object({
  date: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
});

function getAppointmentDateTime(
  date: string,
  startTime: string
) {
  const appointmentDateTime = new Date(
    `${date}T${startTime}:00`
  );

  if (
    Number.isNaN(
      appointmentDateTime.getTime()
    )
  ) {
    return null;
  }

  return appointmentDateTime;
}

function isFutureAppointment(
  date: string,
  startTime: string
) {
  const appointmentDateTime =
    getAppointmentDateTime(
      date,
      startTime
    );

  if (!appointmentDateTime) {
    return false;
  }

  return (
    appointmentDateTime.getTime() >
    Date.now()
  );
}

function hasAppointmentStarted(
  date: string,
  startTime: string
) {
  const appointmentDateTime =
    getAppointmentDateTime(
      date,
      startTime
    );

  if (!appointmentDateTime) {
    return false;
  }

  return (
    appointmentDateTime.getTime() <=
    Date.now()
  );
}

function doctorCanTransition(
  currentStatus: AppointmentStatus,
  nextStatus: AppointmentStatus
) {
  const allowedTransitions: Record<
    AppointmentStatus,
    AppointmentStatus[]
  > = {
    pending: [
      "confirmed",
      "cancelled",
    ],

    confirmed: [
      "completed",
      "cancelled",
      "no-show",
    ],

    rescheduled: [
      "confirmed",
      "completed",
      "cancelled",
      "no-show",
    ],

    completed: [],

    cancelled: [],

    "no-show": [],
  };

  return allowedTransitions[
    currentStatus
  ].includes(nextStatus);
}

async function releaseAppointmentSlot(
  doctorId: mongoose.Types.ObjectId,
  date: string,
  startTime: string,
  endTime: string
) {
  const availability =
    await DoctorAvailability.findOne({
      doctorId,
      date,
    });

  if (!availability) {
    return;
  }

  const slot =
    availability.slots.find(
      (slot) =>
        slot.startTime ===
          startTime &&
        slot.endTime ===
          endTime
    );

  if (!slot) {
    return;
  }

  slot.isBooked = false;

  await availability.save();
}

router.post(
  "/",
  requireAuth,
  requireRole("patient"),
  async (req, res, next) => {
    try {
      const data = z
        .object({
          doctorId:
            z.string(),

          date:
            z.string(),

          startTime:
            z.string(),

          endTime:
            z.string(),

          reason:
            z
              .string()
              .min(3)
              .max(1000),
        })
        .parse(req.body);

      const appointmentDateTime =
        getAppointmentDateTime(
          data.date,
          data.startTime
        );

      if (!appointmentDateTime) {
        return res
          .status(400)
          .json({
            message:
              "Invalid appointment date or time.",
          });
      }

      if (
        appointmentDateTime.getTime() <=
        Date.now()
      ) {
        return res
          .status(400)
          .json({
            message:
              "Appointments must be booked for a future date and time.",
          });
      }

      const patient =
        await Patient.findOne({
          userId:
            req.user!.id,
        });

      if (!patient) {
        return res
          .status(404)
          .json({
            message:
              "Patient profile not found.",
          });
      }

      const doctor =
        await Doctor.findById(
          data.doctorId
        );

      if (!doctor) {
        return res
          .status(404)
          .json({
            message:
              "Doctor not found.",
          });
      }

      const availability =
        await DoctorAvailability.findOne({
          doctorId:
            doctor._id,

          date:
            data.date,
        });

      if (!availability) {
        return res
          .status(409)
          .json({
            message:
              "The doctor is not available on this date.",
          });
      }

      const slot =
        availability.slots.find(
          (slot) =>
            slot.startTime ===
              data.startTime &&
            slot.endTime ===
              data.endTime
        );

      if (!slot) {
        return res
          .status(409)
          .json({
            message:
              "That time is not currently available.",
          });
      }

      if (slot.isBooked) {
        return res
          .status(409)
          .json({
            message:
              "That appointment slot has already been booked.",
          });
      }

      const existing =
        await Appointment.findOne({
          doctorId:
            doctor._id,

          date:
            data.date,

          startTime:
            data.startTime,

          status: {
            $in: [
              "pending",
              "confirmed",
              "rescheduled",
            ],
          },
        });

      if (existing) {
        return res
          .status(409)
          .json({
            message:
              "That appointment slot has already been booked.",
          });
      }

      const appointment =
        await Appointment.create({
          ...data,

          patientId:
            patient._id,

          status:
            "pending",
        });

      slot.isBooked = true;

      await availability.save();

      await Notification.create({
        userId:
          doctor.userId,

        title:
          "New appointment request",

        message:
          `A patient requested an appointment for ${data.date} at ${data.startTime}.`,
      });

      return res
        .status(201)
        .json({
          appointment,
        });
    } catch (err: any) {
      if (
        err?.code ===
        11000
      ) {
        return res
          .status(409)
          .json({
            message:
              "That appointment slot has already been booked.",
          });
      }

      next(err);
    }
  }
);

router.get(
  "/mine",
  requireAuth,
  async (req, res, next) => {
    try {
      if (
        req.user!.role ===
        "patient"
      ) {
        const patient =
          await Patient.findOne({
            userId:
              req.user!.id,
          });

        if (!patient) {
          return res.json({
            appointments:
              [],
          });
        }

        const appointments =
          await Appointment.find({
            patientId:
              patient._id,
          })
            .populate({
              path:
                "doctorId",

              populate: {
                path:
                  "userId",

                select:
                  "name",
              },
            })
            .sort({
              date: 1,
              startTime:
                1,
            });

        return res.json({
          appointments,
        });
      }

      if (
        req.user!.role ===
        "doctor"
      ) {
        const doctor =
          await Doctor.findOne({
            userId:
              req.user!.id,
          });

        if (!doctor) {
          return res.json({
            appointments:
              [],
          });
        }

        const appointments =
          await Appointment.find({
            doctorId:
              doctor._id,
          })
            .populate({
              path:
                "patientId",

              populate: {
                path:
                  "userId",

                select:
                  "name email phone",
              },
            })
            .sort({
              date: 1,
              startTime:
                1,
            });

        return res.json({
          appointments,
        });
      }

      return res.json({
        appointments: [],
      });
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  "/:id/reschedule",
  requireAuth,
  requireRole("patient"),
  async (req, res, next) => {
    try {
      const appointmentId =
        String(
          req.params.id
        );

      const data =
        rescheduleSchema.parse(
          req.body
        );

      const patient =
        await Patient.findOne({
          userId:
            req.user!.id,
        });

      if (!patient) {
        return res
          .status(404)
          .json({
            message:
              "Patient profile not found.",
          });
      }

      const appointment =
        await Appointment.findById(
          appointmentId
        );

      if (!appointment) {
        return res
          .status(404)
          .json({
            message:
              "Appointment not found.",
          });
      }

      if (
        appointment.patientId.toString() !==
        patient._id.toString()
      ) {
        return res
          .status(403)
          .json({
            message:
              "You are not authorised to reschedule this appointment.",
          });
      }

      const currentStatus =
        appointment.status as
          AppointmentStatus;

      if (
        ![
          "pending",
          "confirmed",
          "rescheduled",
        ].includes(
          currentStatus
        )
      ) {
        return res
          .status(409)
          .json({
            message:
              "This appointment can no longer be rescheduled.",
          });
      }

      if (
        !isFutureAppointment(
          appointment.date,
          appointment.startTime
        )
      ) {
        return res
          .status(409)
          .json({
            message:
              "Past appointments cannot be rescheduled.",
          });
      }

      const newDateTime =
        getAppointmentDateTime(
          data.date,
          data.startTime
        );

      if (!newDateTime) {
        return res
          .status(400)
          .json({
            message:
              "Invalid appointment date or time.",
          });
      }

      if (
        newDateTime.getTime() <=
        Date.now()
      ) {
        return res
          .status(400)
          .json({
            message:
              "The new appointment time must be in the future.",
          });
      }

      const sameSlot =
        appointment.date ===
          data.date &&
        appointment.startTime ===
          data.startTime &&
        appointment.endTime ===
          data.endTime;

      if (sameSlot) {
        return res
          .status(400)
          .json({
            message:
              "Choose a different date or time to reschedule this appointment.",
          });
      }

      const doctor =
        await Doctor.findById(
          appointment.doctorId
        );

      if (!doctor) {
        return res
          .status(404)
          .json({
            message:
              "Doctor not found.",
          });
      }

      const newAvailability =
        await DoctorAvailability.findOne({
          doctorId:
            doctor._id,

          date:
            data.date,
        });

      if (!newAvailability) {
        return res
          .status(409)
          .json({
            message:
              "The doctor is not available on the selected date.",
          });
      }

      const newSlot =
        newAvailability.slots.find(
          (slot) =>
            slot.startTime ===
              data.startTime &&
            slot.endTime ===
              data.endTime
        );

      if (!newSlot) {
        return res
          .status(409)
          .json({
            message:
              "The selected time is not available.",
          });
      }

      if (newSlot.isBooked) {
        return res
          .status(409)
          .json({
            message:
              "The selected time has already been booked.",
          });
      }

      const conflictingAppointment =
        await Appointment.findOne({
          _id: {
            $ne:
              appointment._id,
          },

          doctorId:
            doctor._id,

          date:
            data.date,

          startTime:
            data.startTime,

          status: {
            $in: [
              "pending",
              "confirmed",
              "rescheduled",
            ],
          },
        });

      if (
        conflictingAppointment
      ) {
        return res
          .status(409)
          .json({
            message:
              "The selected time has already been booked.",
          });
      }

      const oldDate =
        appointment.date;

      const oldStartTime =
        appointment.startTime;

      const oldEndTime =
        appointment.endTime;

      newSlot.isBooked = true;

      await newAvailability.save();

      try {
        appointment.date =
          data.date;

        appointment.startTime =
          data.startTime;

        appointment.endTime =
          data.endTime;

        appointment.status =
          "rescheduled";

        await appointment.save();
      } catch (error) {
        newSlot.isBooked = false;

        await newAvailability.save();

        throw error;
      }

      await releaseAppointmentSlot(
        appointment.doctorId,
        oldDate,
        oldStartTime,
        oldEndTime
      );

      await Notification.create({
        userId:
          doctor.userId,

        title:
          "Appointment rescheduled",

        message:
          `A patient rescheduled an appointment from ${oldDate} at ${oldStartTime} to ${data.date} at ${data.startTime}.`,
      });

      const populatedAppointment =
        await Appointment.findById(
          appointment._id
        ).populate({
          path:
            "doctorId",

          populate: {
            path:
              "userId",

            select:
              "name",
          },
        });

      return res.json({
        message:
          "Appointment rescheduled successfully.",

        appointment:
          populatedAppointment,
      });
    } catch (err: any) {
      if (
        err?.code ===
        11000
      ) {
        return res
          .status(409)
          .json({
            message:
              "The selected time has already been booked.",
          });
      }

      next(err);
    }
  }
);

router.patch(
  "/:id/status",
  requireAuth,
  async (req, res, next) => {
    try {
      const appointmentId =
        String(
          req.params.id
        );

      const status =
        appointmentStatusSchema.parse(
          req.body.status
        );

      const appointment =
        await Appointment.findById(
          appointmentId
        );

      if (!appointment) {
        return res
          .status(404)
          .json({
            message:
              "Appointment not found.",
          });
      }

      const currentStatus =
        appointment.status as
          AppointmentStatus;

      if (
        currentStatus ===
        status
      ) {
        return res
          .status(400)
          .json({
            message:
              `Appointment is already ${status}.`,
          });
      }

      if (
        req.user!.role ===
        "doctor"
      ) {
        const doctor =
          await Doctor.findOne({
            userId:
              req.user!.id,
          });

        if (
          !doctor ||
          appointment.doctorId.toString() !==
            doctor._id.toString()
        ) {
          return res
            .status(403)
            .json({
              message:
                "You are not authorised to update this appointment.",
            });
        }

        if (
          !doctorCanTransition(
            currentStatus,
            status
          )
        ) {
          return res
            .status(409)
            .json({
              message:
                `Appointment cannot be changed from ${currentStatus} to ${status}.`,
            });
        }

        if (
          status ===
            "confirmed" &&
          !isFutureAppointment(
            appointment.date,
            appointment.startTime
          )
        ) {
          return res
            .status(409)
            .json({
              message:
                "A past appointment cannot be confirmed.",
            });
        }

        if (
          status ===
            "cancelled" &&
          !isFutureAppointment(
            appointment.date,
            appointment.startTime
          )
        ) {
          return res
            .status(409)
            .json({
              message:
                "A past appointment cannot be cancelled. Mark it as completed or no-show instead.",
            });
        }

        if (
          status ===
            "completed" &&
          !hasAppointmentStarted(
            appointment.date,
            appointment.startTime
          )
        ) {
          return res
            .status(409)
            .json({
              message:
                "An appointment cannot be completed before its scheduled start time.",
            });
        }

        if (
          status ===
            "no-show" &&
          !hasAppointmentStarted(
            appointment.date,
            appointment.startTime
          )
        ) {
          return res
            .status(409)
            .json({
              message:
                "An appointment cannot be marked as no-show before its scheduled start time.",
            });
        }
      } else if (
        req.user!.role ===
        "patient"
      ) {
        const patient =
          await Patient.findOne({
            userId:
              req.user!.id,
          });

        if (
          !patient ||
          appointment.patientId.toString() !==
            patient._id.toString()
        ) {
          return res
            .status(403)
            .json({
              message:
                "You are not authorised to update this appointment.",
            });
        }

        if (
          status !==
          "cancelled"
        ) {
          return res
            .status(403)
            .json({
              message:
                "Patients can only cancel their own appointments.",
            });
        }

        if (
          ![
            "pending",
            "confirmed",
            "rescheduled",
          ].includes(
            currentStatus
          )
        ) {
          return res
            .status(409)
            .json({
              message:
                "This appointment can no longer be cancelled.",
            });
        }

        if (
          !isFutureAppointment(
            appointment.date,
            appointment.startTime
          )
        ) {
          return res
            .status(409)
            .json({
              message:
                "Past appointments cannot be cancelled.",
            });
        }
      } else {
        return res
          .status(403)
          .json({
            message:
              "You are not authorised to update appointments.",
          });
      }

      const previousStatus =
        currentStatus;

      appointment.status =
        status;

      await appointment.save();

      if (
        status ===
          "cancelled" &&
        previousStatus !==
          "cancelled"
      ) {
        await releaseAppointmentSlot(
          appointment.doctorId,
          appointment.date,
          appointment.startTime,
          appointment.endTime
        );
      }

      return res.json({
        message:
          `Appointment marked as ${status}.`,

        appointment,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;