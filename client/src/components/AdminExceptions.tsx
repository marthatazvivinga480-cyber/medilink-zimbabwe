import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../services/api";
import LoadingState from "./ui/LoadingState";
import { statusClasses } from "./ui/status";
type Payment = {
  _id: string;
  status: string;
  currency: string;
  patientBalance: number;
  appointmentId?: { date?: string };
  createdAt: string;
};
export default function AdminExceptions() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    api
      .get("/payments/admin")
      .then((r) => {
        if (active) setPayments(r.data.payments || []);
      })
      .catch(() => {
        if (active)
          setError(
            "Payment exceptions could not load. Check your connection and retry.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [revision]);
  const exceptions = payments.filter(
    (p) =>
      [
        "pending",
        "failed",
        "medical_aid_pending",
        "medical_aid_declined",
        "partially_paid",
      ].includes(p.status) ||
      (p.status === "medical_aid_approved" && p.patientBalance > 0),
  );
  return (
    <section
      aria-label="Payment exceptions"
      className="mt-8 border-y border-slate-200 py-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Payment and claim exceptions</h2>
        <button
          className="btn-secondary"
          onClick={() => setRevision((v) => v + 1)}
          disabled={loading}
        >
          Refresh
        </button>
      </div>
      <p className="mt-2 text-sm text-slate-600">
        Review pending requests, failed payments and unresolved medical aid.
        Open a request to record verified payments or claim decisions.
      </p>
      {loading ? (
        <LoadingState />
      ) : error ? (
        <p role="alert" className="mt-4 text-red-700">
          {error}
        </p>
      ) : exceptions.length === 0 ? (
        <p className="mt-4 text-sm">
          No payment exceptions in the returned data.
        </p>
      ) : (
        <>
          <p className="mt-4 text-sm font-semibold">
            {exceptions.length} items need review
          </p>
          <ul className="mt-3 divide-y divide-slate-200">
            {exceptions.slice(0, 10).map((p) => (
              <li
                key={p._id}
                className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
              >
                <span>
                  Appointment {p.appointmentId?.date || "date unavailable"}
                  <span
                    className={
                      "ml-3 inline-block rounded-full px-3 py-1 text-xs " +
                      statusClasses(p.status)
                    }
                  >
                    {p.status.replaceAll("_", " ")}
                  </span>
                </span>
                <span>
                  Balance {p.currency}{" "}
                  {Number(p.patientBalance || 0).toFixed(2)}
                </span>
                <Link
                  className="font-semibold text-teal-dark underline"
                  to={"/admin/payments?payment=" + p._id}
                >
                  Review request
                </Link>
              </li>
            ))}
          </ul>
          {exceptions.length > 10 && (
            <p className="text-xs text-slate-600">
              Showing the 10 most recent exceptions.
            </p>
          )}
        </>
      )}
      <Link className="btn-secondary mt-4" to="/admin/payments">
        Manage all payments and claims
      </Link>
    </section>
  );
}
