import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  LogOut,
  Menu,
  X,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const links = [
    ["Home", "/"],
    ["Doctors", "/doctors"],
    ["How It Works", "/how-it-works"],
    ["About", "/about"],
    ["Contact", "/contact"],
  ];

  function handleLogout() {
    logout();
    setOpen(false);

    navigate("/login", {
      replace: true,
    });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[#E2EBEF] bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
        <Link
          to="/"
          className="font-display text-xl font-extrabold tracking-tight text-navy"
        >
          Medi
          <span className="text-teal">
            Link
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {links.map(([label, href]) => (
            <NavLink
              key={label}
              to={href}
              className={({ isActive }) =>
                `text-sm font-medium transition ${
                  isActive
                    ? "text-teal"
                    : "text-[#647583] hover:text-teal"
                }`
              }
            >
              {label}
            </NavLink>
          ))}

          {user ? (
            <>
              <Link
                className="btn-primary py-2.5"
                to="/dashboard"
              >
                Dashboard
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#647583] transition hover:text-red-600"
              >
                <LogOut size={17} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                className="text-sm font-semibold text-navy"
                to="/login"
              >
                Login
              </Link>

              <Link
                className="btn-primary py-2.5"
                to="/doctors"
              >
                Book Appointment
              </Link>
            </>
          )}
        </nav>

        <button
          type="button"
          className="md:hidden"
          onClick={() =>
            setOpen((value) => !value)
          }
          aria-label="Toggle navigation"
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-[#E2EBEF] bg-white px-5 py-4 md:hidden">
          {links.map(([label, href]) => (
            <Link
              onClick={() => setOpen(false)}
              key={label}
              to={href}
              className="block border-b border-[#EEF3F5] py-3 text-sm font-medium text-navy"
            >
              {label}
            </Link>
          ))}

          {user ? (
            <div className="mt-4 grid gap-3">
              <Link
                onClick={() => setOpen(false)}
                className="btn-primary w-full"
                to="/dashboard"
              >
                Dashboard
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#D9E5E8] bg-white px-4 py-3 text-sm font-semibold text-navy transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                <LogOut size={17} />
                Logout
              </button>
            </div>
          ) : (
            <div className="mt-4 grid gap-3">
              <Link
                onClick={() => setOpen(false)}
                className="btn-secondary w-full"
                to="/login"
              >
                Login
              </Link>

              <Link
                onClick={() => setOpen(false)}
                className="btn-primary w-full"
                to="/doctors"
              >
                Book Appointment
              </Link>
            </div>
          )}
        </nav>
      )}
    </header>
  );
}