import { Router } from "express";
import { z } from "zod";

import { Doctor } from "../models/Doctor.js";
import { User } from "../models/User.js";
import { DoctorAvailability } from "../models/DoctorAvailability.js";
import {
  requireAuth,
  requireRole,
} from "../middleware/auth.js";

const router = Router();

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const availabilitySlotSchema = z.object({
  startTime: z
    .string()
    .regex(
      timePattern,
      "Start time must use HH:mm format."
    ),

  endTime: z
    .string()
    .regex(
      timePattern,
      "End time must use HH:mm format."
    ),
});

const availabilitySchema = z.object({
  date: z
    .string()
    .regex(
      datePattern,
      "Date must use YYYY-MM-DD format."
    ),

  slots: z
    .array(availabilitySlotSchema)
    .min(
      1,
      "At least one appointment slot is required."
    ),
});

type AvailabilitySlotInput = z.infer<
  typeof availabilitySlotSchema
>;

function isPastDate(date: string) {
  const today = new Date()
    .toISOString()
    .slice(0, 10);

  return date < today;
}

function validateSlots(
  slots: AvailabilitySlotInput[]
) {
  const sortedSlots = [...slots].sort(
    (a, b) =>
      a.startTime.localeCompare(
        b.startTime
      )
  );

  const seen = new Set<string>();

  for (
    let index = 0;
    index < sortedSlots.length;
    index += 1
  ) {
    const slot = sortedSlots[index];

    if (
      slot.startTime >= slot.endTime
    ) {
      return {
        valid: false,
        message:
          "Each appointment slot must end after it starts.",
      };
    }

    const slotKey =
      `${slot.startTime}-${slot.endTime}`;

    if (seen.has(slotKey)) {
      return {
        valid: false,
        message:
          "Duplicate appointment slots are not allowed.",
      };
    }

    seen.add(slotKey);

    const previousSlot =
      sortedSlots[index - 1];

    if (
      previousSlot &&
      slot.startTime <
        previousSlot.endTime
    ) {
      return {
        valid: false,
        message:
          "Appointment slots cannot overlap.",
      };
    }
  }

  return {
    valid: true,
    message: "",
  };
}

