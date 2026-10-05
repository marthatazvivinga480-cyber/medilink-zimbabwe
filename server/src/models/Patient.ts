import mongoose from "mongoose";

const patientSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      required: true,
    },

    dateOfBirth: {
      type: Date,
      default: null,
    },

    address: {
      type: String,
      default: "",
      trim: true,
    },

    preferredLanguage: {
      type: String,
      default: "",
      trim: true,
    },

    emergencyContact: {
      name: {
        type: String,
        default: "",
        trim: true,
      },

      phone: {
        type: String,
        default: "",
        trim: true,
      },

      relationship: {
        type: String,
        default: "",
        trim: true,
      },
    },

    bloodGroup: {
      type: String,
      default: "",
      trim: true,
    },

    allergies: {
      type: [String],
      default: [],
    },

    existingConditions: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const Patient =
  mongoose.models.Patient ||
  mongoose.model(
    "Patient",
    patientSchema
  );