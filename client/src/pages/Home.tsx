import OptimizedImage from "../components/OptimizedImage";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarCheck,
  Check,
  FileHeart,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";

const features = [
  {
    icon: CalendarCheck,
    title: "Book care",
    text: "Find doctors, see availability and request an appointment online.",
  },
  {
    icon: FileHeart,
    title: "Digital records",
    text: "Keep a structured history instead of relying on a paper patient book.",
  },
  {
    icon: Stethoscope,
    title: "Clinical continuity",
    text: "Authorized doctors can review relevant prior consultations.",
  },
  {
    icon: ShieldCheck,
    title: "Controlled access",
    text: "Medical information is protected by role-based access.",
  },
];

const steps = [
  {
    number: "01",
    title: "Find",
    text: "Browse doctors by speciality and location.",
  },
  {
    number: "02",
    title: "Book",
    text: "Choose an available date and time, then confirm your appointment.",
  },
  {
    number: "03",
    title: "Continue care",
    text: "Appointments, records and prescriptions stay connected in one account.",
  },
];

export default function Home() {
  return (
    <div>
      {/* HERO */}
      <section className="bg-[#F5FAFB]">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-14 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-20">
          {/* HERO COPY */}
          <div>
            <p className="mb-5 flex items-center gap-2 text-sm font-semibold text-teal">
              <span className="h-2 w-2 rounded-full bg-teal" />
              Healthcare, connected
            </p>

            <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-navy">
              Your Health,
              <br />
              <span className="text-teal">
                Always Within Reach.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-[#647583]">
              Book trusted healthcare professionals and keep
              your appointments, prescriptions and medical
              history securely available when you need them.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/doctors"
                className="btn-primary"
              >
                Find a doctor
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>

              <Link
                to="/register"
                className="btn-secondary"
              >
                Create patient account
              </Link>
            </div>

            <div className="mt-9 flex flex-wrap gap-x-7 gap-y-3 text-sm text-[#647583]">
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-teal" />
                Secure access
              </span>

              <span className="flex items-center gap-2">
                <FileHeart className="h-4 w-4 text-teal" />
                Digital records
              </span>
            </div>
          </div>

          {/* HERO IMAGE */}
          <div className="relative">
            <div className="overflow-hidden rounded-3xl border border-[#E2EBEF] bg-white p-3 shadow-[0_20px_55px_rgba(11,41,69,0.10)]">
              <div className="relative overflow-hidden rounded-2xl">
                <OptimizedImage
                  src="/images/medilink-hero.png"
                  fetchPriority="high" width={1280} height={960} sizes="(max-width: 1024px) 90vw, 650px"
                  alt="Diverse MediLink healthcare team"
                  className="h-[430px] w-full object-cover object-center sm:h-[460px] lg:h-[480px]"
                />

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0B2945]/30 via-transparent to-transparent" />

                {/* BOOKING CARD */}
                <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/15 bg-navy/95 p-4 text-white shadow-xl backdrop-blur-md sm:right-auto sm:w-[315px]">
                  <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-white/60">
                    Book an appointment
                  </p>

                  <h2 className="mt-1 font-display text-lg font-bold">
                    Start with the care you need.
                  </h2>

                  <div className="mt-3 grid gap-2">
                    <div className="rounded-lg bg-white/10 px-3.5 py-2.5">
                      <p className="text-[11px] text-white/55">
                        Speciality
                      </p>

                      <p className="mt-0.5 text-sm font-semibold">
                        General Practice
                      </p>
                    </div>

                    <div className="rounded-lg bg-white/10 px-3.5 py-2.5">
                      <p className="text-[11px] text-white/55">
                        Care provider
                      </p>

                      <p className="mt-0.5 text-sm font-semibold">
                        Choose from available doctors
                      </p>
                    </div>

                    <Link
                      to="/doctors"
                      className="mt-1 flex items-center justify-center rounded-lg bg-teal px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-dark"
                    >
                      View available doctors
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* CONNECTED CARE FLOATING CARD */}
            <div className="absolute -bottom-4 right-4 hidden rounded-2xl border border-[#E2EBEF] bg-white p-4 shadow-[0_12px_35px_rgba(11,41,69,0.10)] xl:block">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#EAF8FA] text-teal">
                  <Check className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-xs text-[#8A99A5]">
                    Connected care
                  </p>

                  <p className="text-sm font-semibold text-navy">
                    Records stay with you
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONNECTED EXPERIENCE */}
      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal">
            One connected experience
          </p>

          <h2 className="mt-2 font-display text-3xl font-bold text-navy">
            From appointment to follow-up.
          </h2>

          <p className="mt-3 max-w-xl leading-7 text-[#647583]">
            MediLink brings the most important parts of a
            patient&apos;s care journey into one secure place.
          </p>
        </div>

        <div className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="card p-6 transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(11,41,69,0.09)]"
              >
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#EAF8FA] text-teal">
                  <Icon className="h-5 w-5" />
                </div>

                <h3 className="mt-5 font-display text-lg font-bold text-navy">
                  {feature.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-[#647583]">
                  {feature.text}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        id="how-it-works"
        className="bg-[#F5FAFB] py-16"
      >
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-teal">
              How it works
            </p>

            <h2 className="mt-2 font-display text-3xl font-bold text-navy">
              Simple for patients. Useful for doctors.
            </h2>

            <p className="mt-3 max-w-xl leading-7 text-[#647583]">
              Find care, book your appointment and keep your
              health information connected after the visit.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.number}
                className="rounded-2xl border border-[#E2EBEF] bg-white p-6 shadow-[0_10px_30px_rgba(11,41,69,0.04)]"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF8FA]">
                  <span className="font-display text-xl font-extrabold text-teal">
                    {step.number}
                  </span>
                </div>

                <h3 className="mt-5 font-display text-xl font-bold text-navy">
                  {step.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-[#647583]">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY MEDILINK */}
      <section
        id="about"
        className="mx-auto max-w-7xl px-5 py-14 lg:px-8"
      >
        <div className="overflow-hidden rounded-3xl bg-navy px-7 py-9 text-white md:px-10 md:py-11">
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-wide text-teal">
                Why MediLink
              </p>

              <h2 className="mt-3 max-w-3xl font-display text-3xl font-bold leading-tight">
                A digital continuity-of-care platform, not
                just a booking form.
              </h2>

              <p className="mt-4 max-w-2xl leading-7 text-white/65">
                MediLink connects appointments, professional
                medical records, patient-friendly explanations
                and verifiable prescriptions while keeping
                access controlled by role.
              </p>
            </div>

            <Link
              className="btn-primary shrink-0"
              to="/doctors"
            >
              Explore doctors
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}