import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";

import {
  requireAuth,
  requireRole,
} from "../middleware/auth.js";

import { User } from "../models/User.js";
import { Doctor } from "../models/Doctor.js";
import { Patient } from "../models/Patient.js";
import { Appointment } from "../models/Appointment.js";

const router = Router();

const createDoctorSchema = z.object({
  existingDoctorId: z
    .string()
    .trim()
    .min(1)
    .optional(),

  name: z
    .string()
    .min(2),

  email: z
    .string()
    .email(),

  password: z
    .string()
    .min(8),

  phone: z
    .string()
    .optional(),

  speciality: z
    .string()
    .min(2),

  qualifications: z
    .array(z.string())
    .default([]),

  biography: z
    .string()
    .default(""),

  location: z
    .string()
    .default(""),

  registrationInfo: z
    .string()
    .default(""),

  photoUrl: z
    .string()
    .default(""),

  facility: z
    .string()
    .default(""),

  languages: z
    .array(z.string())
    .default([]),

  yearsOfExperience: z
    .number()
    .int()
    .min(0)
    .default(0),

  areasOfCare: z
    .array(z.string())
    .default([]),

  consultationTypes: z
    .array(z.string())
    .default(["In-person"]),

  consultationFee: z
    .number()
    .min(0)
    .default(0),

  currency: z
    .enum([
      "USD",
      "ZWG",
    ])
    .default("USD"),

  isVerified: z
    .boolean()
    .default(false),
});

const updateDoctorSchema = z.object({
  name: z
    .string()
    .min(2)
    .optional(),

  email: z
    .string()
    .email()
    .optional(),

  phone: z
    .string()
    .optional(),

  speciality: z
    .string()
    .min(2)
    .optional(),

  qualifications: z
    .array(z.string())
    .optional(),

  biography: z
    .string()
    .optional(),

  location: z
    .string()
    .optional(),

  registrationInfo: z
    .string()
    .optional(),

  photoUrl: z
    .string()
    .optional(),

  facility: z
    .string()
    .optional(),

  languages: z
    .array(z.string())
    .optional(),

  yearsOfExperience: z
    .number()
    .int()
    .min(0)
    .optional(),

  areasOfCare: z
    .array(z.string())
    .optional(),

  consultationTypes: z
    .array(z.string())
    .optional(),

  consultationFee: z
    .number()
    .min(0)
    .optional(),

  currency: z
    .enum([
      "USD",
      "ZWG",
    ])
    .optional(),

  isVerified: z
    .boolean()
    .optional(),
});

const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8),
});

const accountStatusSchema = z.object({
  isActive: z.boolean(),
});

router.use(requireAuth);
router.use(requireRole("admin"));

