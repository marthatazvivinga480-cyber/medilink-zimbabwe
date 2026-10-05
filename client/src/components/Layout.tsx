import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function Layout() {
  return <>
    <Navbar />
    <main><Outlet /></main>
    <footer className="mt-20 bg-navy text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 md:grid-cols-3 lg:px-8">
        <div>
          <div className="font-display text-xl font-extrabold">Medi<span className="text-teal">Link</span> Zimbabwe</div>
          <p className="mt-3 max-w-sm text-sm leading-6 text-white/65">Appointments, medical records and prescriptions connected through one secure patient account.</p>
        </div>
        <div>
          <p className="font-semibold">Platform</p>
          <div className="mt-3 grid gap-2 text-sm text-white/65"><a href="/doctors">Find a doctor</a><a href="/verification">Verify prescription</a><a href="/login">Sign in</a></div>
        </div>
        <div>
          <p className="font-semibold">Zimbabwe</p>
          <p className="mt-3 text-sm text-white/65">Designed for connected continuity of care across providers.</p>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/50">© 2026 MediLink Zimbabwe.</div>
    </footer>
  </>;
}
