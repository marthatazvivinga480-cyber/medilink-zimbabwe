import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import type { Appointment } from "../types";
import { statusClasses } from "./ui/status";
type Payment = {
  appointmentId: string | { _id: string };
  status: string;
  patientBalance: number;
  currency: string;
};
const Context = createContext<{ payments: Payment[]; ready: boolean }>({
  payments: [],
  ready: false,
});
export function AppointmentPaymentProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [data, setData] = useState({ payments: [] as Payment[], ready: false });
  useEffect(() => {
    let active = true;
    setData({ payments: [], ready: false });
    if (
      user?.role === "patient" &&
      ["/dashboard/patient", "/dashboard/patient/appointments"].includes(
        pathname,
      )
    ) {
      api
        .get("/payments/mine")
        .then((r) => {
          if (active) setData({ payments: r.data.payments || [], ready: true });
        })
        .catch(() => {});
    }
    return () => {
      active = false;
    };
  }, [user?.id, user?.role, pathname]);
  return <Context.Provider value={data}>{children}</Context.Provider>;
}
export default function AppointmentPayment({
  appointment,
}: {
  appointment: Appointment;
}) {
  const { payments, ready } = useContext(Context);
  if (["cancelled", "no-show"].includes(appointment.status)) return null;
  const payment = payments.find(
    (p) =>
      (typeof p.appointmentId === "string"
        ? p.appointmentId
        : p.appointmentId?._id) === appointment._id,
  );
  return (
    <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3 text-sm">
      {payment && (
        <span
          className={
            "rounded-full px-3 py-1 text-xs font-semibold " +
            statusClasses(payment.status)
          }
        >
          {payment.status.replaceAll("_", " ")}
        </span>
      )}
      {payment && payment.patientBalance > 0 && (
        <span>
          Balance: {payment.currency}{" "}
          {Number(payment.patientBalance).toFixed(2)}
        </span>
      )}
      <Link
        className="font-semibold text-teal-dark"
        to={
          "/dashboard/patient/payments?appointment=" +
          encodeURIComponent(appointment._id)
        }
      >
        {payment
          ? "View payment or claim"
          : ready
            ? "Arrange payment or medical aid"
            : "Check payment status"}
      </Link>
    </div>
  );
}
