import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },

    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },

    date: {
      type: String,
      required: true,
    },

    startTime: {
      type: String,
      required: true,
    },

    endTime: {
      type: String,
      required: true,
    },

    reason: {
      type: String,
      required: true,
      maxlength: 1000,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "completed",
        "cancelled",
        "rescheduled",
        "no-show",
      ],
      default: "pending",
    },

    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

appointmentSchema.index(
  {
    doctorId: 1,
    date: 1,
    startTime: 1,
  },
  {
    unique: true,

    partialFilterExpression: {
      status: {
        $in: [
          "pending",
          "confirmed",
          "rescheduled",
        ],
      },
    },
  }
);

export const Appointment =
  mongoose.models.Appointment ||
  mongoose.model(
    "Appointment",
    appointmentSchema
  );