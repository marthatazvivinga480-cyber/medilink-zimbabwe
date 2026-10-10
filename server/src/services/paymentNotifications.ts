import { Patient } from "../models/Patient.js";
import { Notification } from "../models/Notification.js";

type PaymentNotice = {
  _id?: unknown;
  patientId?: unknown;
  appointmentId?: unknown;
  status?: string;
  amountPaid?: number;
  amountCovered?: number;
  refundedAmount?: number;
  patientBalance?: number;
  medicalAid?: { claimStatus?: string };
};
export function paymentSnapshot(payment: PaymentNotice) {
  return JSON.stringify([
    payment.status,
    payment.amountPaid,
    payment.amountCovered,
    payment.refundedAmount,
    payment.patientBalance,
    payment.medicalAid?.claimStatus,
  ]);
}
export async function notifyPayment(payment: PaymentNotice) {
  if (!payment.patientId) return;
  try {
    const patient = await Patient.findById(payment.patientId).select("userId");
    if (!patient) return;
    await Notification.create({
      userId: patient.userId,
      type: "payment_updated",
      title: "Payment or medical-aid update",
      message: `Your request is now ${String(payment.status).replaceAll("_", " ")}. Open Payments to review the details.`,
      link: `/dashboard/patient/payments?appointment=${encodeURIComponent(String(payment.appointmentId))}`,
    });
  } catch {
    // A saved reconciliation must not be reported as failed because delivery failed.
    console.error(
      JSON.stringify({
        event: "payment_notification_failed",
        paymentId: String(payment._id),
      }),
    );
  }
}
