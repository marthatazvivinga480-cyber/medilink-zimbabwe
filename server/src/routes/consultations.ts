import { Router } from "express";
import crypto from "crypto";
import mongoose from "mongoose";
import { z } from "zod";

import { Appointment } from "../models/Appointment.js";
import { Doctor } from "../models/Doctor.js";
import { MedicalRecord } from "../models/MedicalRecord.js";
import { Prescription } from "../models/Prescription.js";
import {
  requireAuth,
  requireRole,
} from "../middleware/auth.js";

const router = Router();

const medicineSchema = z.object({
  name: z.string().min(1),
  dosage: z.string().min(1),
  frequency: z.string().min(1),
  duration: z.string().min(1),
});

const completeConsultationSchema = z.object({
  appointmentId: z.string().min(1),
  patientId: z.string().min(1),

  diagnosis: z.string().min(2),
  diagnosisExplanation: z.string().optional(),
  symptoms: z.string().optional(),
  observations: z.string().optional(),
  treatment: z.string().optional(),
  followUp: z.string().optional(),

  issuePrescription: z.boolean().default(false),

  medicines: z.array(medicineSchema).default([]),
  instructions: z.string().optional(),
  expiresAt: z.string().optional(),
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

router.post(
  "/complete",
  requireAuth,
  requireRole("doctor"),
  async (req, res, next) => {
    const session =
      await mongoose.startSession();

    try {
      const data =
        completeConsultationSchema.parse(
          req.body
        );

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
              "You are not authorized to complete this consultation.",
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

      if (
        data.issuePrescription &&
        data.medicines.length === 0
      ) {
        return res
          .status(400)
          .json({
            message:
              "Add at least one medicine before issuing the prescription.",
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
              "This consultation has already been completed.",
          });
      }

      const existingPrescription =
        await Prescription.findOne({
          appointmentId:
            appointment._id,
        });

      if (
        data.issuePrescription &&
        existingPrescription
      ) {
        return res
          .status(409)
          .json({
            message:
              "A prescription has already been issued for this appointment.",
          });
      }

      let record = null;
      let prescription = null;

      await session.withTransaction(
        async () => {
          const createdRecords =
            await MedicalRecord.create(
              [
                {
                  patientId:
                    data.patientId,
                  doctorId:
                    doctor._id,
                  appointmentId:
                    appointment._id,
                  diagnosis:
                    data.diagnosis.trim(),
                  diagnosisExplanation:
                    data.diagnosisExplanation?.trim() ||
                    "",
                  symptoms:
                    data.symptoms?.trim() ||
                    "",
                  observations:
                    data.observations?.trim() ||
                    "",
                  treatment:
                    data.treatment?.trim() ||
                    "",
                  followUp:
                    data.followUp?.trim() ||
                    "",
                },
              ],
              {
                session,
              }
            );

          record =
            createdRecords[0];

          if (
            data.issuePrescription
          ) {
            const prescriptionCode =
              `RX-MZ-${new Date().getFullYear()}-${crypto
                .randomBytes(16)
                .toString("hex")
                .toUpperCase()}`;

            const createdPrescriptions =
              await Prescription.create(
                [
                  {
                    patientId:
                      data.patientId,
                    doctorId:
                      doctor._id,
                    appointmentId:
                      appointment._id,
                    prescriptionCode,
                    medicines:
                      data.medicines.map(
                        (
                          medicine
                        ) => ({
                          name:
                            medicine.name.trim(),
                          dosage:
                            medicine.dosage.trim(),
                          frequency:
                            medicine.frequency.trim(),
                          duration:
                            medicine.duration.trim(),
                        })
                      ),
                    instructions:
                      data.instructions?.trim() ||
                      "",
                    expiresAt:
                      data.expiresAt ||
                      undefined,
                    status:
                      "valid",
                  },
                ],
                {
                  session,
                }
              );

            prescription =
              createdPrescriptions[0];
          }

          appointment.status =
            "completed";

          await appointment.save({
            session,
          });
        }
      );

      res.status(201).json({
        message:
          "Consultation completed successfully.",
        record,
        prescription,
        appointment,
      });
    } catch (error) {
      next(error);
    } finally {
      await session.endSession();
    }
  }
);

export default router;