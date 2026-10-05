import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileCheck2,
  Landmark,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  WalletCards,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router-dom";

import { api } from "../services/api";

type PaymentMethod =
  | "ecocash"
  | "onemoney"
  | "card"
  | "bank_transfer"
  | "zipit"
  | "medical_aid";

type PaymentStatus =
  | "unpaid"
  | "pending"
  | "paid"
  | "partially_paid"
  | "failed"
  | "refunded"
  | "medical_aid_pending"
  | "medical_aid_approved"
  | "medical_aid_declined";

type DoctorUser = {
  _id: string;
  name: string;
  email?: string;
};

type Doctor = {
  _id: string;
  userId?: DoctorUser;
  speciality?: string;
  facility?: string;
  location?: string;
  consultationFee?: number;
  currency?: "USD" | "ZWG";
};

type AppointmentDoctor =
  | string
  | {
      _id: string;
      userId?: DoctorUser;
      speciality?: string;
      facility?: string;
      location?: string;
      consultationFee?: number;
      currency?: "USD" | "ZWG";
    };

type Appointment = {
  _id: string;
  doctorId: AppointmentDoctor;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
  status:
    | "pending"
    | "confirmed"
    | "completed"
    | "cancelled"
    | "rescheduled"
    | "no-show";
};

type PaymentAppointment =
  | string
  | {
      _id: string;
      date?: string;
      startTime?: string;
      endTime?: string;
      reason?: string;
      status?: string;
    };

type MedicalAid = {
  provider?: string;
  membershipNumber?: string;
  claimReference?: string;
  claimStatus?:
    | ""
    | "pending_verification"
    | "approved"
    | "partially_covered"
    | "declined"
    | "settled";
};

type Payment = {
  _id: string;
  appointmentId: PaymentAppointment;
  doctorId: string | Doctor;
  amount: number;
  currency: "USD" | "ZWG";
  method: PaymentMethod;
  status: PaymentStatus;
  transactionReference?: string;
  gatewayReference?: string;
  provider?: string;
  amountPaid: number;
  amountCovered: number;
  patientBalance: number;
  medicalAid?: MedicalAid;
  paymentDate?: string | null;
  receiptNumber?: string;
  failureReason?: string;
  refundedAmount?: number;
  createdAt: string;
  updatedAt?: string;
};

type PaymentMethodOption = {
  value: PaymentMethod;
  label: string;
  description: string;
};

const paymentMethods: PaymentMethodOption[] = [
  {
    value: "ecocash",
    label: "EcoCash",
    description:
      "Create an EcoCash payment request.",
  },
  {
    value: "onemoney",
    label: "OneMoney",
    description:
      "Create a OneMoney payment request.",
  },
  {
    value: "card",
    label: "Card",
    description:
      "Prepare a debit or credit card payment.",
  },
  {
    value: "bank_transfer",
    label: "Bank transfer",
    description:
      "Pay using a supported bank transfer.",
  },
  {
    value: "zipit",
    label: "ZIPIT",
    description:
      "Prepare a ZIPIT payment.",
  },
  {
    value: "medical_aid",
    label: "Medical aid",
    description:
      "Submit medical aid details for review.",
  },
];

function getAppointmentId(
  appointmentId: PaymentAppointment
) {
  return typeof appointmentId === "string"
    ? appointmentId
    : appointmentId._id;
}

function getDoctorId(
  doctorId: AppointmentDoctor
) {
  return typeof doctorId === "string"
    ? doctorId
    : doctorId._id;
}

function getDoctorName(
  doctor: AppointmentDoctor | string | Doctor
) {
  if (typeof doctor === "string") {
    return "Doctor";
  }

  return (
    doctor.userId?.name ||
    "Doctor"
  );
}

function getDoctorSpeciality(
  doctor: AppointmentDoctor | string | Doctor
) {
  if (typeof doctor === "string") {
    return "";
  }

  return doctor.speciality || "";
}

function formatMoney(
  amount: number,
  currency: string
) {
  return `${currency} ${Number(
    amount || 0
  ).toFixed(2)}`;
}

