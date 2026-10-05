import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Doctors from "./pages/Doctors";
import DoctorProfile from "./pages/DoctorProfile";
import About from "./pages/About";
import Contact from "./pages/Contact";
import HowItWorks from "./pages/HowItWorks";

import Login from "./pages/Login";
import Register from "./pages/Register";

import PatientDashboard from "./pages/PatientDashboard";
import PatientProfile from "./pages/PatientProfile";
import MyAppointments from "./pages/MyAppointments";
import MedicalRecords from "./pages/MedicalRecords";
import Prescriptions from "./pages/Prescriptions";
import Notifications from "./pages/Notifications";

import DoctorDashboard from "./pages/DoctorDashboard";
import AdminDashboard from "./pages/AdminDashboard";

import Verification from "./pages/Verification";
import NotFound from "./pages/NotFound";

import { useAuth } from "./context/AuthContext";

function DashboardRedirect() {
  const { user } = useAuth();

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