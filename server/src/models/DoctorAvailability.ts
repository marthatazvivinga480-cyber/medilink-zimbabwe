import mongoose from "mongoose";

const availabilitySchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      index: true,
    },
    date: { type: String, required: true },
    manualOverride: { type: Boolean, default: false },
    slots: [
      {
        startTime: String,
        endTime: String,
        isBooked: { type: Boolean, default: false },
        generated: { type: Boolean, default: false },
        claimToken: String,
      },
    ],
  },
  { timestamps: true },
);

availabilitySchema.index({ doctorId: 1, date: 1 }, { unique: true });

export const DoctorAvailability = mongoose.model(
  "DoctorAvailability",
  availabilitySchema,
);
