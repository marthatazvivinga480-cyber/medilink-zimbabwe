import ContextualError from "../components/ui/ContextualError";
import OptimizedImage from "../components/OptimizedImage";
import ConsultationFee from "../components/ConsultationFee";
import {
  useEffect,
  useState,
} from "react";

import { Link } from "react-router-dom";

import {
  BadgeCheck,
  Building2,
  Languages,
  MapPin,
  Search,
  Stethoscope,
} from "lucide-react";

import { api } from "../services/api";
import type { Doctor } from "../types";
import FilterSelect from "../components/ui/FilterSelect";

type DoctorImageConfig = {
  position: string;
  scale?: number;
};

const doctorImageConfig: Record<
  string,
  DoctorImageConfig
> = {
  "Dr. Tendai Moyo": {
    position: "50% 18%",
  },

  "Dr. Rutendo Chikowore": {
    position: "50% 14%",
  },

  "Dr. Tinashe Ncube": {
    position: "50% 18%",
  },

  "Dr. Nyasha Mupfumi": {
    position: "50% 12%",
  },

  "Dr. Farai Dube": {
    position: "50% 18%",
    scale: 1.45,
  },

  "Dr. Tariro Maposa": {
    position: "50% 8%",
    scale: 1.08,
  },
};

function DoctorPhoto({
  doctor,
}: {
  doctor: Doctor;
}) {
  const [failed, setFailed] =
    useState(false);

  const doctorName =
    doctor.userId?.name || "";

  const imageConfig =
    doctorImageConfig[doctorName] || {
      position: "50% 20%",
      scale: 1,
    };

  if (!doctor.photoUrl || failed) {
    return (
      <div className="grid h-full w-full place-items-center bg-[#EAF8FA]">
        <Stethoscope className="h-12 w-12 text-teal" />
      </div>
    );
  }

  return (
    <OptimizedImage
      decoding="async"
      loading="lazy"
      width={440}
      height={550}
      src={doctor.photoUrl}
      alt={
        doctor.userId?.name ||
        "Doctor profile"
      }
      className="h-full w-full object-cover transition-transform duration-300"
      style={{
        objectPosition:
          imageConfig.position,
        transform: `scale(${
          imageConfig.scale ?? 1
        })`,
      }}
      onError={() =>
        setFailed(true)
      }
    />
  );
}

