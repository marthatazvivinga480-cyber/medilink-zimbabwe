import { lazy } from "react";
import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

const Home = lazy(() => import("./pages/Home"));
const Doctors = lazy(() => import("./pages/Doctors"));
const DoctorProfile = lazy(() => import("./pages/DoctorProfile"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));

const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));

const PatientDashboard = lazy(() => import("./pages/PatientDashboard"));
const PatientProfile = lazy(() => import("./pages/PatientProfile"));
const MyAppointments = lazy(() => import("./pages/MyAppointments"));
const MedicalRecords = lazy(() => import("./pages/MedicalRecords"));
const Prescriptions = lazy(() => import("./pages/Prescriptions"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Payments = lazy(() => import("./pages/Payments"));

const DoctorDashboard = lazy(() => import("./pages/DoctorDashboard"));
const AdminPayments = lazy(() => import("./pages/AdminPayments"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));

const Verification = lazy(() => import("./pages/Verification"));
const NotFound = lazy(() => import("./pages/NotFound"));

import LoadingState from "./components/ui/LoadingState";

import { useAuth } from "./context/AuthContext";

function DashboardRedirect() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingState label="Restoring your session…" />;
  if (user?.role === "pharmacy") return <Navigate to="/verification" replace />;

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (user.role === "admin") {
    return (
      <Navigate
        to="/admin"
        replace
      />
    );
  }

  if (user.role === "doctor") {
    return (
      <Navigate
        to="/doctor"
        replace
      />
    );
  }

  return (
    <Navigate
      to="/dashboard/patient"
      replace
    />
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/doctors"
          element={<Doctors />}
        />

        <Route
          path="/doctors/:id"
          element={<DoctorProfile />}
        />

        <Route
          path="/about"
          element={<About />}
        />

        <Route
          path="/how-it-works"
          element={<HowItWorks />}
        />

        <Route
          path="/contact"
          element={<Contact />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/verification"
          element={<Verification />}
        />

        <Route
          path="/dashboard"
          element={<DashboardRedirect />}
        />

        <Route
          element={
            <ProtectedRoute
              roles={["patient"]}
            />
          }
        >
          <Route
            path="/dashboard/patient"
            element={<PatientDashboard />}
          />

          <Route
            path="/dashboard/patient/profile"
            element={<PatientProfile />}
          />

          <Route
            path="/dashboard/patient/appointments"
            element={<MyAppointments />}
          />

          <Route
            path="/dashboard/patient/records"
            element={<MedicalRecords />}
          />

          <Route
            path="/dashboard/patient/prescriptions"
            element={<Prescriptions />}
          />

          <Route
            path="/dashboard/patient/notifications"
            element={<Notifications />}
          />

          <Route
            path="/dashboard/patient/payments"
            element={<Payments />}
          />
        </Route>

        <Route
          element={
            <ProtectedRoute
              roles={["doctor"]}
            />
          }
        >
          <Route
            path="/doctor"
            element={<DoctorDashboard />}
          />
        </Route>

        <Route
          element={
            <ProtectedRoute
              roles={["admin"]}
            />
          }
        >
          <Route
            path="/admin/payments"
            element={<AdminPayments />}
          />
          <Route
            path="/admin"
            element={<AdminDashboard />}
          />
        </Route>

        <Route
          path="*"
          element={<NotFound />}
        />
      </Route>
    </Routes>
  );
}