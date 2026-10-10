import { notifyPayment, paymentSnapshot } from "../services/paymentNotifications.js";
import { resolvePaymentAmounts } from "../services/paymentAmounts.js";
import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";

import {
  requireAuth,
  requireRole,
} from "../middleware/auth.js";

import { Appointment } from "../models/Appointment.js";
import { Doctor } from "../models/Doctor.js";
import { Patient } from "../models/Patient.js";
import { Payment } from "../models/Payment.js";

const router = Router();

const paymentMethodSchema = z.enum([
  "ecocash",
  "onemoney",
  "card",
  "bank_transfer",
  "zipit",
  "medical_aid",
]);

const createPaymentSchema = z.object({
  appointmentId: z.string().min(1),

  method: paymentMethodSchema,

  provider: z
    .string()
    .trim()
    .max(120)
    .optional()
    .default(""),

  transactionReference: z
    .string()
    .trim()
    .max(150)
    .optional()
    .default(""),

  medicalAid: z
    .object({
      provider: z
        .string()
        .trim()
        .max(120)
        .optional()
        .default(""),

      membershipNumber: z
        .string()
        .trim()
        .max(120)
        .optional()
        .default(""),

      claimReference: z
        .string()
        .trim()
        .max(150)
        .optional()
        .default(""),
    })
    .optional(),
});

const adminStatusSchema = z.object({
  expectedVersion: z.number().int().min(0).optional(),
  status: z.enum([
    "unpaid",
    "pending",
    "paid",
    "partially_paid",
    "failed",
    "refunded",
    "medical_aid_pending",
    "medical_aid_approved",
    "medical_aid_declined",
  ]),

  transactionReference: z
    .string()
    .trim()
    .max(150)
    .optional(),

  gatewayReference: z
    .string()
    .trim()
    .max(150)
    .optional(),

  provider: z
    .string()
    .trim()
    .max(120)
    .optional(),

  amountPaid: z
    .number()
    .min(0)
    .optional(),

  amountCovered: z
    .number()
    .min(0)
    .optional(),

  refundedAmount: z
    .number()
    .min(0)
    .optional(),

  receiptNumber: z
    .string()
    .trim()
    .max(150)
    .optional(),

  failureReason: z
    .string()
    .trim()
    .max(500)
    .optional(),

  medicalAidClaimStatus: z
    .enum([
      "",
      "pending_verification",
      "approved",
      "partially_covered",
      "declined",
      "settled",
    ])
    .optional(),

  medicalAidClaimReference: z
    .string()
    .trim()
    .max(150)
    .optional(),
});

function isValidObjectId(value: string) {
  return mongoose.Types.ObjectId.isValid(value);
}

/**
 * POST /api/payments
 *
 * Creates a payment record for an appointment owned
 * by the currently authenticated patient.
 *
 * This does not contact a real payment gateway yet.
 * It prepares the MediLink payment transaction that
 * can later be connected to Paynow, EcoCash, OneMoney,
 * bank/card gateways or medical aid processing.
 */
