import { FormEvent, useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] =
    useState(false);

  async function submit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    try {
      setLoading(true);

      const user = await login(
        email.trim().toLowerCase(),
        password
      );

      if (user.role === "admin") {
        navigate("/admin", {
          replace: true,
        });

        return;
      }

      if (user.role === "doctor") {
        navigate("/doctor", {
          replace: true,
        });

        return;
      }

      if (user.role === "patient") {
        navigate("/dashboard", {
          replace: true,
        });

        return;
      }

      navigate("/", {
        replace: true,
      });
    } catch (error: any) {
      setError(
        error.response?.data?.message ||
          "Invalid email or password."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="grid min-h-[75vh] place-items-center bg-[#F5FAFB] px-5 py-12">
      <form
        onSubmit={submit}
        autoComplete="on"
        className="card w-full max-w-md p-7"
      >
        <p className="text-sm font-semibold text-teal">
          WELCOME BACK
        </p>

        <h1 className="mt-2 font-display text-3xl font-extrabold text-navy">
          Sign in to MediLink
        </h1>

        <label className="mt-7 block text-sm font-semibold text-navy">
          Email

          <input
            className="field mt-2"
            type="email"
            name="email"
            autoComplete="email"
            inputMode="email"
            placeholder="you@example.com"
            required
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
          />
        </label>

        <label className="mt-4 block text-sm font-semibold text-navy">
          Password

          <input
            className="field mt-2"
            type="password"
            name="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            required
            value={password}
            onChange={(event) =>
              setPassword(
                event.target.value
              )
            }
          />
        </label>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="btn-primary mt-6 w-full"
          disabled={loading}
        >
          {loading
            ? "Signing in..."
            : "Sign in"}
        </button>

        <p className="mt-5 text-center text-sm text-[#647583]">
          New here?{" "}
          <Link
            className="font-semibold text-teal"
            to="/register"
          >
            Create an account
          </Link>
        </p>
      </form>
    </section>
  );
}