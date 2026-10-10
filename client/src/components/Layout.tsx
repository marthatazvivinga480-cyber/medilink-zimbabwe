import { AppointmentPaymentProvider } from "./AppointmentPayment";
import { Suspense } from "react";
import { useAuth } from "../context/AuthContext";
import LoadingState from "./ui/LoadingState";
import RouteBoundary from "./RouteBoundary";
import { NavLink, Link, useLocation, Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function Layout() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const patient =
    user?.role === "patient" && pathname.startsWith("/dashboard/patient");
  return (
    <>
      <Navbar />
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      {patient && (
        <nav
          aria-label="Patient account"
          className="border-b border-slate-200 bg-white"
        >
          <div className="mx-auto grid max-w-7xl grid-cols-3 gap-1 px-5 py-2 sm:flex sm:overflow-x-auto">
            {[
              ["Overview", ""],
              ["Appointments", "/appointments"],
              ["Records", "/records"],
              ["Prescriptions", "/prescriptions"],
              ["Payments", "/payments"],
              ["Profile", "/profile"],
            ].map(([label, suffix]) => (
              <NavLink
                key={label}
                end
                to={"/dashboard/patient" + suffix}
                className={({ isActive }) =>
                  "shrink-0 rounded-lg px-4 py-3 text-sm font-semibold " +
                  (isActive
                    ? "bg-teal/10 text-navy"
                    : "text-slate-600 hover:bg-slate-50")
                }
              >
                {label}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
      <main
        id="main-content"
        className={
          patient || pathname === "/doctor" || pathname.startsWith("/admin")
            ? "product-view"
            : ""
        }
      >
        <RouteBoundary key={pathname}>
          <Suspense fallback={<LoadingState />}>
            <AppointmentPaymentProvider>
              <Outlet />
            </AppointmentPaymentProvider>
          </Suspense>
        </RouteBoundary>
      </main>
      <footer className="mt-20 bg-navy text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 md:grid-cols-3 lg:px-8">
          <div>
            <div className="font-display text-xl font-extrabold">
              Medi<span className="text-teal">Link</span> Zimbabwe
            </div>
            <p className="mt-3 max-w-sm text-sm leading-6 text-white/65">
              Appointments, medical records and prescriptions connected through
              one secure patient account.
            </p>
          </div>
          <div>
            <p className="font-semibold">Platform</p>
            <div className="mt-3 grid gap-2 text-sm text-white/65">
              <Link to="/doctors">Find a doctor</Link>
              <Link to="/verification">Verify prescription</Link>
              <Link to="/login">Sign in</Link>
            </div>
          </div>
          <div>
            <p className="font-semibold">Zimbabwe</p>
            <p className="mt-3 text-sm text-white/65">
              Designed for connected continuity of care across providers.
            </p>
          </div>
        </div>
        <div className="border-t border-white/10 py-5 text-center text-xs text-white/50">
          © 2026 MediLink Zimbabwe. Demo platform — verify provider credentials
          independently. Payment requests do not move money.
        </div>
      </footer>
    </>
  );
}