router.get(
  "/stats",
  async (_req, res, next) => {
    try {
      const [
        doctors,
        patients,
        appointments,
        verifiedDoctors,
        activeDoctorUsers,
      ] = await Promise.all([
        Doctor.countDocuments(),

        Patient.countDocuments(),

        Appointment.countDocuments(),

        Doctor.countDocuments({
          isVerified: true,
        }),

        User.find({
          role: "doctor",
          isActive: {
            $ne: false,
          },
        }).select("_id"),
      ]);

      const activeDoctorUserIds =
        activeDoctorUsers.map(
          (user) => user._id
        );

      const activeDoctors =
        activeDoctorUserIds.length > 0
          ? await Doctor.countDocuments({
              userId: {
                $in: activeDoctorUserIds,
              },
            })
          : 0;

      return res.json({
        stats: {
          doctors,
          patients,
          appointments,
          activeDoctors,
          verifiedDoctors,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/doctors",
  async (_req, res, next) => {
    try {
      const doctors =
        await Doctor.find()
          .populate(
            "userId",
            "name email phone role isActive createdAt"
          )
          .sort({
            createdAt: -1,
          });

      return res.json({
        doctors,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/doctors/:id",
  async (req, res, next) => {
    try {
      const doctor =
        await Doctor.findById(
          req.params.id
        ).populate(
          "userId",
          "name email phone role isActive createdAt"
        );

      if (!doctor) {
        return res
          .status(404)
          .json({
            message:
              "Doctor was not found.",
          });
      }

      return res.json({
        doctor,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/doctors",
  async (req, res, next) => {
    try {
      const data =
        createDoctorSchema.parse(
          req.body
        );

      const normalizedEmail =
        data.email
          .trim()
          .toLowerCase();

      const passwordHash =
        await bcrypt.hash(
          data.password,
          12
        );

      /*
       * EXISTING DOCTOR PROFILE
       *
       * When existingDoctorId is provided,
       * keep the existing Doctor document.
       *
       * This preserves the Doctor _id,
       * appointments, availability,
       * history and other references.
       */
      if (data.existingDoctorId) {
        const doctor =
          await Doctor.findById(
            data.existingDoctorId
          );

        if (!doctor) {
          return res
            .status(404)
            .json({
              message:
                "The existing doctor profile could not be found.",
            });
        }

        const linkedUser =
          await User.findById(
            doctor.userId
          );

        /*
         * If the existing Doctor already
         * points to a valid doctor User,
         * reuse that User account.
         */
        if (linkedUser) {
          if (
            linkedUser.role !==
            "doctor"
          ) {
            return res
              .status(409)
              .json({
                message:
                  "This doctor profile is linked to an account that is not a doctor account.",
              });
          }

          const emailAlreadyUsed =
            await User.findOne({
              email:
                normalizedEmail,

              _id: {
                $ne:
                  linkedUser._id,
              },
            });

          if (emailAlreadyUsed) {
            return res
              .status(409)
              .json({
                message:
                  "An account with that email already exists.",
              });
          }

          linkedUser.name =
            data.name.trim();

          linkedUser.email =
            normalizedEmail;

          linkedUser.passwordHash =
            passwordHash;

          linkedUser.phone =
            data.phone?.trim() ||
            "";

          linkedUser.role =
            "doctor";

          linkedUser.isActive =
            true;

          await linkedUser.save();

          const populatedDoctor =
            await Doctor.findById(
              doctor._id
            ).populate(
              "userId",
              "name email phone role isActive createdAt"
            );

          return res
            .status(200)
            .json({
              message:
                "Doctor login account updated and linked to the existing profile successfully.",

              doctor:
                populatedDoctor,
            });
        }

        /*
         * The Doctor exists but its
         * old user reference no longer
         * points to a User.
         *
         * Create a new User and attach
         * it to the same Doctor profile.
         */
        const existingUser =
          await User.findOne({
            email:
              normalizedEmail,
          });

        if (existingUser) {
          return res
            .status(409)
            .json({
              message:
                "An account with that email already exists.",
            });
        }

        const user =
          await User.create({
            name:
              data.name.trim(),

            email:
              normalizedEmail,

            passwordHash,

            role:
              "doctor",

            phone:
              data.phone?.trim() ||
              "",

            isActive:
              true,
          });

        const previousUserId =
          doctor.userId;

        try {
          doctor.userId =
            user._id;

          await doctor.save();

          const populatedDoctor =
            await Doctor.findById(
              doctor._id
            ).populate(
              "userId",
              "name email phone role isActive createdAt"
            );

          return res
            .status(201)
            .json({
              message:
                "Doctor login account created and linked to the existing profile successfully.",

              doctor:
                populatedDoctor,
            });
        } catch (error) {
          doctor.userId =
            previousUserId;

          await User.findByIdAndDelete(
            user._id
          );

          throw error;
        }
      }

      /*
       * BRAND-NEW DOCTOR
       *
       * No existingDoctorId means
       * create both a new User and
       * a new Doctor profile.
       */
      const existingUser =
        await User.findOne({
          email:
            normalizedEmail,
        });

      if (existingUser) {
        return res
          .status(409)
          .json({
            message:
              "An account with that email already exists.",
          });
      }

      const user =
        await User.create({
          name:
            data.name.trim(),

          email:
            normalizedEmail,

          passwordHash,

          role:
            "doctor",

          phone:
            data.phone?.trim() ||
            "",

          isActive:
            true,
        });

      try {
        const doctor =
          await Doctor.create({
            userId:
              user._id,

            speciality:
              data.speciality.trim(),

            qualifications:
              data.qualifications,

            biography:
              data.biography.trim(),

            location:
              data.location.trim(),

            registrationInfo:
              data.registrationInfo.trim(),

            photoUrl:
              data.photoUrl.trim(),

            facility:
              data.facility.trim(),

            languages:
              data.languages,

            yearsOfExperience:
              data.yearsOfExperience,

            areasOfCare:
              data.areasOfCare,

            consultationTypes:
              data.consultationTypes,

            consultationFee:
              data.consultationFee,

            currency:
              data.currency,

            isVerified:
              data.isVerified,
          });

        const populatedDoctor =
          await Doctor.findById(
            doctor._id
          ).populate(
            "userId",
            "name email phone role isActive createdAt"
          );

        return res
          .status(201)
          .json({
            message:
              "Doctor account created successfully.",

            doctor:
              populatedDoctor,
          });
      } catch (error) {
        await User.findByIdAndDelete(
          user._id
        );

        throw error;
      }
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  "/doctors/:id",
  async (req, res, next) => {
    try {
      const data =
        updateDoctorSchema.parse(
          req.body
        );

      const doctor =
        await Doctor.findById(
          req.params.id
        );

      if (!doctor) {
        return res
          .status(404)
          .json({
            message:
              "Doctor was not found.",
          });
      }

      const user =
        await User.findById(
          doctor.userId
        );

      if (!user) {
        return res
          .status(404)
          .json({
            message:
              "The doctor's user account was not found.",
          });
      }

      if (
        data.email !==
        undefined
      ) {
        const normalizedEmail =
          data.email
            .trim()
            .toLowerCase();

        const emailAlreadyUsed =
          await User.findOne({
            email:
              normalizedEmail,

            _id: {
              $ne:
                user._id,
            },
          });

        if (emailAlreadyUsed) {
          return res
            .status(409)
            .json({
              message:
                "An account with that email already exists.",
            });
        }

        user.email =
          normalizedEmail;
      }

      if (
        data.name !==
        undefined
      ) {
        user.name =
          data.name.trim();
      }

      if (
        data.phone !==
        undefined
      ) {
        user.phone =
          data.phone.trim();
      }

      if (
        data.speciality !==
        undefined
      ) {
        doctor.speciality =
          data.speciality.trim();
      }

      if (
        data.qualifications !==
        undefined
      ) {
        doctor.qualifications =
          data.qualifications;
      }

      if (
        data.biography !==
        undefined
      ) {
        doctor.biography =
          data.biography.trim();
      }

      if (
        data.location !==
        undefined
      ) {
        doctor.location =
          data.location.trim();
      }

      if (
        data.registrationInfo !==
        undefined
      ) {
        doctor.registrationInfo =
          data.registrationInfo.trim();
      }

      if (
        data.photoUrl !==
        undefined
      ) {
        doctor.photoUrl =
          data.photoUrl.trim();
      }

      if (
        data.facility !==
        undefined
      ) {
        doctor.facility =
          data.facility.trim();
      }

      if (
        data.languages !==
        undefined
      ) {
        doctor.languages =
          data.languages;
      }

      if (
        data.yearsOfExperience !==
        undefined
      ) {
        doctor.yearsOfExperience =
          data.yearsOfExperience;
      }

      if (
        data.areasOfCare !==
        undefined
      ) {
        doctor.areasOfCare =
          data.areasOfCare;
      }

      if (
        data.consultationTypes !==
        undefined
      ) {
        doctor.consultationTypes =
          data.consultationTypes;
      }

      if (
        data.consultationFee !==
        undefined
      ) {
        doctor.consultationFee =
          data.consultationFee;
      }

      if (
        data.currency !==
        undefined
      ) {
        doctor.currency =
          data.currency;
      }

      if (
        data.isVerified !==
        undefined
      ) {
        doctor.isVerified =
          data.isVerified;
      }

      await Promise.all([
        user.save(),
        doctor.save(),
      ]);

      const populatedDoctor =
        await Doctor.findById(
          doctor._id
        ).populate(
          "userId",
          "name email phone role isActive createdAt"
        );

      return res.json({
        message:
          "Doctor profile updated successfully.",

        doctor:
          populatedDoctor,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  "/doctors/:id/status",
  async (req, res, next) => {
    try {
      const data =
        accountStatusSchema.parse(
          req.body
        );

      const doctor =
        await Doctor.findById(
          req.params.id
        );

      if (!doctor) {
        return res
          .status(404)
          .json({
            message:
              "Doctor was not found.",
          });
      }

      const user =
        await User.findById(
          doctor.userId
        );

      if (!user) {
        return res
          .status(404)
          .json({
            message:
              "The doctor's user account was not found.",
          });
      }

      user.isActive =
        data.isActive;

      await user.save();

      const populatedDoctor =
        await Doctor.findById(
          doctor._id
        ).populate(
          "userId",
          "name email phone role isActive createdAt"
        );

      return res.json({
        message:
          data.isActive
            ? "Doctor account reactivated successfully."
            : "Doctor account deactivated successfully.",

        doctor:
          populatedDoctor,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/doctors/:id/reset-password",
  async (req, res, next) => {
    try {
      const data =
        resetPasswordSchema.parse(
          req.body
        );

      const doctor =
        await Doctor.findById(
          req.params.id
        );

      if (!doctor) {
        return res
          .status(404)
          .json({
            message:
              "Doctor was not found.",
          });
      }

      const user =
        await User.findById(
          doctor.userId
        );

      if (!user) {
        return res
          .status(404)
          .json({
            message:
              "The doctor's user account was not found.",
          });
      }

      user.passwordHash =
        await bcrypt.hash(
          data.password,
          12
        );

      await user.save();

      return res.json({
        message:
          "Doctor password reset successfully.",
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;