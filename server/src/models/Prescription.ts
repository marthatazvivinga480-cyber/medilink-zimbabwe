import mongoose from "mongoose";

const medicineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    dosage: {
      type: String,
      required: true,
      trim: true,
    },

    frequency: {
      type: String,
      required: true,
      trim: true,
    },

    duration: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    _id: true,
  }
);

const prescriptionSchema =
  new mongoose.Schema(
    {
      patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient",
        required: true,
        index: true,
      },

      doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Doctor",
        required: true,
        index: true,
      },

      appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Appointment",
        required: true,
        index: true,
      },

      prescriptionCode: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true,
        index: true,
      },

      medicines: {
        type: [medicineSchema],
        required: true,
        default: [],
      },

      instructions: {
        type: String,
        default: "",
        trim: true,
      },

      issuedAt: {
        type: Date,
        default: Date.now,
      },

      expiresAt: {
        type: Date,
        default: undefined,
      },

      status: {
        type: String,
        default: "valid",
        enum: [
          "valid",
          "dispensed",
          "cancelled",
          "expired",
        ],
      },
    },
    {
      timestamps: true,
    }
  );

export const Prescription =
  mongoose.model(
    "Prescription",
    prescriptionSchema
  );