function formatDate(date?: string) {
  if (!date) {
    return "Date unavailable";
  }

  const parsed = new Date(
    `${date}T00:00:00`
  );

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat(
    "en-ZW",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(parsed);
}

function formatDateTime(date?: string) {
  if (!date) {
    return "Not available";
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat(
    "en-ZW",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(parsed);
}

function paymentMethodLabel(
  method: PaymentMethod
) {
  const item = paymentMethods.find(
    (paymentMethod) =>
      paymentMethod.value === method
  );

  return item?.label || method;
}

function statusLabel(
  status: PaymentStatus
) {
  const labels: Record<
    PaymentStatus,
    string
  > = {
    unpaid: "Unpaid",
    pending: "Pending",
    paid: "Paid",
    partially_paid: "Partially paid",
    failed: "Failed",
    refunded: "Refunded",
    medical_aid_pending:
      "Medical aid pending",
    medical_aid_approved:
      "Medical aid approved",
    medical_aid_declined:
      "Medical aid declined",
  };

  return labels[status];
}

function statusClasses(
  status: PaymentStatus
) {
  switch (status) {
    case "paid":
    case "medical_aid_approved":
      return "border-[#BFE6D8] bg-[#ECF9F4] text-[#1A7258]";

    case "pending":
    case "medical_aid_pending":
      return "border-[#F2D8A7] bg-[#FFF8E8] text-[#946313]";

    case "partially_paid":
      return "border-[#C9DDF5] bg-[#F0F6FD] text-[#315F90]";

    case "failed":
    case "medical_aid_declined":
      return "border-[#F0C4C4] bg-[#FFF2F2] text-[#A43A3A]";

    case "refunded":
      return "border-[#D9D4EF] bg-[#F6F4FC] text-[#65569B]";

    default:
      return "border-[#DCE5EA] bg-[#F5F8FA] text-[#60727F]";
  }
}

function methodIcon(
  method: PaymentMethod
) {
  switch (method) {
    case "ecocash":
    case "onemoney":
      return Smartphone;

    case "bank_transfer":
    case "zipit":
      return Landmark;

    case "medical_aid":
      return ShieldCheck;

    case "card":
    default:
      return CreditCard;
  }
}

export default function Payments() {
  const [payments, setPayments] =
    useState<Payment[]>([]);

  const [appointments, setAppointments] =
    useState<Appointment[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [selectedAppointmentId, setSelectedAppointmentId] =
    useState("");

  const [selectedMethod, setSelectedMethod] =
    useState<PaymentMethod>("ecocash");

  const [medicalAidProvider, setMedicalAidProvider] =
    useState("");

  const [
    medicalAidMembershipNumber,
    setMedicalAidMembershipNumber,
  ] = useState("");

  const [
    medicalAidClaimReference,
    setMedicalAidClaimReference,
  ] = useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const [success, setSuccess] =
    useState("");

  async function loadData(
    showRefresh = false
  ) {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const [
        paymentsResponse,
        appointmentsResponse,
      ] = await Promise.all([
        api.get("/payments/mine"),
        api.get("/appointments/mine"),
      ]);

      setPayments(
        paymentsResponse.data.payments || []
      );

      setAppointments(
        appointmentsResponse.data.appointments ||
          []
      );
    } catch (requestError) {
      console.error(
        "Could not load payments:",
        requestError
      );

      setError(
        "We could not load your payments. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const paidAppointmentIds =
    useMemo(() => {
      return new Set(
        payments.map((payment) =>
          getAppointmentId(
            payment.appointmentId
          )
        )
      );
    }, [payments]);

  const eligibleAppointments =
    useMemo(() => {
      return appointments.filter(
        (appointment) => {
          if (
            paidAppointmentIds.has(
              appointment._id
            )
          ) {
            return false;
          }

          if (
            appointment.status ===
              "cancelled" ||
            appointment.status ===
              "no-show"
          ) {
            return false;
          }

          return true;
        }
      );
    }, [
      appointments,
      paidAppointmentIds,
    ]);

  const selectedAppointment =
    useMemo(() => {
      return eligibleAppointments.find(
        (appointment) =>
          appointment._id ===
          selectedAppointmentId
      );
    }, [
      eligibleAppointments,
      selectedAppointmentId,
    ]);

  const totalPaid =
    useMemo(() => {
      return payments.reduce(
        (sum, payment) =>
          sum +
          Number(
            payment.amountPaid || 0
          ) +
          Number(
            payment.amountCovered || 0
          ),
        0
      );
    }, [payments]);

  const outstandingBalance =
    useMemo(() => {
      return payments.reduce(
        (sum, payment) =>
          sum +
          Number(
            payment.patientBalance || 0
          ),
        0
      );
    }, [payments]);

  const pendingCount =
    payments.filter((payment) =>
      [
        "pending",
        "medical_aid_pending",
        "partially_paid",
      ].includes(payment.status)
    ).length;

  async function createPayment() {
    setError("");
    setSuccess("");

    if (!selectedAppointmentId) {
      setError(
        "Choose an appointment before creating a payment."
      );

      return;
    }

    if (
      selectedMethod ===
      "medical_aid"
    ) {
      if (
        !medicalAidProvider.trim() ||
        !medicalAidMembershipNumber.trim()
      ) {
        setError(
          "Enter your medical aid provider and membership number."
        );

        return;
      }
    }

    setSubmitting(true);

    try {
      const payload: {
        appointmentId: string;
        method: PaymentMethod;
        provider?: string;
        medicalAid?: {
          provider: string;
          membershipNumber: string;
          claimReference?: string;
        };
      } = {
        appointmentId:
          selectedAppointmentId,
        method:
          selectedMethod,
      };

      if (
        selectedMethod ===
        "ecocash"
      ) {
        payload.provider =
          "EcoCash";
      }

      if (
        selectedMethod ===
        "onemoney"
      ) {
        payload.provider =
          "OneMoney";
      }

      if (
        selectedMethod ===
        "bank_transfer"
      ) {
        payload.provider =
          "Bank transfer";
      }

      if (
        selectedMethod ===
        "zipit"
      ) {
        payload.provider =
          "ZIPIT";
      }

      if (
        selectedMethod ===
        "card"
      ) {
        payload.provider =
          "Card";
      }

      if (
        selectedMethod ===
        "medical_aid"
      ) {
        payload.provider =
          medicalAidProvider.trim();

        payload.medicalAid = {
          provider:
            medicalAidProvider.trim(),

          membershipNumber:
            medicalAidMembershipNumber.trim(),

          claimReference:
            medicalAidClaimReference.trim() ||
            undefined,
        };
      }

      await api.post(
        "/payments",
        payload
      );

      setSuccess(
        selectedMethod ===
          "medical_aid"
          ? "Your medical aid claim has been submitted for review."
          : "Your payment request has been created successfully."
      );

      setSelectedAppointmentId("");
      setSelectedMethod("ecocash");
      setMedicalAidProvider("");
      setMedicalAidMembershipNumber("");
      setMedicalAidClaimReference("");

      await loadData(true);
    } catch (
      requestError: unknown
    ) {
      console.error(
        "Could not create payment:",
        requestError
      );

      let message =
        "We could not create the payment. Please try again.";

      if (
        typeof requestError ===
          "object" &&
        requestError !== null &&
        "response" in requestError
      ) {
        const responseError =
          requestError as {
            response?: {
              data?: {
                message?: string;
              };
            };
          };

        if (
          responseError.response?.data
            ?.message
        ) {
          message =
            responseError.response.data.message;
        }
      }

      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F5FAFB]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="card p-8">
            <div className="flex items-center gap-3 text-sm text-[#647683]">
              <RefreshCw
                size={18}
                className="animate-spin"
              />
              Loading your payments...
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5FAFB]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link
              to="/dashboard/patient"
              className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[#657783] transition hover:text-teal"
            >
              <ArrowLeft size={17} />
              Back to dashboard
            </Link>

            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-teal">
              Patient payments
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-navy sm:text-4xl">
              Payments & medical aid
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#657783] sm:text-base">
              Review consultation charges,
              payment status and medical aid
              claims linked to your appointments.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadData(true)
            }
            disabled={refreshing}
            className="btn-secondary gap-2 self-start lg:self-auto"
          >
            <RefreshCw
              size={17}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-[#F0C4C4] bg-[#FFF4F4] p-4 text-sm text-[#943C3C]">
            <AlertCircle
              size={19}
              className="mt-0.5 shrink-0"
            />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-[#BFE6D8] bg-[#ECF9F4] p-4 text-sm text-[#1A7258]">
            <CheckCircle2
              size={19}
              className="mt-0.5 shrink-0"
            />
            <span>{success}</span>
          </div>
        )}

        <section className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="card p-5">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#ECF8FA] text-teal">
              <WalletCards size={20} />
            </div>

            <p className="text-sm text-[#71818C]">
              Payment records
            </p>

            <p className="mt-1 text-2xl font-bold text-navy">
              {payments.length}
            </p>
          </div>

          <div className="card p-5">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF8E8] text-[#A36A12]">
              <Clock3 size={20} />
            </div>

            <p className="text-sm text-[#71818C]">
              Pending
            </p>

            <p className="mt-1 text-2xl font-bold text-navy">
              {pendingCount}
            </p>
          </div>

          <div className="card p-5">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#ECF9F4] text-[#1A7258]">
              <CheckCircle2 size={20} />
            </div>

            <p className="text-sm text-[#71818C]">
              Paid / covered
            </p>

            <p className="mt-1 text-2xl font-bold text-navy">
              USD{" "}
              {totalPaid.toFixed(2)}
            </p>
          </div>

          <div className="card p-5">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#F4F3FB] text-[#65569B]">
              <ReceiptText size={20} />
            </div>

            <p className="text-sm text-[#71818C]">
              Outstanding
            </p>

            <p className="mt-1 text-2xl font-bold text-navy">
              USD{" "}
              {outstandingBalance.toFixed(
                2
              )}
            </p>
          </div>
        </section>

        <div className="grid gap-7 xl:grid-cols-[0.95fr_1.4fr]">
          <section className="card h-fit overflow-hidden">
            <div className="border-b border-[#E2EBEF] px-5 py-5 sm:px-6">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-teal">
                New payment
              </p>

              <h2 className="mt-1 text-xl font-bold text-navy">
                Pay for an appointment
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#71818C]">
                Choose an appointment and a
                payment method. Real gateway
                processing will be connected
                separately.
              </p>
            </div>

            <div className="space-y-6 p-5 sm:p-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-navy">
                  Appointment
                </label>

                <select
                  className="field"
                  value={
                    selectedAppointmentId
                  }
                  onChange={(event) =>
                    setSelectedAppointmentId(
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    Select appointment
                  </option>

                  {eligibleAppointments.map(
                    (appointment) => {
                      const doctor =
                        appointment.doctorId;

                      const doctorName =
                        getDoctorName(
                          doctor
                        );

                      return (
                        <option
                          key={
                            appointment._id
                          }
                          value={
                            appointment._id
                          }
                        >
                          {doctorName} —{" "}
                          {formatDate(
                            appointment.date
                          )}{" "}
                          at{" "}
                          {
                            appointment.startTime
                          }
                        </option>
                      );
                    }
                  )}
                </select>

                {eligibleAppointments.length ===
                  0 && (
                  <p className="mt-2 text-xs leading-5 text-[#82919B]">
                    There are no unpaid eligible
                    appointments at the moment.
                  </p>
                )}
              </div>

              {selectedAppointment && (
                <div className="rounded-2xl border border-[#DDE8EC] bg-[#F8FBFC] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-navy">
                        {getDoctorName(
                          selectedAppointment.doctorId
                        )}
                      </p>

                      <p className="mt-1 text-sm text-[#71818C]">
                        {getDoctorSpeciality(
                          selectedAppointment.doctorId
                        ) ||
                          "Medical consultation"}
                      </p>
                    </div>

                    {typeof selectedAppointment.doctorId !==
                      "string" && (
                      <p className="shrink-0 text-sm font-bold text-navy">
                        {formatMoney(
                          Number(
                            selectedAppointment
                              .doctorId
                              .consultationFee ||
                              0
                          ),
                          selectedAppointment
                            .doctorId
                            .currency ||
                            "USD"
                        )}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 border-t border-[#E1E9ED] pt-4 text-sm text-[#667984]">
                    <p>
                      {formatDate(
                        selectedAppointment.date
                      )}{" "}
                      ·{" "}
                      {
                        selectedAppointment.startTime
                      }{" "}
                      –{" "}
                      {
                        selectedAppointment.endTime
                      }
                    </p>

                    <p className="mt-1">
                      {
                        selectedAppointment.reason
                      }
                    </p>
                  </div>

                  {typeof selectedAppointment.doctorId !==
                    "string" &&
                    Number(
                      selectedAppointment
                        .doctorId
                        .consultationFee ||
                        0
                    ) <= 0 && (
                      <div className="mt-4 rounded-xl border border-[#F1D4A2] bg-[#FFF9ED] p-3 text-xs leading-5 text-[#8D641E]">
                        This doctor's consultation
                        fee has not yet been
                        configured. Payment cannot
                        be created until an
                        administrator sets the fee.
                      </div>
                    )}
                </div>
              )}

              <div>
                <p className="mb-3 text-sm font-semibold text-navy">
                  Payment method
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  {paymentMethods.map(
                    (method) => {
                      const Icon =
                        methodIcon(
                          method.value
                        );

                      const selected =
                        selectedMethod ===
                        method.value;

                      return (
                        <button
                          key={
                            method.value
                          }
                          type="button"
                          onClick={() =>
                            setSelectedMethod(
                              method.value
                            )
                          }
                          className={`rounded-2xl border p-4 text-left transition ${
                            selected
                              ? "border-teal bg-[#F0FBFC] ring-2 ring-teal/10"
                              : "border-[#E2EBEF] bg-white hover:border-[#B9D8DD]"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                                selected
                                  ? "bg-teal text-white"
                                  : "bg-[#F4F7F8] text-[#60737F]"
                              }`}
                            >
                              <Icon
                                size={18}
                              />
                            </div>

                            <div>
                              <p className="text-sm font-semibold text-navy">
                                {
                                  method.label
                                }
                              </p>

                              <p className="mt-1 text-xs leading-5 text-[#7B8B95]">
                                {
                                  method.description
                                }
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {selectedMethod ===
                "medical_aid" && (
                <div className="space-y-4 rounded-2xl border border-[#DDE8EC] bg-[#F8FBFC] p-4">
                  <div>
                    <p className="font-semibold text-navy">
                      Medical aid details
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[#71818C]">
                      These details are only used
                      inside your protected account
                      for the claim workflow.
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-navy">
                      Provider
                    </label>

                    <input
                      type="text"
                      className="field"
                      placeholder="Medical aid provider"
                      value={
                        medicalAidProvider
                      }
                      onChange={(event) =>
                        setMedicalAidProvider(
                          event.target.value
                        )
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-navy">
                      Membership number
                    </label>

                    <input
                      type="text"
                      className="field"
                      placeholder="Membership number"
                      value={
                        medicalAidMembershipNumber
                      }
                      onChange={(event) =>
                        setMedicalAidMembershipNumber(
                          event.target.value
                        )
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-navy">
                      Claim/reference number{" "}
                      <span className="font-normal text-[#85939C]">
                        (optional)
                      </span>
                    </label>

                    <input
                      type="text"
                      className="field"
                      placeholder="Claim reference"
                      value={
                        medicalAidClaimReference
                      }
                      onChange={(event) =>
                        setMedicalAidClaimReference(
                          event.target.value
                        )
                      }
                    />
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-[#DDE8EC] bg-[#F8FBFC] p-4 text-xs leading-5 text-[#687B87]">
                <strong className="text-navy">
                  Demo payment stage:
                </strong>{" "}
                MediLink currently creates and
                tracks the payment request. It does
                not yet charge an EcoCash, bank or
                card account. Real payment gateway
                processing will be connected later.
              </div>

              <button
                type="button"
                onClick={() =>
                  void createPayment()
                }
                disabled={
                  submitting ||
                  !selectedAppointmentId ||
                  (selectedAppointment &&
                    typeof selectedAppointment.doctorId !==
                      "string" &&
                    Number(
                      selectedAppointment
                        .doctorId
                        .consultationFee ||
                        0
                    ) <= 0)
                }
                className="btn-primary w-full gap-2"
              >
                {submitting ? (
                  <>
                    <RefreshCw
                      size={17}
                      className="animate-spin"
                    />
                    Creating payment...
                  </>
                ) : selectedMethod ===
                  "medical_aid" ? (
                  <>
                    <FileCheck2
                      size={17}
                    />
                    Submit medical aid claim
                  </>
                ) : (
                  <>
                    <CreditCard
                      size={17}
                    />
                    Create payment request
                  </>
                )}
              </button>
            </div>
          </section>

          <section className="card overflow-hidden">
            <div className="border-b border-[#E2EBEF] px-5 py-5 sm:px-6">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-teal">
                History
              </p>

              <h2 className="mt-1 text-xl font-bold text-navy">
                Payment activity
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#71818C]">
                View payment requests, medical aid
                claims and outstanding balances.
              </p>
            </div>

            {payments.length === 0 ? (
              <div className="flex min-h-[360px] flex-col items-center justify-center px-6 py-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ECF8FA] text-teal">
                  <ReceiptText
                    size={25}
                  />
                </div>

                <h3 className="mt-5 text-lg font-bold text-navy">
                  No payments yet
                </h3>

                <p className="mt-2 max-w-sm text-sm leading-6 text-[#71818C]">
                  Your appointment payments and
                  medical aid claims will appear
                  here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#E7EEF1]">
                {payments.map(
                  (payment) => {
                    const appointment =
                      typeof payment.appointmentId ===
                      "string"
                        ? undefined
                        : payment.appointmentId;

                    const DoctorIcon =
                      methodIcon(
                        payment.method
                      );

                    return (
                      <article
                        key={
                          payment._id
                        }
                        className="p-5 sm:p-6"
                      >
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex min-w-0 gap-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#ECF8FA] text-teal">
                              <DoctorIcon
                                size={20}
                              />
                            </div>

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-bold text-navy">
                                  {getDoctorName(
                                    payment.doctorId
                                  )}
                                </p>

                                <span
                                  className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClasses(
                                    payment.status
                                  )}`}
                                >
                                  {statusLabel(
                                    payment.status
                                  )}
                                </span>
                              </div>

                              <p className="mt-1 text-sm text-[#71818C]">
                                {getDoctorSpeciality(
                                  payment.doctorId
                                ) ||
                                  "Medical consultation"}
                              </p>

                              {appointment && (
                                <p className="mt-2 text-sm text-[#607580]">
                                  {formatDate(
                                    appointment.date
                                  )}
                                  {appointment.startTime
                                    ? ` · ${appointment.startTime}`
                                    : ""}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="sm:text-right">
                            <p className="text-xl font-bold text-navy">
                              {formatMoney(
                                payment.amount,
                                payment.currency
                              )}
                            </p>

                            <p className="mt-1 text-xs font-medium text-[#758792]">
                              {paymentMethodLabel(
                                payment.method
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-3">
                          <div className="rounded-xl bg-[#F7FAFB] p-3">
                            <p className="text-xs text-[#7A8C96]">
                              Paid / covered
                            </p>

                            <p className="mt-1 text-sm font-semibold text-navy">
                              {formatMoney(
                                Number(
                                  payment.amountPaid ||
                                    0
                                ) +
                                  Number(
                                    payment.amountCovered ||
                                      0
                                  ),
                                payment.currency
                              )}
                            </p>
                          </div>

                          <div className="rounded-xl bg-[#F7FAFB] p-3">
                            <p className="text-xs text-[#7A8C96]">
                              Balance
                            </p>

                            <p className="mt-1 text-sm font-semibold text-navy">
                              {formatMoney(
                                payment.patientBalance,
                                payment.currency
                              )}
                            </p>
                          </div>

                          <div className="rounded-xl bg-[#F7FAFB] p-3">
                            <p className="text-xs text-[#7A8C96]">
                              Created
                            </p>

                            <p className="mt-1 text-sm font-semibold text-navy">
                              {formatDateTime(
                                payment.createdAt
                              )}
                            </p>
                          </div>
                        </div>

                        {payment.method ===
                          "medical_aid" && (
                          <div className="mt-4 rounded-xl border border-[#E0E8EC] bg-[#FAFCFD] p-4">
                            <div className="flex items-center gap-2 text-sm font-semibold text-navy">
                              <ShieldCheck
                                size={17}
                                className="text-teal"
                              />
                              Medical aid
                            </div>

                            <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                              <div>
                                <p className="text-xs text-[#80909A]">
                                  Provider
                                </p>

                                <p className="mt-1 font-medium text-navy">
                                  {payment.medicalAid
                                    ?.provider ||
                                    payment.provider ||
                                    "Not provided"}
                                </p>
                              </div>

                              <div>
                                <p className="text-xs text-[#80909A]">
                                  Claim status
                                </p>

                                <p className="mt-1 font-medium text-navy">
                                  {payment.medicalAid
                                    ?.claimStatus
                                    ? payment.medicalAid.claimStatus.replaceAll(
                                        "_",
                                        " "
                                      )
                                    : "Pending"}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {(payment.transactionReference ||
                          payment.receiptNumber) && (
                          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-[#E6EDF0] pt-4 text-xs text-[#6E808B]">
                            {payment.transactionReference && (
                              <span>
                                Reference:{" "}
                                <strong className="font-semibold text-navy">
                                  {
                                    payment.transactionReference
                                  }
                                </strong>
                              </span>
                            )}

                            {payment.receiptNumber && (
                              <span>
                                Receipt:{" "}
                                <strong className="font-semibold text-navy">
                                  {
                                    payment.receiptNumber
                                  }
                                </strong>
                              </span>
                            )}
                          </div>
                        )}

                        {payment.failureReason && (
                          <div className="mt-4 rounded-xl border border-[#F0C4C4] bg-[#FFF4F4] p-3 text-xs leading-5 text-[#943C3C]">
                            {
                              payment.failureReason
                            }
                          </div>
                        )}
                      </article>
                    );
                  }
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}