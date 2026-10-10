import {
  BookOpenCheck,
  FileHeart,
  HeartPulse,
  ShieldCheck,
  Stethoscope,
  Users,
} from "lucide-react";

export default function About() {
  return (
    <main>
      <section className="border-b border-[#E2EBEF] bg-[#F5FAFB]">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal">
            About MediLink
          </p>

          <h1 className="mt-5 max-w-4xl font-display text-4xl font-extrabold leading-tight text-navy">
            Your health information should move securely with you.
          </h1>

          <p className="mt-7 max-w-3xl text-lg leading-8 text-[#647583]">
            MediLink Zimbabwe is designed to reduce dependence on handwritten
            patient books by connecting appointments, consultations,
            prescriptions and authorised medical information through one
            secure patient account.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
          <div>
            <p className="text-sm font-semibold text-teal">
              THE PROBLEM
            </p>

            <h2 className="mt-3 font-display text-3xl font-bold text-navy">
              Healthcare information is still too fragmented.
            </h2>

            <div className="mt-6 space-y-5 text-base leading-7 text-[#647583]">
              <p>
                Patients often move between doctors, clinics and pharmacies
                carrying handwritten medical books and prescriptions.
              </p>

              <p>
                Those records can be lost, damaged, difficult to read or hard
                for patients to understand.
              </p>

              <p>
                MediLink is being designed around continuity of care so the
                right health information can remain available to the patient
                and authorised healthcare professionals.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                icon: FileHeart,
                title: "Digital health record",
                text: "Consultations, diagnoses and treatment history organised around the patient.",
              },
              {
                icon: Stethoscope,
                title: "Connected providers",
                text: "Doctors can work from authorised patient information instead of relying only on paper notes.",
              },
              {
                icon: BookOpenCheck,
                title: "Clearer information",
                text: "Medical terminology can be accompanied by simple patient-friendly explanations.",
              },
              {
                icon: ShieldCheck,
                title: "Controlled access",
                text: "Healthcare information remains protected by role and permission.",
              },
            ].map(({ icon: Icon, title, text }) => (
              <article className="card p-6" key={title}>
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#EAF8FA]">
                  <Icon className="h-5 w-5 text-teal" />
                </div>

                <h3 className="mt-5 font-display text-lg font-bold text-navy">
                  {title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-[#647583]">
                  {text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-navy">
        <div className="mx-auto max-w-7xl px-5 py-20 text-white lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-[#6FE0E8]">
              WHO IT SERVES
            </p>

            <h2 className="mt-3 font-display text-3xl font-bold">
              Built around the people delivering and receiving care.
            </h2>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              {
                icon: Users,
                title: "Patients",
                text: "Book appointments, see medical history and access prescriptions.",
              },
              {
                icon: HeartPulse,
                title: "Doctors",
                text: "Manage appointments, consultations and authorised patient records.",
              },
              {
                icon: ShieldCheck,
                title: "Healthcare providers",
                text: "Support safer information continuity across participating facilities.",
              },
            ].map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="rounded-2xl border border-white/10 bg-white/5 p-6"
              >
                <Icon className="h-6 w-6 text-[#6FE0E8]" />

                <h3 className="mt-5 font-display text-xl font-bold">
                  {title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-white/70">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}