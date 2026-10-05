import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  BadgeCheck,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Languages,
  MapPin,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";

import { api } from "../services/api";

import type {
  AvailabilitySlot,
  Doctor,
  DoctorAvailability,
} from "../types";

import { useAuth } from "../context/AuthContext";

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

  "Melody Tom": {
    position: "50% 18%",
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
    <img
      src={doctor.photoUrl}
      alt={
        doctor.userId?.name ||
        "Doctor profile"
      }
      className="h-full w-full object-cover"
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

function formatDate(
  value: string
) {
  return new Date(
    `${value}T00:00:00`
  ).toLocaleDateString(
    undefined,
    {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

function DateDropdown({
  value,
  availability,
  onChange,
}: {
  value: string;
  availability: DoctorAvailability[];
  onChange: (
    value: string
  ) => void;
}) {
  const [open, setOpen] =
    useState(false);

  const [
    highlightedIndex,
    setHighlightedIndex,
  ] = useState(-1);

  const dropdownRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const optionRefs =
    useRef<
      Array<HTMLButtonElement | null>
    >([]);

  const selectedIndex =
    availability.findIndex(
      (item) =>
        item.date === value
    );

  function openDropdown() {
    if (!availability.length) {
      setOpen(true);
      setHighlightedIndex(-1);

      return;
    }

    setOpen(true);

    setHighlightedIndex(
      selectedIndex >= 0
        ? selectedIndex
        : 0
    );
  }

  function closeDropdown() {
    setOpen(false);
    setHighlightedIndex(-1);
  }

  function toggleDropdown() {
    if (open) {
      closeDropdown();
    } else {
      openDropdown();
    }
  }

  function selectDate(
    index: number
  ) {
    const selected =
      availability[index];

    if (!selected) {
      return;
    }

    onChange(selected.date);
    closeDropdown();
  }

  function moveHighlight(
    direction: 1 | -1
  ) {
    if (!availability.length) {
      return;
    }

    setHighlightedIndex(
      (current) => {
        if (current < 0) {
          return direction === 1
            ? 0
            : availability.length -
                1;
        }

        const next =
          current + direction;

        if (
          next >=
          availability.length
        ) {
          return 0;
        }

        if (next < 0) {
          return (
            availability.length - 1
          );
        }

        return next;
      }
    );
  }

  function handleKeyDown(
    event: React.KeyboardEvent
  ) {
    if (!open) {
      if (
        event.key ===
          "ArrowDown" ||
        event.key ===
          "ArrowUp" ||
        event.key === "Enter" ||
        event.key === " "
      ) {
        event.preventDefault();

        openDropdown();
      }

      return;
    }

    if (
      event.key === "ArrowDown"
    ) {
      event.preventDefault();

      moveHighlight(1);

      return;
    }

    if (
      event.key === "ArrowUp"
    ) {
      event.preventDefault();

      moveHighlight(-1);

      return;
    }

    if (event.key === "Home") {
      event.preventDefault();

      if (availability.length) {
        setHighlightedIndex(0);
      }

      return;
    }

    if (event.key === "End") {
      event.preventDefault();

      if (availability.length) {
        setHighlightedIndex(
          availability.length - 1
        );
      }

      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();

      if (
        highlightedIndex >= 0
      ) {
        selectDate(
          highlightedIndex
        );
      }

      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();

      closeDropdown();
    }
  }

  useEffect(() => {
    function handleOutsideClick(
      event: MouseEvent
    ) {
      if (
        !dropdownRef.current
      ) {
        return;
      }

      if (
        !dropdownRef.current.contains(
          event.target as Node
        )
      ) {
        closeDropdown();
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  useEffect(() => {
    if (
      !open ||
      highlightedIndex < 0
    ) {
      return;
    }

    const highlightedOption =
      optionRefs.current[
        highlightedIndex
      ];

    highlightedOption?.scrollIntoView(
      {
        block: "nearest",
      }
    );
  }, [
    highlightedIndex,
    open,
  ]);

  return (
    <div
      ref={dropdownRef}
      className="relative mt-2"
      onKeyDown={
        handleKeyDown
      }
    >
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls="doctor-date-options"
        onClick={
          toggleDropdown
        }
        className={`flex h-12 w-full items-center justify-between rounded-xl border bg-white px-4 text-left text-sm font-medium outline-none transition ${
          open
            ? "border-teal ring-2 ring-teal/10"
            : "border-[#DCE5E8] hover:border-teal"
        }`}
      >
        <span
          className={
            value
              ? "text-navy"
              : "text-[#647583]"
          }
        >
          {value
            ? formatDate(value)
            : "Choose a date"}
        </span>

        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[#647583] transition-transform duration-200 ${
            open
              ? "rotate-180"
              : ""
          }`}
        />
      </button>

      {open && (
        <div
          id="doctor-date-options"
          role="listbox"
          aria-label="Available appointment dates"
          className="absolute left-0 right-0 top-[calc(100%+8px)] z-40 overflow-hidden rounded-xl border border-[#DCE5E8] bg-white p-2 shadow-[0_18px_45px_rgba(11,41,69,0.14)]"
        >
          {availability.length >
          0 ? (
            <div className="max-h-64 space-y-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {availability.map(
                (
                  item,
                  index
                ) => {
                  const selected =
                    value ===
                    item.date;

                  const highlighted =
                    index ===
                    highlightedIndex;

                  return (
                    <button
                      ref={(
                        element
                      ) => {
                        optionRefs.current[
                          index
                        ] =
                          element;
                      }}
                      key={
                        item.date
                      }
                      type="button"
                      role="option"
                      tabIndex={-1}
                      aria-selected={
                        selected
                      }
                      onMouseEnter={() =>
                        setHighlightedIndex(
                          index
                        )
                      }
                      onFocus={() =>
                        setHighlightedIndex(
                          index
                        )
                      }
                      onClick={() =>
                        selectDate(
                          index
                        )
                      }
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm outline-none transition ${
                        highlighted
                          ? "bg-[#EAF8FA] text-navy"
                          : "bg-white text-navy"
                      } ${
                        selected
                          ? "font-semibold text-teal"
                          : ""
                      }`}
                    >
                      <span>
                        {formatDate(
                          item.date
                        )}
                      </span>

                      {selected && (
                        <Check className="h-4 w-4 shrink-0 text-teal" />
                      )}
                    </button>
                  );
                }
              )}
            </div>
          ) : (
            <div className="rounded-lg bg-[#F5FAFB] px-4 py-4">
              <div className="flex items-start gap-3">
                <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-teal" />

                <div>
                  <p className="text-sm font-medium text-navy">
                    No dates available
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#647583]">
                    This doctor has not added any appointment availability yet.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DoctorProfile() {
  const { id } =
    useParams();

  const navigate =
    useNavigate();

  const { user } =
    useAuth();

  const [doctor, setDoctor] =
    useState<Doctor | null>(
      null
    );

  const [
    availability,
    setAvailability,
  ] = useState<
    DoctorAvailability[]
  >([]);

  const [date, setDate] =
    useState("");

  const [slot, setSlot] =
    useState<AvailabilitySlot | null>(
      null
    );

  const [reason, setReason] =
    useState(
      "General consultation"
    );

  const [loading, setLoading] =
    useState(true);

  const [booking, setBooking] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [
    messageType,
    setMessageType,
  ] = useState<
    "success" | "error"
  >("success");

  useEffect(() => {
    if (!id) return;

    let active = true;

    async function loadProfile() {
      try {
        setLoading(true);

        const [
          doctorResponse,
          availabilityResponse,
        ] =
          await Promise.all([
            api.get(
              `/doctors/${id}`
            ),

            api.get(
              `/doctors/${id}/availability`
            ),
          ]);

        if (!active) return;

        setDoctor(
          doctorResponse.data
            .doctor
        );

        setAvailability(
          availabilityResponse.data
            .availability ?? []
        );
      } catch {
        if (!active) return;

        setMessageType(
          "error"
        );

        setMessage(
          "This doctor profile could not be loaded."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, [id]);

  const selectedAvailability =
    useMemo(
      () =>
        availability.find(
          (item) =>
            item.date === date
        ),
      [availability, date]
    );

  const availableSlots =
    selectedAvailability?.slots.filter(
      (item) =>
        !item.isBooked
    ) ?? [];

  async function bookAppointment() {
    if (!user) {
      navigate("/login");

      return;
    }

    if (
      user.role !== "patient"
    ) {
      setMessageType(
        "error"
      );

      setMessage(
        "Only patient accounts can book appointments."
      );

      return;
    }

    if (!date || !slot) {
      setMessageType(
        "error"
      );

      setMessage(
        "Choose an available date and time."
      );

      return;
    }

    if (
      reason.trim().length < 3
    ) {
      setMessageType(
        "error"
      );

      setMessage(
        "Please enter a reason for the appointment."
      );

      return;
    }

    try {
      setBooking(true);
      setMessage("");

      await api.post(
        "/appointments",
        {
          doctorId: id,
          date,
          startTime:
            slot.startTime,
          endTime:
            slot.endTime,
          reason:
            reason.trim(),
        }
      );

      const bookedSlot =
        slot;

      setAvailability(
        (current) =>
          current.map(
            (item) =>
              item.date !== date
                ? item
                : {
                    ...item,

                    slots:
                      item.slots.map(
                        (
                          currentSlot
                        ) =>
                          currentSlot.startTime ===
                            bookedSlot.startTime &&
                          currentSlot.endTime ===
                            bookedSlot.endTime
                            ? {
                                ...currentSlot,
                                isBooked:
                                  true,
                              }
                            : currentSlot
                      ),
                  }
          )
      );

      setSlot(null);

      setMessageType(
        "success"
      );

      setMessage(
        "Appointment request sent successfully."
      );
    } catch (error: any) {
      setMessageType(
        "error"
      );

      setMessage(
        error.response?.data
          ?.message ||
          "Booking failed. Please try again."
      );
    } finally {
      setBooking(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-5 py-20 text-[#647583] lg:px-8">
        Loading doctor profile...
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <h1 className="font-display text-3xl font-bold text-navy">
          Doctor not found
        </h1>
      </div>
    );
  }

  const registrationInfo =
    doctor.registrationInfo &&
    !doctor.registrationInfo
      .toLowerCase()
      .includes("demo")
      ? doctor.registrationInfo
      : "";

  return (
    <main>
      <section className="border-b border-[#E2EBEF] bg-[#F5FAFB]">
        <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
          <p className="text-sm text-[#647583]">
            Doctors /{" "}
            {
              doctor.speciality
            }
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_410px]">
          <div>
            <div className="grid gap-7 sm:grid-cols-[220px_1fr]">
              <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-[#F5FAFB]">
                <DoctorPhoto
                  doctor={
                    doctor
                  }
                />
              </div>

              <div>
                {doctor.isVerified && (
                  <p className="flex items-center gap-2 text-sm font-semibold text-teal">
                    <BadgeCheck className="h-4 w-4" />

                    Verified provider
                  </p>
                )}

                <h1 className="mt-3 font-display text-4xl font-extrabold text-navy md:text-5xl">
                  {
                    doctor.userId
                      .name
                  }
                </h1>

                <p className="mt-3 text-lg font-semibold text-teal">
                  {
                    doctor.speciality
                  }
                </p>

                <div className="mt-6 space-y-3 text-sm text-[#647583]">
                  {doctor.facility && (
                    <p className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-teal" />

                      {
                        doctor.facility
                      }
                    </p>
                  )}

                  {doctor.location && (
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-teal" />

                      {
                        doctor.location
                      }
                    </p>
                  )}

                  {!!doctor
                    .languages
                    ?.length && (
                    <p className="flex items-center gap-2">
                      <Languages className="h-4 w-4 text-teal" />

                      {doctor.languages.join(
                        " · "
                      )}
                    </p>
                  )}
                </div>

                {!!doctor
                  .qualifications
                  ?.length && (
                  <div className="mt-6 flex flex-wrap gap-2">
                    {doctor.qualifications.map(
                      (
                        qualification
                      ) => (
                        <span
                          key={
                            qualification
                          }
                          className="rounded-full border border-[#E2EBEF] px-3 py-1.5 text-xs font-medium text-navy"
                        >
                          {
                            qualification
                          }
                        </span>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>

            <section className="mt-12 border-t border-[#E2EBEF] pt-9">
              <h2 className="font-display text-2xl font-bold text-navy">
                About
              </h2>

              <p className="mt-4 max-w-3xl leading-8 text-[#647583]">
                {doctor.biography ||
                  "Professional biography has not been added yet."}
              </p>
            </section>

            <section className="mt-10 border-t border-[#E2EBEF] pt-9">
              <div className="grid gap-10 md:grid-cols-2">
                <div>
                  <h2 className="font-display text-xl font-bold text-navy">
                    Professional information
                  </h2>

                  <dl className="mt-5 space-y-5">
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-[#8A99A5]">
                        Experience
                      </dt>

                      <dd className="mt-1 font-medium text-navy">
                        {doctor.yearsOfExperience ??
                          0}{" "}
                        years
                      </dd>
                    </div>

                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-[#8A99A5]">
                        Consultation type
                      </dt>

                      <dd className="mt-1 font-medium text-navy">
                        {doctor.consultationTypes?.join(
                          ", "
                        ) ||
                          "In-person"}
                      </dd>
                    </div>

                    {registrationInfo && (
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-[#8A99A5]">
                          Registration information
                        </dt>

                        <dd className="mt-1 font-medium text-navy">
                          {
                            registrationInfo
                          }
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div>
                  <h2 className="font-display text-xl font-bold text-navy">
                    Areas of care
                  </h2>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {doctor
                      .areasOfCare
                      ?.length ? (
                      doctor.areasOfCare.map(
                        (
                          area
                        ) => (
                          <span
                            key={
                              area
                            }
                            className="rounded-full bg-[#F5FAFB] px-3 py-2 text-sm text-navy"
                          >
                            {
                              area
                            }
                          </span>
                        )
                      )
                    ) : (
                      <p className="text-sm text-[#647583]">
                        Areas of care have not been added.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-10 rounded-2xl border border-[#DCECEF] bg-[#F5FAFB] p-6">
              <div className="flex gap-4">
                <ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-teal" />

                <div>
                  <h3 className="font-display text-lg font-bold text-navy">
                    Controlled access to health information
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-[#647583]">
                    Booking an appointment does not automatically give every healthcare provider access to your complete medical history. Access should follow the application's authorisation rules.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <aside className="h-fit rounded-2xl border border-[#D9E5E9] bg-white p-6 shadow-sm lg:sticky lg:top-24">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#EAF8FA]">
                <CalendarDays className="h-5 w-5 text-teal" />
              </div>

              <div>
                <h2 className="font-display text-xl font-bold text-navy">
                  Book an appointment
                </h2>

                <p className="mt-1 text-xs text-[#647583]">
                  Choose an available time.
                </p>
              </div>
            </div>

            <div className="mt-7">
              <p className="text-sm font-semibold text-navy">
                Available date
              </p>

              <DateDropdown
                value={date}
                availability={
                  availability
                }
                onChange={(
                  selectedDate
                ) => {
                  setDate(
                    selectedDate
                  );

                  setSlot(null);

                  setMessage("");
                }}
              />
            </div>

            {date && (
              <div className="mt-6">
                <p className="flex items-center gap-2 text-sm font-semibold text-navy">
                  <Clock3 className="h-4 w-4 text-teal" />

                  Available times
                </p>

                {availableSlots.length ? (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {availableSlots.map(
                      (
                        availableSlot
                      ) => (
                        <button
                          type="button"
                          key={`${availableSlot.startTime}-${availableSlot.endTime}`}
                          onClick={() => {
                            setSlot(
                              availableSlot
                            );

                            setMessage(
                              ""
                            );
                          }}
                          className={`rounded-xl border px-3 py-3 text-sm font-medium transition ${
                            slot?.startTime ===
                            availableSlot.startTime
                              ? "border-teal bg-[#EAF8FA] text-teal"
                              : "border-[#DCE5E8] bg-white text-navy hover:border-teal hover:bg-[#F5FAFB]"
                          }`}
                        >
                          {
                            availableSlot.startTime
                          }
                        </button>
                      )
                    )}
                  </div>
                ) : (
                  <p className="mt-3 rounded-xl bg-[#F5FAFB] p-4 text-sm text-[#647583]">
                    No remaining appointment times for this date.
                  </p>
                )}
              </div>
            )}

            <label className="mt-6 block text-sm font-semibold text-navy">
              Reason for visit

              <textarea
                className="field mt-2 min-h-28 resize-none"
                value={reason}
                onChange={(
                  event
                ) =>
                  setReason(
                    event.target
                      .value
                  )
                }
              />
            </label>

            {message && (
              <div
                className={`mt-5 rounded-xl border p-4 text-sm ${
                  messageType ===
                  "success"
                    ? "border-[#BFE6DD] bg-[#F0FBF8] text-[#176B58]"
                    : "border-red-100 bg-red-50 text-red-700"
                }`}
              >
                {message}
              </div>
            )}

            <button
              type="button"
              onClick={
                bookAppointment
              }
              disabled={
                booking
              }
              className="btn-primary mt-6 w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              {booking
                ? "Booking..."
                : "Confirm booking"}
            </button>
          </aside>
        </div>
      </section>
    </main>
  );
}