import ContextualError from "../components/ui/ContextualError";
import LoadingState from "../components/ui/LoadingState";
import {
  FileHeart,
  Search,
  Stethoscope,
  CalendarDays,
  ClipboardPlus,
  ArrowLeft,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSearchParams, Link } from "react-router-dom";

import { api } from "../services/api";

type DoctorUser = {
  name?: string;
};

type Doctor = {
  _id?: string;
  userId?: DoctorUser;
  speciality?: string;
};

type MedicalRecord = {
  _id: string;
  doctorId?: Doctor;
  appointmentId?: string;
  diagnosis: string;
  diagnosisExplanation?: string;
  symptoms?: string;
  observations?: string;
  treatment?: string;
  followUp?: string;
  createdAt?: string;
  updatedAt?: string;
};

function formatDate(
  value?: string
) {
  if (!value) {
    return "Date unavailable";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Date unavailable";
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

function recordDoctorName(
  record: MedicalRecord
) {
  return (
    record.doctorId
      ?.userId?.name ||
    "MediLink doctor"
  );
}

export default function MedicalRecords() {
  const [params, setParams] = useSearchParams();
  const appointmentFilter = params.get("appointment");
  const [
    records,
    setRecords,
  ] = useState<
    MedicalRecord[]
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
    selectedRecordId,
    setSelectedRecordId,
  ] = useState<
    string | null
  >(null);

  useEffect(() => {
    let active = true;

    async function loadRecords() {
      try {
        setLoading(true);
        setError("");

        const response =
          await api.get(
            "/medical-records/mine"
          );

        const nextRecords =
          Array.isArray(
            response.data
              ?.records
          )
            ? response.data
                .records
            : [];

        if (!active) {
          return;
        }

        setRecords(
          nextRecords
        );

        if (
          nextRecords.length >
          0
        ) {
          setSelectedRecordId(
            nextRecords[0]
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
            "Your medical records could not be loaded."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadRecords();

    return () => {
      active = false;
    };
  }, []);

  const filteredRecords =
    useMemo(() => {
      const linked = appointmentFilter ? records.filter(item => item.appointmentId === appointmentFilter) : records;
      const term =
        search
          .trim()
          .toLowerCase();

      if (!term) {
        return linked;
      }

      return linked.filter(
        (record) => {
          const searchable =
            [
              record.diagnosis,
              record
                .diagnosisExplanation,
              record.symptoms,
              record
                .observations,
              record.treatment,
              record.followUp,
              recordDoctorName(
                record
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
      appointmentFilter,
      records,
      search,
    ]);

  const selectedRecord =
    useMemo(() => {
      if (
        filteredRecords.length ===
        0
      ) {
        return null;
      }

      const selected =
        filteredRecords.find(
          (record) =>
            record._id ===
            selectedRecordId
        );

      return (
        selected ||
        filteredRecords[0]
      );
    }, [
      filteredRecords,
      selectedRecordId,
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
                Patient records
              </p>

              <h1 className="mt-2 font-display text-3xl font-extrabold text-navy md:text-4xl">
                Medical records
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#647583] md:text-base">
                Review your consultation history,
                diagnoses, treatment plans and
                follow-up information recorded by
                your MediLink doctors.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E2EBEF] bg-[#F5FAFB] px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#7A8995]">
                Total records
              </p>

              <p className="mt-1 text-2xl font-bold text-navy">
                {records.length}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        {error && (
          <ContextualError message={error} />
        )}

        <div className="mb-6">
          <div className="relative max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A99A5]" />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target
                    .value
                )
              }
              placeholder="Search diagnosis, treatment or doctor"
              className="field pl-11"
            />
          </div>
        </div>

        {appointmentFilter && <div className="my-4 flex flex-wrap items-center gap-3 text-sm"><span>Showing documents from the linked consultation</span><button className="btn-secondary" onClick={() => { const next = new URLSearchParams(params); next.delete("appointment"); setParams(next); }}>Show all consultations</button></div>}
        {loading ? (
          <LoadingState label="Loading your medical records" />
        ) : records.length ===
          0 ? (
          <div className="card flex min-h-[360px] flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF8FA] text-teal">
              <FileHeart className="h-6 w-6" />
            </div>

            <h2 className="mt-5 text-xl font-bold text-navy">
              No medical records yet
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-[#647583]">
              Medical records will appear here after
              a doctor completes one of your
              consultations.
            </p>

            <Link
              to="/doctors"
              className="btn-primary mt-6"
            >
              Find a doctor
            </Link>
          </div>
        ) : filteredRecords.length ===
          0 ? (
          <div className="card flex min-h-[300px] flex-col items-center justify-center px-6 py-12 text-center">
            <Search className="h-6 w-6 text-teal" />

            <h2 className="mt-4 text-lg font-bold text-navy">
              No matching records
            </h2>

            <p className="mt-2 text-sm text-[#647583]">
              Try searching with a different diagnosis,
              treatment or doctor name.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.35fr)]">
            <div className="space-y-3">
              {filteredRecords.map(
                (record) => {
                  const isSelected =
                    selectedRecord
                      ?._id ===
                    record._id;

                  return (
                    <button
                      key={
                        record._id
                      }
                      type="button"
                      onClick={() =>
                        setSelectedRecordId(
                          record._id
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
                          <h2 className="font-semibold text-navy">
                            {
                              record.diagnosis
                            }
                          </h2>

                          <p className="mt-1 text-sm text-[#647583]">
                            {
                              recordDoctorName(
                                record
                              )
                            }
                          </p>
                        </div>

                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EAF8FA] text-teal">
                          <FileHeart className="h-4 w-4" />
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-2 border-t border-[#E2EBEF] pt-4 text-xs font-medium text-[#7A8995]">
                        <CalendarDays className="h-4 w-4" />

                        {formatDate(
                          record.createdAt
                        )}
                      </div>
                    </button>
                  );
                }
              )}
            </div>

            {selectedRecord && (
              <article className="card overflow-hidden">
                <div className="border-b border-[#E2EBEF] bg-[#F5FAFB] p-6">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-teal">
                        Medical record
                      </p>

                      <h2 className="mt-2 font-display text-2xl font-extrabold text-navy">
                        {
                          selectedRecord.diagnosis
                        }
                      </h2>

                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#647583]">
                        <span className="inline-flex items-center gap-2">
                          <Stethoscope className="h-4 w-4 text-teal" />

                          {recordDoctorName(
                            selectedRecord
                          )}
                        </span>

                        <span className="inline-flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-teal" />

                          {formatDate(
                            selectedRecord.createdAt
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-teal shadow-sm">
                      <ClipboardPlus className="h-5 w-5" />
                    </div>
                  </div>
                </div>

                <div className="space-y-7 p-6">
                  {selectedRecord.appointmentId && <Link className="inline-block text-sm font-semibold text-teal-dark" to={"/dashboard/patient/prescriptions?appointment=" + encodeURIComponent(selectedRecord.appointmentId)}>View prescriptions from this consultation →</Link>}
                  <section>
                    <h3 className="text-sm font-bold text-navy">
                      Diagnosis explanation
                    </h3>

                    <p className="mt-2 text-sm leading-7 text-[#647583]">
                      {selectedRecord
                        .diagnosisExplanation ||
                        "No explanation was recorded for this diagnosis."}
                    </p>
                  </section>

                  {selectedRecord.symptoms && (
                    <section>
                      <h3 className="text-sm font-bold text-navy">
                        Symptoms
                      </h3>

                      <p className="mt-2 rounded-xl bg-[#F7FAFB] p-4 text-sm leading-7 text-[#516472]">
                        {
                          selectedRecord.symptoms
                        }
                      </p>
                    </section>
                  )}

                  {selectedRecord.observations && (
                    <section>
                      <h3 className="text-sm font-bold text-navy">
                        Clinical observations
                      </h3>

                      <p className="mt-2 rounded-xl bg-[#F7FAFB] p-4 text-sm leading-7 text-[#516472]">
                        {
                          selectedRecord.observations
                        }
                      </p>
                    </section>
                  )}

                  <div className="grid gap-5 md:grid-cols-2">
                    <section className="rounded-2xl border border-[#E2EBEF] bg-white p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#7A8995]">
                        Treatment
                      </p>

                      <p className="mt-3 text-sm leading-7 text-navy">
                        {selectedRecord
                          .treatment ||
                          "No treatment plan was recorded."}
                      </p>
                    </section>

                    <section className="rounded-2xl border border-[#E2EBEF] bg-white p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#7A8995]">
                        Follow-up
                      </p>

                      <p className="mt-3 text-sm leading-7 text-navy">
                        {selectedRecord
                          .followUp ||
                          "No follow-up instructions were recorded."}
                      </p>
                    </section>
                  </div>

                  <div className="rounded-xl border border-[#D9EDF0] bg-[#F3FAFB] px-4 py-4">
                    <p className="text-xs leading-5 text-[#647583]">
                      These records are part of your
                      MediLink health history. If any
                      information appears incorrect,
                      contact the healthcare provider
                      who recorded the consultation.
                    </p>
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