router.post(
  "/",
  requireAuth,
  requireRole("patient"),
  async (req, res) => {
    try {
      const parsed =
        createPaymentSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          message: "Invalid payment information.",
          errors: parsed.error.flatten(),
        });
      }

      const {
        appointmentId,
        method,
        provider,
        transactionReference,
        medicalAid,
      } = parsed.data;

      if (!isValidObjectId(appointmentId)) {
        return res.status(400).json({
          message: "Invalid appointment ID.",
        });
      }

      const patient = await Patient.findOne({
        userId: req.user!.id,
      });

      if (!patient) {
        return res.status(404).json({
          message: "Patient profile not found.",
        });
      }

      const appointment =
        await Appointment.findById(
          appointmentId
        );

      if (!appointment) {
        return res.status(404).json({
          message: "Appointment not found.",
        });
      }

      if (
        appointment.patientId.toString() !==
        patient._id.toString()
      ) {
        return res.status(403).json({
          message:
            "You cannot create a payment for this appointment.",
        });
      }

      if (
        appointment.status === "cancelled" ||
        appointment.status === "no-show"
      ) {
        return res.status(400).json({
          message:
            "Payment cannot be created for this appointment.",
        });
      }

      const existingPayment =
        await Payment.findOne({
          appointmentId: appointment._id,
        });

      if (existingPayment) {
        return res.status(409).json({
          message:
            "A payment already exists for this appointment.",
          payment: existingPayment,
        });
      }

      const doctor = await Doctor.findById(
        appointment.doctorId
      );

      if (!doctor) {
        return res.status(404).json({
          message: "Doctor profile not found.",
        });
      }

      const consultationFee =
        Number(doctor.consultationFee ?? 0);

      if (consultationFee <= 0) {
        return res.status(400).json({
          message:
            "The consultation fee has not been configured for this doctor.",
        });
      }

      const currency =
        doctor.currency === "ZWG"
          ? "ZWG"
          : "USD";

      if (method === "medical_aid") {
        if (
          !medicalAid?.provider ||
          !medicalAid?.membershipNumber
        ) {
          return res.status(400).json({
            message:
              "Medical aid provider and membership number are required.",
          });
        }
      }

      let status:
        | "pending"
        | "medical_aid_pending" =
        "pending";

      if (method === "medical_aid") {
        status = "medical_aid_pending";
      }

      const payment = await Payment.create({
        appointmentId:
          appointment._id,

        patientId:
          patient._id,

        doctorId:
          doctor._id,

        amount:
          consultationFee,

        currency,

        method,

        status,

        provider:
          provider ?? "",

        transactionReference:
          transactionReference ?? "",

        gatewayReference: "",

        amountPaid: 0,

        amountCovered: 0,

        patientBalance:
          consultationFee,

        medicalAid: {
          provider:
            method === "medical_aid"
              ? medicalAid?.provider ?? ""
              : "",

          membershipNumber:
            method === "medical_aid"
              ? medicalAid?.membershipNumber ??
                ""
              : "",

          claimReference:
            method === "medical_aid"
              ? medicalAid?.claimReference ?? ""
              : "",

          claimStatus:
            method === "medical_aid"
              ? "pending_verification"
              : "",
        },

        paymentDate: null,

        receiptNumber: "",

        failureReason: "",

        refundedAmount: 0,
      });

      await notifyPayment(payment);
      return res.status(201).json({
        message:
          method === "medical_aid"
            ? "Medical aid claim submitted."
            : "Payment initiated successfully.",

        payment,
      });
    } catch (error) {
      console.error("Create payment error:");

      if (
        error instanceof Error &&
        "code" in error &&
        (error as { code?: number }).code ===
          11000
      ) {
        return res.status(409).json({
          message:
            "A payment already exists for this appointment.",
        });
      }

      return res.status(500).json({
        message:
          "Could not create payment.",
      });
    }
  }
);

/**
 * GET /api/payments/mine
 *
 * Returns payment history for the signed-in patient.
 */
router.get(
  "/mine",
  requireAuth,
  requireRole("patient"),
  async (req, res) => {
    try {
      const patient = await Patient.findOne({
        userId: req.user!.id,
      });

      if (!patient) {
        return res.status(404).json({
          message: "Patient profile not found.",
        });
      }

      const payments = await Payment.find({
        patientId: patient._id,
      })
        .populate({
          path: "appointmentId",
        })
        .populate({
          path: "doctorId",
          populate: {
            path: "userId",
            select: "name email",
          },
        })
        .sort({
          createdAt: -1,
        });

      return res.json({
        payments,
      });
    } catch (error) {
      console.error("Get patient payments error:");

      return res.status(500).json({
        message:
          "Could not load payment history.",
      });
    }
  }
);

/**
 * GET /api/payments/appointment/:appointmentId
 *
 * Returns the payment attached to a patient's
 * appointment.
 */
