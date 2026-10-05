import { Router } from "express";
import crypto from "crypto";
import { Prescription } from "../models/Prescription.js";
import { Patient } from "../models/Patient.js";
import { Doctor } from "../models/Doctor.js";
import { Appointment } from "../models/Appointment.js";
import {
  requireAuth,
  requireRole,
} from "../middleware/auth.js";

const router = Router();

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

router.get(
  "/mine",
  requireAuth,
  requireRole("patient"),
  async (req, res, next) => {
    try {
      const patient =
        await Patient.findOne({
          userId: req.user!.id,
        });

      const prescriptions =
        await Prescription.find({
          patientId: patient?._id,
        })
          .populate({
            path: "doctorId",
            populate: {
              path: "userId",
              select: "name",
            },
          })
          .sort({
            issuedAt: -1,
          });

      res.json({
        prescriptions,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/doctor",
  requireAuth,
  requireRole("doctor"),
  async (req, res, next) => {
    try {
      const doctor =
        await Doctor.findOne({
          userId: req.user!.id,
        });

      const prescriptions =
        await Prescription.find({
          doctorId: doctor?._id,
        })
          .sort({
            issuedAt: -1,
          })
          .limit(100);

      res.json({
        prescriptions,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/",
  requireAuth,
  requireRole("doctor"),
  async (req, res, next) => {
    try {
      const doctor =
        await Doctor.findOne({
          userId: req.user!.id,
        });

      if (!doctor) {
        return res
          .status(404)
          .json({
            message:
              "Doctor profile was not found.",
          });
      }

      const appointment =
        await Appointment.findOne({
          _id: req.body.appointmentId,
          doctorId: doctor._id,
          patientId: req.body.patientId,
        });

      if (!appointment) {
        return res
          .status(403)
          .json({
            message:
              "Invalid appointment relationship.",
          });
      }

      if (
        appointment.status !==
          "confirmed" &&
        appointment.status !==
          "rescheduled"
      ) {
        return res
          .status(409)
          .json({
            message:
              "A prescription can only be issued for a confirmed or rescheduled appointment.",
          });
      }

      if (
        !hasAppointmentStarted(
          appointment.date,
          appointment.startTime
        )
      ) {
        return res
          .status(409)
          .json({
            message:
              "A prescription cannot be issued before the scheduled appointment time.",
          });
      }

      const existingPrescription =
        await Prescription.findOne({
          appointmentId:
            appointment._id,
        });

      if (existingPrescription) {
        return res
          .status(409)
          .json({
            message:
              "A prescription has already been issued for this appointment.",
          });
      }

      const prescriptionCode =
        `RX-MZ-${new Date().getFullYear()}-${crypto
          .randomBytes(3)
          .toString("hex")
          .toUpperCase()}`;

      const prescription =
        await Prescription.create({
          patientId:
            req.body.patientId,

          doctorId:
            doctor._id,

          appointmentId:
            appointment._id,

          prescriptionCode,

          medicines:
            req.body.medicines || [],

          instructions:
            req.body.instructions || "",

          expiresAt:
            req.body.expiresAt ||
            undefined,

          status:
            "valid",
        });

      res
        .status(201)
        .json({
          prescription,
        });
    } catch (err) {
      next(err);
    }
  }
);

export default router;