router.get(
  "/",
  async (req, res, next) => {
    try {
      const filter: Record<
        string,
        unknown
      > = {};

      const search =
        typeof req.query.search ===
        "string"
          ? req.query.search.trim()
          : "";

      const speciality =
        typeof req.query.speciality ===
        "string"
          ? req.query.speciality.trim()
          : "";

      const location =
        typeof req.query.location ===
        "string"
          ? req.query.location.trim()
          : "";

      if (speciality) {
        filter.speciality =
          speciality;
      }

      if (location) {
        filter.location =
          location;
      }

      if (search) {
        const escapedSearch =
          search.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          );

        const searchRegex =
          new RegExp(
            escapedSearch,
            "i"
          );

        const matchingUsers =
          await User.find({
            name: searchRegex,
          }).select("_id");

        const matchingUserIds =
          matchingUsers.map(
            (user) => user._id
          );

        filter.$or = [
          {
            speciality:
              searchRegex,
          },
          {
            facility:
              searchRegex,
          },
          {
            location:
              searchRegex,
          },
          {
            userId: {
              $in: matchingUserIds,
            },
          },
        ];
      }

      const doctors =
        await Doctor.find(filter)
          .populate(
            "userId",
            "name email phone"
          )
          .sort({
            createdAt: 1,
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
  "/specialities",
  async (_req, res, next) => {
    try {
      const specialities =
        await Doctor.distinct(
          "speciality"
        );

      const cleanedSpecialities =
        specialities
          .filter(Boolean)
          .sort((a, b) =>
            a.localeCompare(b)
          );

      return res.json({
        specialities:
          cleanedSpecialities,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/locations",
  async (_req, res, next) => {
    try {
      const locations =
        await Doctor.distinct(
          "location"
        );

      const cleanedLocations =
        locations
          .filter(Boolean)
          .sort((a, b) =>
            a.localeCompare(b)
          );

      return res.json({
        locations:
          cleanedLocations,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  "/me",
  requireAuth,
  requireRole("doctor"),
  async (req, res, next) => {
    try {
      const user =
        await User.findByIdAndUpdate(
          req.user!.id,
          {
            name:
              req.body.name,
            phone:
              req.body.phone,
          },
          {
            new: true,
          }
        ).select(
          "-passwordHash"
        );

      const doctor =
        await Doctor.findOneAndUpdate(
          {
            userId:
              req.user!.id,
          },
          {
            speciality:
              req.body.speciality,

            qualifications:
              req.body
                .qualifications || [],

            biography:
              req.body.biography ||
              "",

            location:
              req.body.location ||
              "",

            facility:
              req.body.facility ||
              "",

            languages:
              req.body.languages ||
              [],

            yearsOfExperience:
              req.body
                .yearsOfExperience ??
              0,

            areasOfCare:
              req.body.areasOfCare ||
              [],

            consultationTypes:
              req.body
                .consultationTypes || [
                "In-person",
              ],

            photoUrl:
              req.body.photoUrl ||
              "",
          },
          {
            new: true,
          }
        );

      if (!doctor) {
        return res
          .status(404)
          .json({
            message:
              "Doctor profile not found.",
          });
      }

      return res.json({
        user,
        doctor,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/me/availability",
  requireAuth,
  requireRole("doctor"),
  async (req, res, next) => {
    try {
      const doctor =
        await Doctor.findOne({
          userId:
            req.user!.id,
        });

      if (!doctor) {
        return res
          .status(404)
          .json({
            message:
              "Doctor profile not found.",
          });
      }

      const fromDate =
        typeof req.query.from ===
        "string"
          ? req.query.from
          : new Date()
              .toISOString()
              .slice(0, 10);

      const availability =
        await DoctorAvailability.find({
          doctorId:
            doctor._id,

          date: {
            $gte: fromDate,
          },
        }).sort({
          date: 1,
        });

      return res.json({
        availability,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/availability",
  requireAuth,
  requireRole("doctor"),
  async (req, res, next) => {
    try {
      const doctor =
        await Doctor.findOne({
          userId:
            req.user!.id,
        });

      if (!doctor) {
        return res
          .status(404)
          .json({
            message:
              "Doctor profile not found.",
          });
      }

      const data =
        availabilitySchema.parse(
          req.body
        );

      if (isPastDate(data.date)) {
        return res
          .status(400)
          .json({
            message:
              "Availability cannot be created for a past date.",
          });
      }

      const slotValidation =
        validateSlots(
          data.slots
        );

      if (
        !slotValidation.valid
      ) {
        return res
          .status(400)
          .json({
            message:
              slotValidation.message,
          });
      }

      const existingAvailability =
        await DoctorAvailability.findOne(
          {
            doctorId:
              doctor._id,
            date:
              data.date,
          }
        );

      const existingBookedSlots =
        existingAvailability
          ?.slots.filter(
            (slot) =>
              slot.isBooked
          ) ?? [];

      const requestedSlots =
        data.slots.map(
          (slot) => ({
            startTime:
              slot.startTime,
            endTime:
              slot.endTime,
            isBooked: false,
          })
        );

      const preservedBookedSlots =
        existingBookedSlots.flatMap(
          (slot) => {
            const startTime =
              slot.startTime;

            const endTime =
              slot.endTime;

            if (
              typeof startTime !==
                "string" ||
              typeof endTime !==
                "string"
            ) {
              return [];
            }

            return [
              {
                startTime,
                endTime,
                isBooked: true,
              },
            ];
          }
        );

      const bookedSlotKeys =
        new Set(
          preservedBookedSlots.map(
            (slot) =>
              `${slot.startTime}-${slot.endTime}`
          )
        );

      const safeRequestedSlots =
        requestedSlots.filter(
          (slot) =>
            !bookedSlotKeys.has(
              `${slot.startTime}-${slot.endTime}`
            )
        );

      const finalSlots = [
        ...preservedBookedSlots,
        ...safeRequestedSlots,
      ].sort((a, b) =>
        a.startTime.localeCompare(
          b.startTime
        )
      );

      const finalValidation =
        validateSlots(
          finalSlots
        );

      if (
        !finalValidation.valid
      ) {
        return res
          .status(409)
          .json({
            message:
              "The updated schedule conflicts with an already-booked appointment.",
          });
      }

      const availability =
        await DoctorAvailability.findOneAndUpdate(
          {
            doctorId:
              doctor._id,
            date:
              data.date,
          },
          {
            doctorId:
              doctor._id,

            date:
              data.date,

            slots:
              finalSlots,
          },
          {
            new: true,
            upsert: true,
            runValidators: true,
          }
        );

      return res
        .status(
          existingAvailability
            ? 200
            : 201
        )
        .json({
          availability,
        });
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  "/availability/:date",
  requireAuth,
  requireRole("doctor"),
  async (req, res, next) => {
    try {
      const rawDate =
        req.params.date;

      const date =
        Array.isArray(rawDate)
          ? rawDate[0]
          : rawDate;

      if (
        !date ||
        !datePattern.test(date)
      ) {
        return res
          .status(400)
          .json({
            message:
              "Date must use YYYY-MM-DD format.",
          });
      }

      const doctor =
        await Doctor.findOne({
          userId:
            req.user!.id,
        });

      if (!doctor) {
        return res
          .status(404)
          .json({
            message:
              "Doctor profile not found.",
          });
      }

      const availability =
        await DoctorAvailability.findOne(
          {
            doctorId:
              doctor._id,
            date,
          }
        );

      if (!availability) {
        return res
          .status(404)
          .json({
            message:
              "Availability was not found for this date.",
          });
      }

      const hasBookedSlots =
        availability.slots.some(
          (slot) =>
            slot.isBooked
        );

      if (hasBookedSlots) {
        return res
          .status(409)
          .json({
            message:
              "This date contains booked appointments and cannot be removed.",
          });
      }

      await DoctorAvailability.deleteOne(
        {
          _id:
            availability._id,
        }
      );

      return res.json({
        message:
          "Availability removed successfully.",
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/:id/availability",
  async (req, res, next) => {
    try {
      const fromDate =
        typeof req.query.from ===
        "string"
          ? req.query.from
          : new Date()
              .toISOString()
              .slice(0, 10);

      const availability =
        await DoctorAvailability.find({
          doctorId:
            req.params.id,

          date: {
            $gte: fromDate,
          },
        }).sort({
          date: 1,
        });

      return res.json({
        availability,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/:id",
  async (req, res, next) => {
    try {
      const doctor =
        await Doctor.findById(
          req.params.id
        ).populate(
          "userId",
          "name email phone"
        );

      if (!doctor) {
        return res
          .status(404)
          .json({
            message:
              "Doctor not found.",
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

export default router;