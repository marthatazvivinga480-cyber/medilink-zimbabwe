import { Router } from "express";
import { z } from "zod";
import { MedicalRecord } from "../models/MedicalRecord.js";
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

      const records =
        await MedicalRecord.find({
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
            createdAt: -1,
          });

      res.json({
        records,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/patient/:patientId",
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

      const records =
        await MedicalRecord.find({
          patientId:
            req.params.patientId,
          doctorId: doctor._id,
        })
          .populate("appointmentId")
          .sort({
            createdAt: -1,
          });

      res.json({
        records,
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
      const data = z
        .object({
          patientId:
            z.string().min(1),

          appointmentId:
            z.string().min(1),

          diagnosis:
            z.string().min(2),

          diagnosisExplanation:
            z.string().optional(),

          symptoms:
            z.string().optional(),

          observations:
            z.string().optional(),

          treatment:
            z.string().optional(),

          followUp:
            z.string().optional(),
        })
        .parse(req.body);

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
          _id: data.appointmentId,
          doctorId: doctor._id,
          patientId: data.patientId,
        });

      if (!appointment) {
        return res
          .status(403)
          .json({
            message:
              "You are not authorized to create a record for this appointment.",
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
              "Only confirmed or rescheduled appointments can be completed.",
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
              "This consultation cannot be completed before the scheduled appointment time.",
          });
      }

      const existingRecord =
        await MedicalRecord.findOne({
          appointmentId:
            appointment._id,
        });

      if (existingRecord) {
        return res
          .status(409)
          .json({
            message:
              "A medical record has already been created for this appointment.",
          });
      }

      const record =
        await MedicalRecord.create({
          ...data,
          doctorId: doctor._id,
        });

      appointment.status =
        "completed";

      await appointment.save();

      res.status(201).json({
        record,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;