export default function Doctors() {
  const [doctors, setDoctors] =
    useState<Doctor[]>([]);

  const [
    specialities,
    setSpecialities,
  ] = useState<string[]>([]);

  const [locations, setLocations] =
    useState<string[]>([]);

  const [search, setSearch] =
    useState("");

  const [
    speciality,
    setSpeciality,
  ] = useState("");

  const [location, setLocation] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadFilters() {
      try {
        const [
          specialityResponse,
          locationResponse,
        ] = await Promise.all([
          api.get(
            "/doctors/specialities"
          ),

          api.get(
            "/doctors/locations"
          ),
        ]);

        setSpecialities(
          specialityResponse.data
            .specialities ?? []
        );

        setLocations(
          locationResponse.data
            .locations ?? []
        );
      } catch {
        setError(
          "Some doctor filters could not be loaded."
        );
      }
    }

    void loadFilters();
  }, []);

  useEffect(() => {
    let active = true;

    const timeout =
      window.setTimeout(
        async () => {
          try {
            setLoading(true);
            setError("");

            const response =
              await api.get(
                "/doctors",
                {
                  params: {
                    ...(search.trim()
                      ? {
                          search:
                            search.trim(),
                        }
                      : {}),

                    ...(speciality
                      ? {
                          speciality,
                        }
                      : {}),

                    ...(location
                      ? {
                          location,
                        }
                      : {}),
                  },
                }
              );

            if (!active) {
              return;
            }

            setDoctors(
              response.data
                .doctors ?? []
            );
          } catch (error: any) {
            if (!active) {
              return;
            }

            setError(
              error.response?.data
                ?.message ||
                "Doctors could not be loaded."
            );
          } finally {
            if (active) {
              setLoading(false);
            }
          }
        },
        250
      );

    return () => {
      active = false;

      window.clearTimeout(
        timeout
      );
    };
  }, [
    search,
    speciality,
    location,
  ]);

  function clearFilters() {
    setSearch("");
    setSpeciality("");
    setLocation("");
  }

  return (
    <main>
      <section className="border-b border-[#E2EBEF] bg-[#F5FAFB]">
        <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-teal">
            Find care
          </p>

          <h1 className="mt-3 max-w-3xl font-display text-4xl font-extrabold leading-tight text-navy">
            Find the right doctor for your
            care.
          </h1>

          <p className="mt-4 max-w-2xl leading-7 text-[#647583]">
            Search healthcare professionals by
            speciality and location, then view
            their profile and available
            appointment times.
          </p>

          <div className="mt-8 grid gap-3 rounded-2xl border border-[#E2EBEF] bg-white p-4 shadow-sm md:grid-cols-[1.5fr_1fr_1fr]">
            <label className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8A99A5]" />

              <input
                className="field h-12 pl-11"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search doctor, speciality or facility"
              />
            </label>

            <FilterSelect
              value={speciality}
              placeholder="All specialities"
              options={specialities}
              onChange={
                setSpeciality
              }
            />

            <FilterSelect
              value={location}
              placeholder="All locations"
              options={locations}
              onChange={
                setLocation
              }
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
        <div className="flex flex-col justify-between gap-4 border-b border-[#E2EBEF] pb-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-2xl font-bold text-navy">
              Available doctors
            </h2>

            <p className="mt-1 text-sm text-[#647583]">
              {loading
                ? "Loading doctors..."
                : `${doctors.length} ${
                    doctors.length === 1
                      ? "doctor"
                      : "doctors"
                  } found`}
            </p>
          </div>

          {(search ||
            speciality ||
            location) && (
            <button
              type="button"
              onClick={
                clearFilters
              }
              className="text-sm font-semibold text-teal transition hover:text-teal-dark"
            >
              Clear filters
            </button>
          )}
        </div>

        {error && (
          <ContextualError message={error} />
        )}

        {loading ? (
          <div className="grid gap-6 py-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              1,
              2,
              3,
              4,
              5,
              6,
            ].map((item) => (
              <div
                key={item}
                className="h-[480px] animate-pulse rounded-2xl bg-[#F2F6F7]"
              />
            ))}
          </div>
        ) : doctors.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-xl bg-[#EAF8FA]">
              <Stethoscope className="h-6 w-6 text-teal" />
            </div>

            <h3 className="mt-5 font-display text-xl font-bold text-navy">
              No doctors found
            </h3>

            <p className="mt-2 text-sm text-[#647583]">
              Try changing your search or
              filters.
            </p>

            {(search ||
              speciality ||
              location) && (
              <button
                type="button"
                onClick={
                  clearFilters
                }
                className="mt-5 text-sm font-semibold text-teal"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {doctors.map(
              (doctor) => (
                <article
                  key={
                    doctor._id
                  }
                  className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#E2EBEF] bg-white transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(11,41,69,0.09)]"
                >
                  <div className="relative h-64 overflow-hidden bg-[#F5FAFB]">
                    <DoctorPhoto
                      doctor={
                        doctor
                      }
                    />

                    {doctor.isVerified && (
                      <div className="absolute left-4 top-4 z-10 flex items-center gap-1.5 rounded-full border border-white/70 bg-white/95 px-3 py-1.5 text-xs font-semibold text-navy shadow-sm backdrop-blur-sm">
                        <BadgeCheck className="h-4 w-4 text-teal" />

                        Verified provider
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <p className="text-sm font-semibold text-teal">
                      {
                        doctor.speciality
                      }
                    </p>

                    <h3 className="mt-1 font-display text-xl font-bold text-navy">
                      {
                        doctor.userId
                          ?.name
                      }
                    </h3>

                    <ConsultationFee doctor={doctor} /><p className="text-xs text-slate-600">Choose a profile to check live appointment times.</p>
                    <div className="mt-5 space-y-3 text-sm text-[#647583]">
                      {doctor.facility && (
                        <p className="flex items-start gap-2">
                          <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-teal" />

                          <span>
                            {
                              doctor.facility
                            }
                          </span>
                        </p>
                      )}

                      {doctor.location && (
                        <p className="flex items-start gap-2">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teal" />

                          <span>
                            {
                              doctor.location
                            }
                          </span>
                        </p>
                      )}

                      {!!doctor
                        .languages
                        ?.length && (
                        <p className="flex items-start gap-2">
                          <Languages className="mt-0.5 h-4 w-4 shrink-0 text-teal" />

                          <span>
                            {doctor.languages.join(
                              " · "
                            )}
                          </span>
                        </p>
                      )}
                    </div>

                    <p className="mt-4 line-clamp-3 min-h-[72px] text-sm leading-6 text-[#647583]">
                      {doctor.biography ||
                        "Healthcare professional available for appointments."}
                    </p>

                    {!!doctor
                      .qualifications
                      ?.length && (
                      <div className="mt-5 flex flex-wrap gap-2">
                        {doctor.qualifications
                          .slice(
                            0,
                            2
                          )
                          .map(
                            (
                              qualification
                            ) => (
                              <span
                                key={
                                  qualification
                                }
                                className="rounded-full bg-[#F5FAFB] px-3 py-1 text-xs font-medium text-navy"
                              >
                                {
                                  qualification
                                }
                              </span>
                            )
                          )}
                      </div>
                    )}

                    <div className="mt-auto flex items-end justify-between gap-4 border-t border-[#E2EBEF] pt-5">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-[#8A99A5]">
                          Experience
                        </p>

                        <p className="mt-1 font-semibold text-navy">
                          {doctor.yearsOfExperience ??
                            0}{" "}
                          years
                        </p>
                      </div>

                      <Link
                        to={`/doctors/${doctor._id}`}
                        className="btn-primary"
                      >
                        View profile
                      </Link>
                    </div>
                  </div>
                </article>
              )
            )}
          </div>
        )}
      </section>
    </main>
  );
}