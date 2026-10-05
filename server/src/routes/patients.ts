import { Router } from "express";
import { z } from "zod";

import { User } from "../models/User.js";
import { Patient } from "../models/Patient.js";
import { Doctor } from "../models/Doctor.js";
import { Appointment } from "../models/Appointment.js";

import {
  requireAuth,
  requireRole,
} from "../middleware/auth.js";

const router = Router();

const emergencyContactSchema = z.object({
  name: z
    .string()
    .max(120)
    .optional()
    .default(""),

  phone: z
    .string()
    .max(40)
    .optional()
    .default(""),

  relationship: z
    .string()
    .max(80)
    .optional()
    .default(""),
});

const updatePatientProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2)
    .max(120),

  phone: z
    .string()
    .trim()
    .max(40)
    .optional()
    .default(""),

  dateOfBirth: z
    .string()
    .optional()
    .nullable(),

  address: z
    .string()
    .trim()
    .max(250)
    .optional()
    .default(""),

  preferredLanguage: z
    .string()
    .trim()
    .max(80)
    .optional()
    .default(""),

  emergencyContact:
    emergencyContactSchema.optional(),
});

const clinicalProfileSchema = z.object({
  bloodGroup: z
    .enum([
      "",
      "A+",
      "A-",
      "B+",
      "B-",
      "AB+",
      "AB-",
      "O+",
      "O-",
    ])
    .optional()
    .default(""),

  allergies: z
    .array(
      z
        .string()
        .trim()
        .min(1)
        .max(120)
    )
    .max(50)
    .optional()
    .default([]),

  existingConditions: z
    .array(
      z
        .string()
        .trim()
        .min(1)
        .max(160)
    )
    .max(50)
    .optional()
    .default([]),
});

async function getAuthorisedDoctorPatient(
  doctorUserId: string,
  patientId: string
) {
  const doctor =
    await Doctor.findOne({
      userId: doctorUserId,
    });

  if (!doctor) {
    return {
      doctor: null,
      patient: null,
      authorised: false,
    };
  }

  const patient =
    await Patient.findById(
      patientId
    );

  if (!patient) {
    return {
      doctor,
      patient: null,
      authorised: false,
    };
  }

  const appointment =
    await Appointment.findOne({
      doctorId: doctor._id,
      patientId: patient._id,

      status: {
        $in: [
          "confirmed",
          "completed",
          "rescheduled",
        ],
      },
    }).select("_id");

  return {
    doctor,
    patient,
    authorised:
      Boolean(appointment),
  };
}

router.get(
  "/me",
  requireAuth,
  requireRole("patient"),
  async (req, res, next) => {
    try {
      const user =
        await User.findById(
          req.user!.id
        ).select(
          "-passwordHash"
        );

      if (!user) {
        return res
          .status(404)
          .json({
            message:
              "User account not found.",
          });
      }

      const patient =
        await Patient.findOne({
          userId: req.user!.id,
        });

      if (!patient) {
        return res
          .status(404)
          .json({
            message:
              "Patient profile not found.",
          });
      }

      return res.json({
        user,
        patient,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  "/me",
  requireAuth,
  requireRole("patient"),
  async (req, res, next) => {
    try {
      const data =
        updatePatientProfileSchema.parse(
          req.body
        );

      const dateOfBirth =
        data.dateOfBirth
          ? new Date(
              `${data.dateOfBirth}T00:00:00`
            )
          : null;

      if (
        dateOfBirth &&
        Number.isNaN(
          dateOfBirth.getTime()
        )
      ) {
        return res
          .status(400)
          .json({
            message:
              "Invalid date of birth.",
          });
      }

      if (
        dateOfBirth &&
        dateOfBirth >
          new Date()
      ) {
        return res
          .status(400)
          .json({
            message:
              "Date of birth cannot be in the future.",
          });
      }

      const user =
        await User.findByIdAndUpdate(
          req.user!.id,
          {
            name:
              data.name.trim(),

            phone:
              data.phone.trim(),
          },
          {
            new: true,
            runValidators: true,
          }
        ).select(
          "-passwordHash"
        );

      if (!user) {
        return res
          .status(404)
          .json({
            message:
              "User account not found.",
          });
      }

      const patient =
        await Patient.findOneAndUpdate(
          {
            userId:
              req.user!.id,
          },
          {
            dateOfBirth,

            address:
              data.address.trim(),

            preferredLanguage:
              data.preferredLanguage.trim(),

            emergencyContact: {
              name:
                data
                  .emergencyContact
                  ?.name
                  ?.trim() || "",

              phone:
                data
                  .emergencyContact
                  ?.phone
                  ?.trim() || "",

              relationship:
                data
                  .emergencyContact
                  ?.relationship
                  ?.trim() || "",
            },
          },
          {
            new: true,
            runValidators: true,
          }
        );

      if (!patient) {
        return res
          .status(404)
          .json({
            message:
              "Patient profile not found.",
          });
      }

      return res.json({
        message:
          "Profile updated successfully.",

        user,
        patient,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/:patientId/clinical",
  requireAuth,
  requireRole("doctor"),
  async (req, res, next) => {
    try {
      const patientId =
        String(
          req.params.patientId
        );

      const result =
        await getAuthorisedDoctorPatient(
          req.user!.id,
          patientId
        );

      if (!result.doctor) {
        return res
          .status(404)
          .json({
            message:
              "Doctor profile not found.",
          });
      }

      if (!result.patient) {
        return res
          .status(404)
          .json({
            message:
              "Patient profile not found.",
          });
      }

      if (!result.authorised) {
        return res
          .status(403)
          .json({
            message:
              "You are not authorised to access this patient's clinical profile.",
          });
      }

      return res.json({
        clinicalProfile: {
          bloodGroup:
            result.patient
              .bloodGroup ?? "",

          allergies:
            result.patient
              .allergies ?? [],

          existingConditions:
            result.patient
              .existingConditions ??
            [],
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  "/:patientId/clinical",
  requireAuth,
  requireRole("doctor"),
  async (req, res, next) => {
    try {
      const patientId =
        String(
          req.params.patientId
        );

      const data =
        clinicalProfileSchema.parse(
          req.body
        );

      const result =
        await getAuthorisedDoctorPatient(
          req.user!.id,
          patientId
        );

      if (!result.doctor) {
        return res
          .status(404)
          .json({
            message:
              "Doctor profile not found.",
          });
      }

      if (!result.patient) {
        return res
          .status(404)
          .json({
            message:
              "Patient profile not found.",
          });
      }

      if (!result.authorised) {
        return res
          .status(403)
          .json({
            message:
              "You are not authorised to update this patient's clinical profile.",
          });
      }

      result.patient.bloodGroup =
        data.bloodGroup;

      result.patient.allergies =
        data.allergies
          .map((item) =>
            item.trim()
          )
          .filter(Boolean);

      result.patient.existingConditions =
        data.existingConditions
          .map((item) =>
            item.trim()
          )
          .filter(Boolean);

      await result.patient.save();

      return res.json({
        message:
          "Patient clinical information updated successfully.",

        clinicalProfile: {
          bloodGroup:
            result.patient
              .bloodGroup,

          allergies:
            result.patient
              .allergies,

          existingConditions:
            result.patient
              .existingConditions,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;