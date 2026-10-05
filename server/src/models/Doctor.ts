import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      required: true,
    },

    speciality: {
      type: String,
      required: true,
      trim: true,
    },

    qualifications: {
      type: [String],
      default: [],
    },

    biography: {
      type: String,
      default: "",
    },

    location: {
      type: String,
      default: "",
    },

    registrationInfo: {
      type: String,
      default: "",
    },

    photoUrl: {
      type: String,
      default: "",
    },

    facility: {
      type: String,
      default: "",
    },

    languages: {
      type: [String],
      default: [],
    },

    yearsOfExperience: {
      type: Number,
      default: 0,
      min: 0,
    },

    areasOfCare: {
      type: [String],
      default: [],
    },

    consultationTypes: {
      type: [String],
      default: ["In-person"],
    },

    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Doctor = mongoose.model("Doctor", doctorSchema);