router.get(
  "/appointment/:appointmentId",
  requireAuth,
  requireRole("patient"),
  async (req, res) => {
    try {
      const appointmentId = String(
        req.params.appointmentId ?? ""
      );

      if (!isValidObjectId(appointmentId)) {
        return res.status(400).json({
          message: "Invalid appointment ID.",
        });
      }

      const patient = await Patient.findOne({
        userId: req.user!.id,
      });

      if (!patient) {
        return res.status(404).json({
          message: "Patient profile not found.",
        });
      }

      const appointment =
        await Appointment.findById(
          appointmentId
        );

      if (!appointment) {
        return res.status(404).json({
          message: "Appointment not found.",
        });
      }

      if (
        appointment.patientId.toString() !==
        patient._id.toString()
      ) {
        return res.status(403).json({
          message:
            "You cannot view payment details for this appointment.",
        });
      }

      const payment =
        await Payment.findOne({
          appointmentId:
            appointment._id,
        })
          .populate({
            path: "doctorId",
            populate: {
              path: "userId",
              select: "name email",
            },
          });

      return res.json({
        payment: payment ?? null,
      });
    } catch (error) {
      console.error("Get appointment payment error:");

      return res.status(500).json({
        message:
          "Could not load appointment payment.",
      });
    }
  }
);

/**
 * GET /api/payments/doctor
 *
 * Allows a doctor to see payment information for
 * their appointments.
 */
router.get(
  "/doctor",
  requireAuth,
  requireRole("doctor"),
  async (req, res) => {
    try {
      const doctor = await Doctor.findOne({
        userId: req.user!.id,
      });

      if (!doctor) {
        return res.status(404).json({
          message: "Doctor profile not found.",
        });
      }

      const payments = await Payment.find({
        doctorId: doctor._id,
      })
        .populate({
          path: "appointmentId",
        })
        .populate({
          path: "patientId",
          populate: {
            path: "userId",
            select: "name email",
          },
        })
        .sort({
          createdAt: -1,
        });

      return res.json({
        payments,
      });
    } catch (error) {
      console.error("Get doctor payments error:");

      return res.status(500).json({
        message:
          "Could not load doctor payments.",
      });
    }
  }
);

/**
 * GET /api/payments/admin
 *
 * Admin payment overview.
 */
router.get(
  "/admin",
  requireAuth,
  requireRole("admin"),
  async (_req, res) => {
    try {
      const payments = await Payment.find()
        .populate({
          path: "appointmentId",
        })
        .populate({
          path: "patientId",
          populate: {
            path: "userId",
            select: "name email",
          },
        })
        .populate({
          path: "doctorId",
          populate: {
            path: "userId",
            select: "name email",
          },
        })
        .sort({
          createdAt: -1,
        });

      const totals = payments.reduce(
        (
          summary,
          payment
        ) => {
          summary.total += 1;

          if (
            payment.status ===
            "paid"
          ) {
            summary.paid += 1;
          }

          if (
            payment.status ===
              "pending" ||
            payment.status ===
              "medical_aid_pending"
          ) {
            summary.pending += 1;
          }

          if (
            payment.status ===
            "failed"
          ) {
            summary.failed += 1;
          }

          if (
            payment.status ===
              "partially_paid" ||
            (
              payment.status ===
                "medical_aid_approved" &&
              payment.patientBalance > 0
            )
          ) {
            summary.partial += 1;
          }

          return summary;
        },
        {
          total: 0,
          paid: 0,
          pending: 0,
          failed: 0,
          partial: 0,
        }
      );

      return res.json({
        payments,
        totals,
      });
    } catch (error) {
      console.error("Get admin payments error:");

      return res.status(500).json({
        message:
          "Could not load payments.",
      });
    }
  }
);

/**
 * PATCH /api/payments/:id/status
 *
 * Admin/manual reconciliation endpoint.
 *
 * This is useful for the portfolio/demo system.
 * Later, real gateway callbacks/webhooks should update
 * payment state automatically.
 */
