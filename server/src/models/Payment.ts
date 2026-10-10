import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
    },

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

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      enum: [
        "USD",
        "ZWG",
      ],
      default: "USD",
      required: true,
    },

    method: {
      type: String,
      enum: [
        "ecocash",
        "onemoney",
        "card",
        "bank_transfer",
        "zipit",
        "medical_aid",
      ],
      required: true,
    },

    status: {
      type: String,
      enum: [
        "unpaid",
        "pending",
        "paid",
        "partially_paid",
        "failed",
        "refunded",
        "medical_aid_pending",
        "medical_aid_approved",
        "medical_aid_declined",
      ],
      default: "unpaid",
      required: true,
      index: true,
    },

    transactionReference: {
      type: String,
      trim: true,
      default: "",
    },

    gatewayReference: {
      type: String,
      trim: true,
      default: "",
    },

    provider: {
      type: String,
      trim: true,
      default: "",
    },

    amountPaid: {
      type: Number,
      default: 0,
      min: 0,
    },

    amountCovered: {
      type: Number,
      default: 0,
      min: 0,
    },

    patientBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    medicalAid: {
      provider: {
        type: String,
        trim: true,
        default: "",
      },

      membershipNumber: {
        type: String,
        trim: true,
        default: "",
      },

      claimReference: {
        type: String,
        trim: true,
        default: "",
      },

      claimStatus: {
        type: String,
        enum: [
          "",
          "pending_verification",
          "approved",
          "partially_covered",
          "declined",
          "settled",
        ],
        default: "",
      },
    },

    paymentDate: {
      type: Date,
      default: null,
    },

    receiptNumber: {
      type: String,
      trim: true,
      default: "",
    },

    failureReason: {
      type: String,
      trim: true,
      default: "",
    },

    refundedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  }
);

paymentSchema.index(
  {
    appointmentId: 1,
  },
  {
    unique: true,
  }
);

paymentSchema.index({
  patientId: 1,
  createdAt: -1,
});

paymentSchema.index({
  doctorId: 1,
  createdAt: -1,
});

export const Payment =
  mongoose.models.Payment ||
  mongoose.model(
    "Payment",
    paymentSchema
  );