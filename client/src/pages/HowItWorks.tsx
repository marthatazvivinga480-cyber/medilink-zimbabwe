import {
  CalendarCheck,
  FileHeart,
  Search,
  Stethoscope,
} from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Search,
    title: "Find the right doctor",
    description:
      "Search healthcare professionals by speciality, location and availability.",
  },
  {
    number: "02",
    icon: CalendarCheck,
    title: "Book an available time",
    description:
      "Choose an available appointment slot and tell the doctor why you are visiting.",
  },
  {
    number: "03",
    icon: Stethoscope,
    title: "Attend your consultation",
    description:
      "Your doctor can review authorised information and document the consultation.",
  },
  {
    number: "04",
    icon: FileHeart,
    title: "Keep your health history",
    description:
      "Diagnoses, follow-up information and prescriptions remain connected to your patient account.",
  },
];

export default function HowItWorks() {
  return (
    <main className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold text-teal">
          HOW MEDILINK WORKS
        </p>

        <h1 className="mt-3 font-display text-4xl font-extrabold text-navy md:text-5xl">
          From finding care to keeping your health history.
        </h1>

        <p className="mt-5 text-lg leading-8 text-[#647583]">
          MediLink connects the stages of a healthcare visit rather than
          treating booking, consultations and prescriptions as separate
          experiences.
        </p>
      </div>

      <div className="mt-14 grid gap-6 md:grid-cols-2">
        {steps.map(({ number, icon: Icon, title, description }) => (
          <article className="card p-7" key={number}>
            <div className="flex items-center justify-between">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#EAF8FA]">
                <Icon className="h-6 w-6 text-teal" />
              </div>

              <span className="font-display text-3xl font-extrabold text-[#DCECEF]">
                {number}
              </span>
            </div>

            <h2 className="mt-6 font-display text-xl font-bold text-navy">
              {title}
            </h2>

            <p className="mt-3 leading-7 text-[#647583]">
              {description}
            </p>
          </article>
        ))}
      </div>
    </main>
  );
}