router.patch(
  "/:id/status",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const id = String(
        req.params.id ?? ""
      );

      if (!isValidObjectId(id)) {
        return res.status(400).json({
          message: "Invalid payment ID.",
        });
      }

      const parsed =
        adminStatusSchema.safeParse(
          req.body
        );

      if (!parsed.success) {
        return res.status(400).json({
          message:
            "Invalid payment status information.",
          errors:
            parsed.error.flatten(),
        });
      }

      const payment =
        await Payment.findById(id);

      if (!payment) {
        return res.status(404).json({
          message: "Payment not found.",
        });
      }

      if (parsed.data.expectedVersion !== undefined && parsed.data.expectedVersion !== (payment.__v ?? 0)) {
        return res.status(409).json({ message: "This payment changed. Refresh before saving your review." });
      }
      const previousState = paymentSnapshot(payment);
      const {
        status,
        transactionReference,
        gatewayReference,
        provider,
        amountPaid,
        amountCovered,
        refundedAmount,
        receiptNumber,
        failureReason,
        medicalAidClaimStatus,
        medicalAidClaimReference,
      } = parsed.data;

      const amounts = resolvePaymentAmounts({
        amount: payment.amount,
        amountPaid: Number(payment.amountPaid ?? 0),
        amountCovered: Number(payment.amountCovered ?? 0),
      }, { status, amountPaid, amountCovered });
      if ("error" in amounts) {
        return res.status(400).json({ message: amounts.error });
      }
      const nextAmountPaid = amounts.paid;
      const nextAmountCovered = amounts.covered;

      const nextRefund = refundedAmount ?? Number(payment.refundedAmount ?? 0);
      const resolvedRefund = status === "refunded" && nextRefund <= 0 ? nextAmountPaid : nextRefund;
      if (resolvedRefund > nextAmountPaid) {
        return res.status(400).json({ message: "Refund amount cannot exceed the amount paid, including previously recorded refunds." });
      }
      if (status === "refunded" && resolvedRefund <= 0) {
        return res.status(400).json({ message: "A refund requires a recorded patient payment." });
      }
      payment.status = status;

      payment.amountPaid =
        nextAmountPaid;

      payment.amountCovered =
        nextAmountCovered;

      payment.patientBalance = amounts.balance;

      if (
        transactionReference !==
        undefined
      ) {
        payment.transactionReference =
          transactionReference;
      }

      if (
        gatewayReference !==
        undefined
      ) {
        payment.gatewayReference =
          gatewayReference;
      }

      if (provider !== undefined) {
        payment.provider =
          provider;
      }

      if (
        receiptNumber !==
        undefined
      ) {
        payment.receiptNumber =
          receiptNumber;
      }

      if (
        failureReason !==
        undefined
      ) {
        payment.failureReason =
          failureReason;
      }

      if (
        refundedAmount !==
        undefined
      ) {
        if (
          refundedAmount >
          payment.amountPaid
        ) {
          return res.status(400).json({
            message:
              "Refund amount cannot exceed the amount paid.",
          });
        }

        payment.refundedAmount =
          refundedAmount;
      }

      if (
        medicalAidClaimStatus !==
        undefined
      ) {
        payment.medicalAid.claimStatus =
          medicalAidClaimStatus;
      }

      if (
        medicalAidClaimReference !==
        undefined
      ) {
        payment.medicalAid.claimReference =
          medicalAidClaimReference;
      }

      if (
        status === "paid"
      ) {
        // Amounts were validated above; never erase medical-aid attribution.

        payment.paymentDate =
          new Date();

        payment.failureReason = "";
      }

      if (
        status ===
        "medical_aid_approved"
      ) {
        payment.medicalAid.claimStatus =
          payment.patientBalance > 0
            ? "partially_covered"
            : "approved";

        if (
          payment.patientBalance === 0
        ) {
          payment.paymentDate =
            new Date();
        }
      }

      if (status === "medical_aid_declined") payment.medicalAid.claimStatus = "declined";

      if (
        status === "failed" ||
        status ===
          "medical_aid_declined"
      ) {
        payment.paymentDate = null;
      }

      if (
        status === "refunded"
      ) {
        if (
          payment.refundedAmount <= 0
        ) {
          payment.refundedAmount =
            payment.amountPaid;
        }
      }

      await payment.save();
      if (paymentSnapshot(payment) !== previousState) await notifyPayment(payment);

      return res.json({
        message:
          "Payment status updated successfully.",
        payment,
      });
    } catch (error) {
      if (error instanceof mongoose.Error.VersionError) return res.status(409).json({ message: "This payment changed. Refresh before saving your review." });
      console.error("Payment reconciliation failed");

      return res.status(500).json({
        message:
          "Could not update payment status.",
      });
    }
  }
);

export default router;