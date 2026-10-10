import { useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../services/api";
import Dialog from "../components/ui/Dialog";
import LoadingState from "../components/ui/LoadingState";
import { statusClasses } from "../components/ui/status";

type Payment = {
  _id: string;
  __v?: number;
  status: string;
  method: string;
  currency: string;
  amount: number;
  amountPaid: number;
  amountCovered: number;
  patientBalance: number;
  refundedAmount?: number;
  transactionReference?: string;
  failureReason?: string;
  patientId?: { userId?: { name?: string; email?: string } };
  doctorId?: { userId?: { name?: string } };
  appointmentId?: { date?: string; startTime?: string };
  medicalAid?: {
    provider?: string;
    membershipNumber?: string;
    claimReference?: string;
    claimStatus?: string;
  };
};
type Review = {
  status: string;
  amountPaid: string;
  amountCovered: string;
  refundedAmount: string;
  transactionReference: string;
  failureReason: string;
  medicalAidClaimReference: string;
};
const statuses = [
  "unpaid",
  "pending",
  "paid",
  "partially_paid",
  "failed",
  "refunded",
  "medical_aid_pending",
  "medical_aid_approved",
  "medical_aid_declined",
];
const label = (value: string) => value.replaceAll("_", " ");
const money = (amount: number, currency: string) =>
  `${currency} ${Number(amount || 0).toFixed(2)}`;
export default function AdminPayments() {
  const [params, setParams] = useSearchParams();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [method, setMethod] = useState("all");
  const [selected, setSelected] = useState<Payment | null>(null);
  const [review, setReview] = useState<Review | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [success, setSuccess] = useState("");
  async function load() {
    setLoading(true);
    setError("");
    try {
      setPayments(
        (await api.get<{ payments: Payment[] }>("/payments/admin")).data
          .payments,
      );
    } catch {
      setError(
        "Payment requests could not load. Check your connection and retry.",
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  function open(payment: Payment) {
    setSelected(payment);
    setSaveError("");
    setReview({
      status: payment.status,
      amountPaid: String(payment.amountPaid),
      amountCovered: String(payment.amountCovered),
      refundedAmount: String(payment.refundedAmount || 0),
      transactionReference: payment.transactionReference || "",
      failureReason: payment.failureReason || "",
      medicalAidClaimReference: payment.medicalAid?.claimReference || "",
    });
  }
  function close() {
    if (!saving) {
      setSelected(null);
      setParams({}, { replace: true });
    }
  }
  useEffect(() => {
    const payment = payments.find((item) => item._id === params.get("payment"));
    if (payment) open(payment);
  }, [payments, params]);
  const visible = payments.filter((payment) => {
    const text = [
      payment.patientId?.userId?.name,
      payment.patientId?.userId?.email,
      payment.doctorId?.userId?.name,
      payment.appointmentId?.date,
      payment.transactionReference,
      payment.medicalAid?.provider,
    ]
      .join(" ")
      .toLowerCase();
    return (
      text.includes(search.trim().toLowerCase()) &&
      (filter === "all" || payment.status === filter) &&
      (method === "all" ||
        (method === "medical_aid"
          ? payment.method === "medical_aid"
          : payment.method !== "medical_aid"))
    );
  });
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!selected || !review || saving) return;
    const paid = Number(review.amountPaid),
      covered = Number(review.amountCovered),
      refunded = Number(review.refundedAmount);
    if (
      [review.amountPaid, review.amountCovered, review.refundedAmount].some(
        (value) => !value.trim(),
      ) ||
      [paid, covered, refunded].some(
        (value) => !Number.isFinite(value) || value < 0,
      )
    ) {
      setSaveError(
        "Enter non-negative amounts for payment, coverage and refund.",
      );
      return;
    }
    if (
      Math.round(paid * 100) + Math.round(covered * 100) >
        Math.round(selected.amount * 100) ||
      refunded > paid
    ) {
      setSaveError(
        "Payment and coverage cannot exceed the fee. Refunds cannot exceed patient payments.",
      );
      return;
    }
    if (
      review.status === "paid" &&
      Math.round(paid * 100) + Math.round(covered * 100) !==
        Math.round(selected.amount * 100)
    ) {
      setSaveError(
        "Enter the patient payment and insurer coverage that fully settle this fee.",
      );
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      await api.patch(`/payments/${selected._id}/status`, {
        ...review,
        amountPaid: paid,
        amountCovered: covered,
        refundedAmount: refunded,
        expectedVersion: selected.__v ?? 0,
      });
      setSelected(null);
      setParams({}, { replace: true });
      setSuccess("Review saved. The payment record has been updated.");
      await load();
    } catch (error) {
      const response = error as { response?: { data?: { message?: string } } };
      setSaveError(
        response.response?.data?.message ||
          "We could not save this review. Check your connection and retry.",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link className="text-sm font-semibold text-teal-dark" to="/admin">
        ← Admin overview
      </Link>
      <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">
            Payments and medical aid
          </h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Review payment evidence and medical-aid decisions. These demo
            records do not move money.
          </p>
        </div>
        <button
          className="btn-secondary"
          onClick={() => void load()}
          disabled={loading}
        >
          Refresh requests
        </button>
      </div>
      {success && (
        <p
          role="status"
          className="mt-4 rounded-lg bg-emerald-50 p-4 text-emerald-800"
        >
          {success}
        </p>
      )}
      <div className="mt-6 grid gap-4 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-3">
        <label className="text-sm font-semibold">
          Search requests
          <input
            className="field mt-2"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Patient, doctor, date or reference"
          />
        </label>
        <label className="text-sm font-semibold">
          Request type
          <select
            className="field mt-2"
            value={method}
            onChange={(event) => setMethod(event.target.value)}
          >
            <option value="all">All requests</option>
            <option value="direct">Direct payments</option>
            <option value="medical_aid">Medical aid</option>
          </select>
        </label>
        <label className="text-sm font-semibold">
          Status
          <select
            className="field mt-2"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="all">All statuses</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {label(status)}
              </option>
            ))}
          </select>
        </label>
      </div>
      {loading ? (
        <LoadingState label="Loading payment requests" />
      ) : error ? (
        <p role="alert" className="mt-6 text-red-700">
          {error}
        </p>
      ) : (
        <>
          <p className="my-4 text-sm text-slate-600" aria-live="polite">
            {visible.length} matching requests
          </p>
          {visible.length === 0 ? (
            <p className="border-y py-10 text-slate-600">
              No requests match these filters.
            </p>
          ) : (
            <ul className="divide-y divide-slate-200 border-y border-slate-200">
              {visible.map((payment) => (
                <li
                  key={payment._id}
                  className="grid gap-4 py-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center"
                >
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {payment.patientId?.userId?.name || "Patient unavailable"}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {payment.doctorId?.userId?.name || "Doctor unavailable"} ·{" "}
                      {payment.appointmentId?.date || "Date unavailable"}{" "}
                      {payment.appointmentId?.startTime}
                    </p>
                    <p className="mt-1 text-sm">
                      {label(payment.method)}
                      {payment.medicalAid?.provider
                        ? ` · ${payment.medicalAid.provider}`
                        : ""}
                    </p>
                  </div>
                  <div>
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusClasses(payment.status)}`}
                    >
                      {label(payment.status)}
                    </span>
                    <p className="mt-2 text-sm">
                      Fee {money(payment.amount, payment.currency)} · Balance{" "}
                      {money(payment.patientBalance, payment.currency)}
                    </p>
                  </div>
                  <button
                    className="btn-secondary"
                    onClick={() => open(payment)}
                    aria-label={`Review payment for ${payment.patientId?.userId?.name || "patient"}`}
                  >
                    Review request
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      {selected && review && (
        <Dialog label="Review payment request" busy={saving} onClose={close}>
          <div className="flex min-h-full items-start justify-center p-3 py-6 sm:p-8">
            <form
              onSubmit={save}
              className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl sm:p-8"
            >
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-2xl font-bold">Review payment request</h2>
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={saving}
                  onClick={close}
                >
                  Close
                </button>
              </div>
              <p className="mt-3 break-words">
                {selected.patientId?.userId?.name} ·{" "}
                {selected.appointmentId?.date}
              </p>
              <p className="mt-1 text-sm">
                Consultation fee: {money(selected.amount, selected.currency)}
              </p>
              {selected.method === "medical_aid" && (
                <div className="my-4 rounded-xl bg-slate-50 p-4 text-sm">
                  <p>
                    Provider: {selected.medicalAid?.provider || "Not provided"}
                  </p>
                  <p className="break-all">
                    Membership:{" "}
                    {selected.medicalAid?.membershipNumber || "Not provided"}
                  </p>
                  <p>
                    Claim status:{" "}
                    {label(selected.medicalAid?.claimStatus || "pending")}
                  </p>
                </div>
              )}
              <fieldset
                disabled={saving}
                className="mt-5 grid min-w-0 gap-4 sm:grid-cols-2"
              >
                <legend className="mb-3 font-semibold">
                  Record the verified outcome
                </legend>
                <label className="text-sm font-semibold sm:col-span-2">
                  Outcome
                  <select
                    className="field mt-2"
                    value={review.status}
                    onChange={(event) =>
                      setReview({ ...review, status: event.target.value })
                    }
                  >
                    {statuses
                      .filter(
                        (status) =>
                          selected.method === "medical_aid" ||
                          !status.startsWith("medical_aid"),
                      )
                      .map((status) => (
                        <option key={status} value={status}>
                          {label(status)}
                        </option>
                      ))}
                  </select>
                </label>
                {(
                  [
                    ["amountPaid", "Patient paid"],
                    ["amountCovered", "Insurer covered"],
                    ["refundedAmount", "Patient refunded"],
                  ] as const
                ).map(([key, title]) => (
                  <label key={key} className="text-sm font-semibold">
                    {title} ({selected.currency})
                    <input
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      className="field mt-2"
                      value={review[key]}
                      onChange={(event) =>
                        setReview({ ...review, [key]: event.target.value })
                      }
                    />
                  </label>
                ))}
                <label className="text-sm font-semibold">
                  Payment reference
                  <input
                    maxLength={150}
                    className="field mt-2"
                    value={review.transactionReference}
                    onChange={(event) =>
                      setReview({
                        ...review,
                        transactionReference: event.target.value,
                      })
                    }
                  />
                </label>
                {selected.method === "medical_aid" && (
                  <label className="text-sm font-semibold sm:col-span-2">
                    Claim reference
                    <input
                      maxLength={150}
                      className="field mt-2"
                      value={review.medicalAidClaimReference}
                      onChange={(event) =>
                        setReview({
                          ...review,
                          medicalAidClaimReference: event.target.value,
                        })
                      }
                    />
                  </label>
                )}
                <label className="text-sm font-semibold sm:col-span-2">
                  Reason if failed or declined
                  <textarea
                    maxLength={500}
                    className="field mt-2"
                    value={review.failureReason}
                    onChange={(event) =>
                      setReview({
                        ...review,
                        failureReason: event.target.value,
                      })
                    }
                  />
                </label>
              </fieldset>
              {saveError && (
                <div role="alert" className="mt-4 text-sm text-red-700">
                  <p>{saveError}</p>
                  <button
                    type="button"
                    className="mt-2 underline"
                    disabled={saving}
                    onClick={() => {
                      close();
                      void load();
                    }}
                  >
                    Close and reload latest records
                  </button>
                </div>
              )}
              <p className="mt-4 text-xs text-slate-600">
                Save only amounts supported by your payment or insurer records.
                A refund status records a refund; it does not send one.
              </p>
              <button
                className="btn-primary mt-5 w-full sm:w-auto"
                disabled={saving}
              >
                {saving ? "Saving review…" : "Save review"}
              </button>
            </form>
          </div>
        </Dialog>
      )}
    </section>
  );
}
