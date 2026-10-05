import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Pill,
  Search,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router-dom";

import { api } from "../services/api";

type DoctorUser = {
  name?: string;
};

type Doctor = {
  _id?: string;
  userId?: DoctorUser;
};

type Medicine = {
  _id?: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
};

type Prescription = {
  _id: string;
  prescriptionCode: string;
  doctorId?: Doctor;
  medicines: Medicine[];
  instructions?: string;
  issuedAt?: string;
  expiresAt?: string;
  status: string;
};

function formatDate(
  value?: string
) {
  if (!value) {
    return "Not provided";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Not provided";
  }

  return new Intl.DateTimeFormat(
    "en-ZW",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  ).format(date);
}

function doctorName(
  prescription: Prescription
) {
  return (
    prescription.doctorId
      ?.userId?.name ||
    "MediLink doctor"
  );
}

function statusClasses(
  status: string
) {
  switch (
    status.toLowerCase()
  ) {
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

export default function Prescriptions() {
  const [
    prescriptions,
    setPrescriptions,
  ] = useState<
    Prescription[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    selectedPrescriptionId,
    setSelectedPrescriptionId,
  ] = useState<
    string | null
  >(null);

  useEffect(() => {
    let active = true;

    async function loadPrescriptions() {
      try {
        setLoading(true);
        setError("");

        const response =
          await api.get(
            "/prescriptions/mine"
          );

        const nextPrescriptions =
          Array.isArray(
            response.data
              ?.prescriptions
          )
            ? response.data
                .prescriptions
            : [];

        if (!active) {
          return;
        }

        setPrescriptions(
          nextPrescriptions
        );

        if (
          nextPrescriptions.length >
          0
        ) {
          setSelectedPrescriptionId(
            nextPrescriptions[0]
              ._id
          );
        }
      } catch (
        error: any
      ) {
        if (!active) {
          return;
        }

        setError(
          error.response
            ?.data
            ?.message ||
            "Your prescriptions could not be loaded."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadPrescriptions();

    return () => {
      active = false;
    };
  }, []);

  const filteredPrescriptions =
    useMemo(() => {
      const term =
        search
          .trim()
          .toLowerCase();

      if (!term) {
        return prescriptions;
      }

      return prescriptions.filter(
        (
          prescription
        ) => {
          const searchable =
            [
              prescription.prescriptionCode,
              doctorName(
                prescription
              ),
              prescription.status,
              prescription.instructions,
              ...prescription.medicines.flatMap(
                (
                  medicine
                ) => [
                  medicine.name,
                  medicine.dosage,
                  medicine.frequency,
                  medicine.duration,
                ]
              ),
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

          return searchable.includes(
            term
          );
        }
      );
    }, [
      prescriptions,
      search,
    ]);

  const selectedPrescription =
    useMemo(() => {
      if (
        filteredPrescriptions.length ===
        0
      ) {
        return null;
      }

      const selected =
        filteredPrescriptions.find(
          (
            prescription
          ) =>
            prescription._id ===
            selectedPrescriptionId
        );

      return (
        selected ||
        filteredPrescriptions[0]
      );
    }, [
      filteredPrescriptions,
      selectedPrescriptionId,
    ]);

  return (
    <main className="min-h-screen bg-[#F8FBFC]">
      <section className="border-b border-[#E2EBEF] bg-white">
        <div className="mx-auto max-w-7xl px-5 py-9 lg:px-8">
          <Link
            to="/dashboard/patient"
            className="inline-flex items-center gap-2 text-sm font-semibold text-teal transition hover:text-navy"
          >
            <ArrowLeft className="h-4 w-4" />

            Back to dashboard
          </Link>

          <div className="mt-6 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-teal">
                Patient prescriptions
              </p>

              <h1 className="mt-2 font-display text-3xl font-extrabold text-navy md:text-4xl">
                Prescriptions
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#647583] md:text-base">
                Review prescriptions issued during your
                consultations, including medicines,
                dosing instructions and prescription
                status.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E2EBEF] bg-[#F5FAFB] px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#7A8995]">
                Total prescriptions
              </p>

              <p className="mt-1 text-2xl font-bold text-navy">
                {
                  prescriptions.length
                }
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <div className="mb-6">
          <div className="relative max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A99A5]" />

            <input
              type="search"
              value={search}
              onChange={(
                event
              ) =>
                setSearch(
                  event.target
                    .value
                )
              }
              placeholder="Search medicine, doctor or prescription code"
              className="field pl-11"
            />
          </div>
        </div>

        {loading ? (
          <div className="card flex min-h-[320px] items-center justify-center p-8">
            <p className="text-sm font-medium text-[#647583]">
              Loading your prescriptions...
            </p>
          </div>
        ) : prescriptions.length ===
          0 ? (
          <div className="card flex min-h-[360px] flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF8FA] text-teal">
              <Pill className="h-6 w-6" />
            </div>

            <h2 className="mt-5 text-xl font-bold text-navy">
              No prescriptions yet
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-[#647583]">
              Prescriptions issued during your MediLink
              consultations will appear here.
            </p>

            <Link
              to="/doctors"
              className="btn-primary mt-6"
            >
              Find a doctor
            </Link>
          </div>
        ) : filteredPrescriptions.length ===
          0 ? (
          <div className="card flex min-h-[300px] flex-col items-center justify-center px-6 py-12 text-center">
            <Search className="h-6 w-6 text-teal" />

            <h2 className="mt-4 text-lg font-bold text-navy">
              No matching prescriptions
            </h2>

            <p className="mt-2 text-sm text-[#647583]">
              Try another medicine name, doctor or
              prescription code.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.35fr)]">
            <div className="space-y-3">
              {filteredPrescriptions.map(
                (
                  prescription
                ) => {
                  const isSelected =
                    selectedPrescription?._id ===
                    prescription._id;

                  return (
                    <button
                      key={
                        prescription._id
                      }
                      type="button"
                      onClick={() =>
                        setSelectedPrescriptionId(
                          prescription._id
                        )
                      }
                      className={`w-full rounded-2xl border bg-white p-5 text-left shadow-[0_10px_30px_rgba(11,41,69,0.04)] transition ${
                        isSelected
                          ? "border-teal bg-[#F5FBFC]"
                          : "border-[#E2EBEF] hover:border-[#B9DCE1]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="break-words font-semibold text-navy">
                            {
                              prescription.prescriptionCode
                            }
                          </p>

                          <p className="mt-1 text-sm text-[#647583]">
                            {
                              doctorName(
                                prescription
                              )
                            }
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusClasses(
                            prescription.status
                          )}`}
                        >
                          {
                            prescription.status
                          }
                        </span>
                      </div>

                      <div className="mt-4 border-t border-[#E2EBEF] pt-4">
                        <p className="text-sm font-semibold text-navy">
                          {prescription
                            .medicines[0]
                            ?.name ||
                            "Prescription medicine"}
                        </p>

                        <p className="mt-1 text-xs text-[#7A8995]">
                          Issued{" "}
                          {
                            formatDate(
                              prescription.issuedAt
                            )
                          }
                        </p>
                      </div>
                    </button>
                  );
                }
              )}
            </div>

            {selectedPrescription && (
              <article className="card overflow-hidden">
                <div className="border-b border-[#E2EBEF] bg-[#F5FAFB] p-6">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-teal">
                        Digital prescription
                      </p>

                      <h2 className="mt-2 break-words font-display text-2xl font-extrabold text-navy">
                        {
                          selectedPrescription.prescriptionCode
                        }
                      </h2>

                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#647583]">
                        <span className="inline-flex items-center gap-2">
                          <Stethoscope className="h-4 w-4 text-teal" />

                          {
                            doctorName(
                              selectedPrescription
                            )
                          }
                        </span>

                        <span className="inline-flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-teal" />

                          {
                            formatDate(
                              selectedPrescription.issuedAt
                            )
                          }
                        </span>
                      </div>
                    </div>

                    <span
                      className={`h-fit rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusClasses(
                        selectedPrescription.status
                      )}`}
                    >
                      {
                        selectedPrescription.status
                      }
                    </span>
                  </div>
                </div>

                <div className="space-y-7 p-6">
                  <section>
                    <div className="flex items-center gap-2">
                      <Pill className="h-5 w-5 text-teal" />

                      <h3 className="text-sm font-bold text-navy">
                        Medicines
                      </h3>
                    </div>

                    <div className="mt-4 grid gap-4">
                      {selectedPrescription.medicines.map(
                        (
                          medicine,
                          index
                        ) => (
                          <div
                            key={`${medicine.name}-${medicine._id ?? index}`}
                            className="rounded-2xl border border-[#E2EBEF] bg-[#F9FCFC] p-5"
                          >
                            <p className="font-semibold text-navy">
                              {
                                medicine.name
                              }
                            </p>

                            <div className="mt-4 grid gap-3 sm:grid-cols-3">
                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7A8995]">
                                  Dosage
                                </p>

                                <p className="mt-1 text-sm text-[#43515C]">
                                  {
                                    medicine.dosage
                                  }
                                </p>
                              </div>

                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7A8995]">
                                  Frequency
                                </p>

                                <p className="mt-1 text-sm text-[#43515C]">
                                  {
                                    medicine.frequency
                                  }
                                </p>
                              </div>

                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7A8995]">
                                  Duration
                                </p>

                                <p className="mt-1 text-sm text-[#43515C]">
                                  {
                                    medicine.duration
                                  }
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </section>

                  <section className="rounded-2xl border border-[#E2EBEF] bg-white p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#7A8995]">
                      Dispensing instructions
                    </p>

                    <p className="mt-3 text-sm leading-7 text-navy">
                      {selectedPrescription.instructions ||
                        "No additional dispensing instructions were recorded."}
                    </p>
                  </section>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <section className="rounded-2xl border border-[#E2EBEF] bg-white p-5">
                      <div className="flex items-center gap-2 text-teal">
                        <Clock3 className="h-4 w-4" />

                        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#7A8995]">
                          Expires
                        </p>
                      </div>

                      <p className="mt-3 text-sm font-semibold text-navy">
                        {
                          formatDate(
                            selectedPrescription.expiresAt
                          )
                        }
                      </p>
                    </section>

                    <section className="rounded-2xl border border-[#E2EBEF] bg-white p-5">
                      <div className="flex items-center gap-2 text-teal">
                        <CheckCircle2 className="h-4 w-4" />

                        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#7A8995]">
                          Status
                        </p>
                      </div>

                      <p className="mt-3 text-sm font-semibold capitalize text-navy">
                        {
                          selectedPrescription.status
                        }
                      </p>
                    </section>
                  </div>

                  <div className="rounded-xl border border-[#D9EDF0] bg-[#F3FAFB] p-4">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-teal" />

                      <div>
                        <p className="text-sm font-semibold text-navy">
                          Pharmacy verification
                        </p>

                        <p className="mt-1 text-xs leading-5 text-[#647583]">
                          Pharmacies can verify this prescription
                          using its prescription code without
                          accessing your full medical history.
                        </p>
                      </div>
                    </div>

                    <Link
                      to={`/verification?code=${selectedPrescription.prescriptionCode}`}
                      className="mt-4 inline-flex text-sm font-semibold text-teal transition hover:text-navy"
                    >
                      Open verification view →
                    </Link>
                  </div>
                </div>
              </article>
            )}
          </div>
        )}
      </section>
    </main>
  );
}