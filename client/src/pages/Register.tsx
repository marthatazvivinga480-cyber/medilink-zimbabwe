import {
  FormEvent,
  useState,
} from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } =
    useAuth();

  const navigate =
    useNavigate();

  const [form, setForm] =
    useState({
      name: "",
      email: "",
      password: "",
      phone: "",
    });

  const [error, setError] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  async function submit(
    event: FormEvent
  ) {
    event.preventDefault();

    setError("");
    setSubmitting(true);

    try {
      await register(form);

      navigate(
        "/dashboard/patient"
      );
    } catch (error: any) {
      setError(
        error.response?.data
          ?.message ||
          "Registration failed."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="grid min-h-[75vh] place-items-center bg-[#F5FAFB] px-5 py-12">
      <form
        onSubmit={submit}
        autoComplete="on"
        className="card w-full max-w-lg p-7"
      >
        <p className="text-sm font-semibold text-teal">
          GET STARTED
        </p>

        <h1 className="mt-2 font-display text-3xl font-extrabold text-navy">
          Create your patient account
        </h1>

        <p className="mt-3 text-sm leading-6 text-[#647583]">
          Create an account to book appointments,
          manage your health information and view
          your MediLink records.
        </p>

        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold text-navy">
            Full name

            <input
              className="field mt-2"
              type="text"
              name="name"
              autoComplete="name"
              required
              value={form.name}
              onChange={(event) =>
                setForm({
                  ...form,
                  name:
                    event.target
                      .value,
                })
              }
            />
          </label>

          <label className="text-sm font-semibold text-navy">
            Phone

            <input
              className="field mt-2"
              type="tel"
              name="phone"
              autoComplete="tel"
              value={form.phone}
              onChange={(event) =>
                setForm({
                  ...form,
                  phone:
                    event.target
                      .value,
                })
              }
            />
          </label>

          <label className="text-sm font-semibold text-navy sm:col-span-2">
            Email

            <input
              className="field mt-2"
              type="email"
              name="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={(event) =>
                setForm({
                  ...form,
                  email:
                    event.target
                      .value,
                })
              }
            />
          </label>

          <label className="text-sm font-semibold text-navy sm:col-span-2">
            Password

            <input
              className="field mt-2"
              type="password"
              name="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={
                form.password
              }
              onChange={(event) =>
                setForm({
                  ...form,
                  password:
                    event.target
                      .value,
                })
              }
            />

            <span className="mt-2 block text-xs font-normal text-[#7A8995]">
              Use at least 8 characters.
            </span>
          </label>
        </div>

        {error && (
          <p className="mt-4 text-sm font-medium text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary mt-6 w-full"
        >
          {submitting
            ? "Creating account..."
            : "Create patient account"}
        </button>

        <p className="mt-5 text-center text-sm text-[#647583]">
          Already registered?{" "}
          <Link
            className="font-semibold text-teal"
            to="/login"
          >
            Sign in
          </Link>
        </p>

        <p className="mt-4 text-center text-xs leading-5 text-[#7A8995]">
          Doctor, pharmacy and administrator accounts
          are managed through approved MediLink
          access.
        </p>
      </form>
    </section>
  );
}