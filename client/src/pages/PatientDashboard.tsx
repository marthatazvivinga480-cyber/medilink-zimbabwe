import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { Link } from "react-router-dom";

import {
  CalendarDays,
  FileHeart,
  Pill,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import { api } from "../services/api";

import type {
  Appointment,
  Prescription,
  RecordItem,
} from "../types";

import { useAuth } from "../context/AuthContext";

type DashboardStat = {
  icon: LucideIcon;
  title: string;
  value: string | number;
  href?: string;
};

function formatAppointmentDate(
  value: string
) {
  if (!value) {
    return "";
  }

  return new Date(
    `${value}T00:00:00`
  ).toLocaleDateString(
    "en-GB",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

function appointmentStatusClasses(
  status: string
) {
  switch (status.toLowerCase()) {
    case "confirmed":
      return "border border-emerald-100 bg-emerald-50 text-emerald-700";

    case "pending":
      return "border border-amber-100 bg-amber-50 text-amber-700";

    case "completed":
      return "border border-sky-100 bg-sky-50 text-sky-700";

    case "cancelled":
      return "border border-red-100 bg-red-50 text-red-600";

    case "rescheduled":
      return "border border-violet-100 bg-violet-50 text-violet-700";

    default:
      return "border border-[#DCEBED] bg-[#F5FAFB] text-[#647583]";
  }
}

function prescriptionStatusClasses(
  status: string
) {
  switch (status.toLowerCase()) {
    case "valid":
    case "active":
      return "border border-emerald-100 bg-emerald-50 text-emerald-700";

    case "dispensed":
      return "border border-sky-100 bg-sky-50 text-sky-700";

    case "expired":
    case "cancelled":
      return "border border-red-100 bg-red-50 text-red-600";

    default:
      return "border border-[#CFECEE] bg-[#EAF8FA] text-teal";
  }
}

export default function PatientDashboard() {
  const { user } = useAuth();

  const [
    appointments,
    setAppointments,
  ] = useState<Appointment[]>([]);

  const [
    records,
    setRecords,
  ] = useState<RecordItem[]>([]);

  const [
    prescriptions,
    setPrescriptions,
  ] = useState<Prescription[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const [
          appointmentResponse,
          recordResponse,
          prescriptionResponse,
        ] = await Promise.all([
          api.get(
            "/appointments/mine"
          ),
          api.get(
            "/medical-records/mine"
          ),
          api.get(
            "/prescriptions/mine"
          ),
        ]);

        if (!mounted) {
          return;
        }

        setAppointments(
          appointmentResponse.data
            .appointments ?? []
        );

        setRecords(
          recordResponse.data.records ??
            []
        );

        setPrescriptions(
          prescriptionResponse.data
            .prescriptions ?? []
        );
      } catch (error: any) {
        if (!mounted) {
          return;
        }

        setError(
          error.response?.data
            ?.message ||
            "Could not load your dashboard."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  const upcomingAppointments =
    useMemo(() => {
      const now = Date.now();

      const activeStatuses =
        new Set([
          "pending",
          "confirmed",
          "rescheduled",
        ]);

      return appointments
        .filter(
          (
            appointment
          ) => {
            const status =
              appointment.status.toLowerCase();

            if (
              !activeStatuses.has(
                status
              )
            ) {
              return false;
            }

            const appointmentDateTime =
              new Date(
                `${appointment.date}T${appointment.startTime}:00`
              );

            if (
              Number.isNaN(
                appointmentDateTime.getTime()
              )
            ) {
              return false;
            }

            return (
              appointmentDateTime.getTime() >
              now
            );
          }
        )
        .sort(
          (
            first,
            second
          ) => {
            const firstDateTime =
              new Date(
                `${first.date}T${first.startTime}:00`
              ).getTime();

            const secondDateTime =
              new Date(
                `${second.date}T${second.startTime}:00`
              ).getTime();

            return (
              firstDateTime -
              secondDateTime
            );
          }
        );
    }, [appointments]);

  const stats: DashboardStat[] = [
    {
      icon: CalendarDays,
      title: "Appointments",
      value: appointments.length,
    },
    {
      icon: FileHeart,
      title: "Medical records",
      value: records.length,
    },
    {
      icon: Pill,
      title: "Prescriptions",
      value: prescriptions.length,
    },
    {
      icon: UserRound,
      title: "Profile",
      value: "Manage profile →",
      href:
        "/dashboard/patient/profile",
    },
  ];

  const hiddenAppointmentCount =
    Math.max(
      upcomingAppointments.length -
        5,
      0
    );

  const hiddenPrescriptionCount =
    Math.max(
      prescriptions.length - 2,
      0
    );

  return (
    <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
      <div className="flex flex-col justify-between gap-5 border-b border-[#E2EBEF] pb-7 md:flex-row md:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-teal">
            Patient dashboard
          </p>

          <h1 className="mt-1 font-display text-3xl font-extrabold text-navy">
            Good to see you,{" "}
            {user?.name?.split(
              " "
            )[0] || "there"}
            .
          </h1>

          <p className="mt-2 text-sm text-[#647583]">
            Manage your
            appointments, medical
            history and
            prescriptions in one
            place.
          </p>
        </div>

        <Link
          className="btn-primary shrink-0"
          to="/doctors"
        >
          Book appointment
        </Link>
      </div>

      {error && (
        <div className="mt-5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-14 text-sm text-[#647583]">
          Loading your health
          information...
        </div>
      ) : (
        <>
          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map(
              ({
                icon: Icon,
                title,
                value,
                href,
              }) => {
                const content = (
                  <>
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#EAF8FA]">
                      <Icon className="h-5 w-5 text-teal" />
                    </div>

                    <p className="mt-4 text-sm font-medium text-[#647583]">
                      {title}
                    </p>

                    <p
                      className={`mt-1 break-words font-display font-bold ${
                        href
                          ? "text-lg text-navy transition-colors group-hover:text-teal"
                          : "text-2xl text-navy"
                      }`}
                    >
                      {value}
                    </p>
                  </>
                );

                if (href) {
                  return (
                    <Link
                      key={title}
                      to={href}
                      className="group card min-w-0 p-5 transition duration-200 hover:-translate-y-0.5 hover:border-teal hover:shadow-[0_14px_35px_rgba(11,41,69,0.09)]"
                    >
                      {content}
                    </Link>
                  );
                }

                return (
                  <div
                    className="card min-w-0 p-5"
                    key={title}
                  >
                    {content}
                  </div>
                );
              }
            )}
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <section>
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-display text-xl font-bold text-navy">
                  Upcoming
                  appointments
                </h2>

                <Link
                  to="/dashboard/patient/appointments"
                  className="text-sm font-semibold text-teal transition hover:text-navy"
                >
                  View all
                  appointments
                </Link>
              </div>

              <div className="mt-4 grid gap-3">
                {upcomingAppointments
                  .slice(0, 5)
                  .map(
                    (
                      appointment
                    ) => (
                      <article
                        className="card p-5 transition hover:border-[#CDE5E8]"
                        key={
                          appointment._id
                        }
                      >
                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                          <div className="min-w-0">
                            <p className="font-semibold text-navy">
                              {
                                (
                                  appointment.doctorId as any
                                )
                                  ?.userId
                                  ?.name
                              }
                            </p>

                            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[#647583]">
                              <span>
                                {formatAppointmentDate(
                                  appointment.date
                                )}
                              </span>

                              <span
                                aria-hidden="true"
                                className="text-[#A8B3BA]"
                              >
                                •
                              </span>

                              <span>
                                {
                                  appointment.startTime
                                }
                                {" – "}
                                {
                                  appointment.endTime
                                }
                              </span>
                            </div>

                            <p className="mt-3 text-sm font-medium leading-6 text-[#43515C]">
                              {
                                appointment.reason
                              }
                            </p>
                          </div>

                          <span
                            className={`h-fit shrink-0 rounded-full px-3 py-1 text-xs font-semibold capitalize ${appointmentStatusClasses(
                              appointment.status
                            )}`}
                          >
                            {
                              appointment.status
                            }
                          </span>
                        </div>
                      </article>
                    )
                  )}

                {upcomingAppointments.length ===
                  0 && (
                  <div className="card p-6">
                    <p className="font-semibold text-navy">
                      No upcoming
                      appointments
                    </p>

                    <p className="mt-2 text-sm leading-6 text-[#647583]">
                      When you book your
                      next appointment,
                      it will appear
                      here.
                    </p>

                    <Link
                      to="/doctors"
                      className="mt-4 inline-block text-sm font-semibold text-teal transition hover:text-navy"
                    >
                      Find a doctor →
                    </Link>
                  </div>
                )}

                {upcomingAppointments.length >
                  0 && (
                  <div className="px-1 pt-1">
                    <p className="text-[11px] leading-5 text-[#9AA6AE]">
                      {hiddenAppointmentCount >
                      0
                        ? `Showing your next 5 appointments. ${hiddenAppointmentCount} more upcoming ${
                            hiddenAppointmentCount ===
                            1
                              ? "appointment is"
                              : "appointments are"
                          } not shown here.`
                        : `Showing ${
                            upcomingAppointments.length ===
                            1
                              ? "your next appointment"
                              : `your next ${upcomingAppointments.length} appointments`
                          }.`}
                    </p>
                  </div>
                )}
              </div>
            </section>

            <div className="space-y-8">
              <section>
                <div className="flex items-center justify-between gap-4">
                  <h2 className="font-display text-xl font-bold text-navy">
                    Recent medical
                    record
                  </h2>
                </div>

                <div className="mt-4 grid gap-3">
                  {records
                    .slice(0, 1)
                    .map(
                      (
                        record
                      ) => (
                        <article
                          className="card p-5"
                          key={
                            record._id
                          }
                        >
                          <p className="font-semibold text-navy">
                            {
                              record.diagnosis
                            }
                          </p>

                          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-teal">
                            In simple
                            language
                          </p>

                          <p className="mt-2 text-sm leading-6 text-[#647583]">
                            {record.diagnosisExplanation ||
                              "No patient-friendly explanation was added."}
                          </p>

                          {record.treatment && (
                            <div className="mt-4 rounded-xl bg-[#F5FAFB] p-3">
                              <p className="text-xs font-semibold uppercase tracking-wide text-[#647583]">
                                Treatment
                              </p>

                              <p className="mt-1 text-sm text-navy">
                                {
                                  record.treatment
                                }
                              </p>
                            </div>
                          )}

                          <p className="mt-3 text-xs text-[#7B8A95]">
                            {new Date(
                              record.createdAt
                            ).toLocaleDateString(
                              "en-GB",
                              {
                                day: "numeric",
                                month:
                                  "short",
                                year: "numeric",
                              }
                            )}
                          </p>
                        </article>
                      )
                    )}

                  {records.length ===
                    0 && (
                    <div className="card p-6">
                      <p className="font-semibold text-navy">
                        No medical
                        records yet
                      </p>

                      <p className="mt-2 text-sm leading-6 text-[#647583]">
                        Your consultation
                        history will
                        appear here after
                        a doctor saves a
                        medical record.
                      </p>
                    </div>
                  )}
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between gap-4">
                  <h2 className="font-display text-xl font-bold text-navy">
                    Digital
                    prescriptions
                  </h2>

                  <Link
                    to="/verification"
                    className="text-sm font-semibold text-teal transition hover:text-navy"
                  >
                    Verify prescription
                  </Link>
                </div>

                <div className="mt-4 grid gap-4">
                  {prescriptions
                    .slice(0, 2)
                    .map(
                      (
                        prescription
                      ) => (
                        <article
                          className="card p-5"
                          key={
                            prescription._id
                          }
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <p className="break-words font-semibold text-navy">
                                {
                                  prescription.prescriptionCode
                                }
                              </p>

                              <p className="mt-2 text-sm text-[#647583]">
                                Doctor:{" "}
                                {
                                  prescription
                                    .doctorId
                                    ?.userId
                                    ?.name
                                }
                              </p>
                            </div>

                            <span
                              className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold capitalize ${prescriptionStatusClasses(
                                prescription.status
                              )}`}
                            >
                              {
                                prescription.status
                              }
                            </span>
                          </div>

                          <div className="mt-4 grid gap-3">
                            {prescription.medicines.map(
                              (
                                medicine,
                                index
                              ) => (
                                <div
                                  className="rounded-xl bg-[#F5FAFB] p-4 text-sm"
                                  key={`${medicine.name}-${index}`}
                                >
                                  <p className="font-semibold text-navy">
                                    {
                                      medicine.name
                                    }
                                  </p>

                                  <p className="mt-1 leading-6 text-[#647583]">
                                    {
                                      medicine.dosage
                                    }{" "}
                                    •{" "}
                                    {
                                      medicine.frequency
                                    }{" "}
                                    •{" "}
                                    {
                                      medicine.duration
                                    }
                                  </p>
                                </div>
                              )
                            )}
                          </div>

                          {prescription.instructions && (
                            <p className="mt-4 text-sm leading-6 text-[#647583]">
                              {
                                prescription.instructions
                              }
                            </p>
                          )}

                          <Link
                            className="mt-4 inline-block text-sm font-semibold text-teal transition hover:text-navy"
                            to={`/verification?code=${prescription.prescriptionCode}`}
                          >
                            Open verification
                            view →
                          </Link>
                        </article>
                      )
                    )}

                  {prescriptions.length ===
                    0 && (
                    <div className="card p-6">
                      <p className="font-semibold text-navy">
                        No digital
                        prescriptions
                      </p>

                      <p className="mt-2 text-sm leading-6 text-[#647583]">
                        Prescriptions
                        issued during
                        your consultations
                        will appear here.
                      </p>
                    </div>
                  )}

                  {hiddenPrescriptionCount >
                    0 && (
                    <p className="px-1 pt-1 text-[11px] leading-5 text-[#9AA6AE]">
                      Showing your 2 most
                      recent
                      prescriptions.{" "}
                      {
                        hiddenPrescriptionCount
                      }{" "}
                      older{" "}
                      {hiddenPrescriptionCount ===
                      1
                        ? "prescription is"
                        : "prescriptions are"}{" "}
                      not shown here.
                    </p>
                  )}
                </div>
              </section>
            </div>
          </div>
        </>
      )}
    </section>
  );
}