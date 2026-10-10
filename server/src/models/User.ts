import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    passwordHash: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: [
        "patient",
        "doctor",
        "pharmacy",
        "admin",
      ],
      required: true,
    },

    phone: {
      type: String,
      default: "",
    },

    sessionVersion: { type: Number, default: 0, min: 0 },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Invalidate previously issued sessions on security-sensitive account changes.
// A database increment also covers concurrent password-reset saves.
userSchema.pre("save", function () {
  if (!this.isNew && (
    this.isModified("passwordHash") || this.isModified("role") ||
    (this.isModified("isActive") && this.isActive === false)
  )) {
    this.$inc("sessionVersion", 1);
  }
});

export const User = mongoose.model(
  "User",
  userSchema
);