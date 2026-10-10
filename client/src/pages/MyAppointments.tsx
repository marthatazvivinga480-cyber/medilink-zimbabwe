import ListSearch from "../components/ui/ListSearch";
import AppointmentPayment from "../components/AppointmentPayment";
import LoadingState from "../components/ui/LoadingState";
import { statusClasses as sharedStatusClasses } from "../components/ui/status";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { Link } from "react-router-dom";

import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  Stethoscope,
  XCircle,
} from "lucide-react";

import { api } from "../services/api";
import type { Appointment } from "../types";

type AppointmentFilter =
  | "all"
  | "upcoming"
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "rescheduled"
  | "no-show";

type DisplayStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "rescheduled"
  | "no-show"
  | "awaiting-update"
  | string;

type AvailabilitySlot = {
  startTime: string;
  endTime: string;
  isBooked?: boolean;
};

type DoctorAvailability = {
  _id: string;
  date: string;
  slots: AvailabilitySlot[];
};

const filters: {
  label: string;
  value: AppointmentFilter;
}[] = [
  {
    label: "All",
    value: "all",
  },
  {
    label: "Upcoming",
    value: "upcoming",
  },
  {
    label: "Pending",
    value: "pending",
  },
  {
    label: "Confirmed",
    value: "confirmed",
  },
  {
    label: "Rescheduled",
    value: "rescheduled",
  },
  {
    label: "Completed",
    value: "completed",
  },
  {
    label: "Cancelled",
    value: "cancelled",
  },
  {
    label: "No-show",
    value: "no-show",
  },
];

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
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

function getAppointmentDateTime(
  appointment: Appointment
) {
  const dateTime =
    new Date(
      `${appointment.date}T${appointment.startTime}:00`
    );

  if (
    Number.isNaN(
      dateTime.getTime()
    )
  ) {
    return null;
  }

  return dateTime;
}

function getSlotDateTime(
  date: string,
  startTime: string
) {
  const dateTime =
    new Date(
      `${date}T${startTime}:00`
    );

  if (
    Number.isNaN(
      dateTime.getTime()
    )
  ) {
    return null;
  }

  return dateTime;
}

function isAppointmentPast(
  appointment: Appointment
) {
  const appointmentDateTime =
    getAppointmentDateTime(
      appointment
    );

  if (!appointmentDateTime) {
    return false;
  }

  return (
    appointmentDateTime.getTime() <=
    Date.now()
  );
}

function isUpcomingAppointment(
  appointment: Appointment
) {
  if (
    appointment.status ===
      "completed" ||
    appointment.status ===
      "cancelled" ||
    appointment.status ===
      "no-show"
  ) {
    return false;
  }

  const appointmentDateTime =
    getAppointmentDateTime(
      appointment
    );

  if (!appointmentDateTime) {
    return false;
  }

  return (
    appointmentDateTime.getTime() >
    Date.now()
  );
}

function getDisplayStatus(
  appointment: Appointment
): DisplayStatus {
  const status =
    appointment.status.toLowerCase();

  if (
    status === "completed" ||
    status === "cancelled" ||
    status === "no-show"
  ) {
    return status;
  }

  if (
    isAppointmentPast(
      appointment
    ) &&
    (
      status === "pending" ||
      status === "confirmed" ||
      status === "rescheduled"
    )
  ) {
    return "awaiting-update";
  }

  return status;
}

function getStatusLabel(
  status: DisplayStatus
) {
  if (
    status === "awaiting-update"
  ) {
    return "Awaiting update";
  }

  if (
    status === "no-show"
  ) {
    return "No-show";
  }

  return (
    status.charAt(0).toUpperCase() +
    status.slice(1)
  );
}

const statusClasses = sharedStatusClasses;

function canCancelAppointment(
  appointment: Appointment
) {
  const cancellableStatuses = [
    "pending",
    "confirmed",
    "rescheduled",
  ];

  return (
    cancellableStatuses.includes(
      appointment.status
    ) &&
    isUpcomingAppointment(
      appointment
    )
  );
}

function canRescheduleAppointment(
  appointment: Appointment
) {
  const reschedulableStatuses = [
    "pending",
    "confirmed",
    "rescheduled",
  ];

  return (
    reschedulableStatuses.includes(
      appointment.status
    ) &&
    isUpcomingAppointment(
      appointment
    )
  );
}

function getDoctorId(
  appointment: Appointment
) {
  const doctor =
    appointment.doctorId;

  if (
    typeof doctor === "string"
  ) {
    return doctor;
  }

  return doctor?._id ?? "";
}

export default function MyAppointments() {
  const [search, setSearch] = useState("");
  const [
    appointments,
    setAppointments,
  ] =
    useState<
      Appointment[]
    >([]);

  const [
    selectedFilter,
    setSelectedFilter,
  ] =
    useState<AppointmentFilter>(
      "all"
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    cancellingId,
    setCancellingId,
  ] =
    useState<
      string | null
    >(null);

  const [
    reschedulingAppointment,
    setReschedulingAppointment,
  ] =
    useState<
      Appointment | null
    >(null);

  const [
    rescheduleAvailability,
    setRescheduleAvailability,
  ] =
    useState<
      DoctorAvailability[]
    >([]);

  const [
    rescheduleDate,
    setRescheduleDate,
  ] =
    useState("");

  const [
    rescheduleSlot,
    setRescheduleSlot,
  ] =
    useState<
      AvailabilitySlot | null
    >(null);

  const [
    loadingAvailability,
    setLoadingAvailability,
  ] =
    useState(false);

  const [
    reschedulingId,
    setReschedulingId,
  ] =
    useState<
      string | null
    >(null);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState("");

  useEffect(() => {
    let mounted = true;

    async function loadAppointments() {
      try {
        setLoading(true);
        setError("");

        const { data } =
          await api.get(
            "/appointments/mine"
          );

        if (!mounted) {
          return;
        }

        setAppointments(
          data.appointments ??
            []
        );
      } catch (
        error: any
      ) {
        if (!mounted) {
          return;
        }

        setError(
          error.response
            ?.data
            ?.message ||
            "Could not load your appointments."
        );
      } finally {
        if (mounted) {
          setLoading(
            false
          );
        }
      }
    }

    void loadAppointments();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredAppointments =
    useMemo(() => {
      const filtered =
        appointments.filter(
          (
            appointment
          ) => {
            if (search.trim() && ![appointment.doctorId?.userId?.name, appointment.date, appointment.reason, appointment.status].join(" ").toLowerCase().includes(search.trim().toLowerCase())) return false;
            if (
              selectedFilter ===
              "all"
            ) {
              return true;
            }

            if (
              selectedFilter ===
              "upcoming"
            ) {
              return isUpcomingAppointment(
                appointment
              );
            }

            return (
              appointment.status ===
              selectedFilter
            );
          }
        );

      return [...filtered].sort(
        (a, b) => {
          const first =
            getAppointmentDateTime(
              a
            )?.getTime() ?? 0;

          const second =
            getAppointmentDateTime(
              b
            )?.getTime() ?? 0;

          if (
            selectedFilter ===
              "completed" ||
            selectedFilter ===
              "cancelled" ||
            selectedFilter ===
              "no-show"
          ) {
            return (
              second - first
            );
          }

          return (
            first - second
          );
        }
      );
    }, [
      appointments,
      selectedFilter,
      search,
    ]);

  const upcomingCount =
    appointments.filter(
      isUpcomingAppointment
    ).length;

  const completedCount =
    appointments.filter(
      (appointment) =>
        appointment.status ===
        "completed"
    ).length;

  const cancelledCount =
    appointments.filter(
      (appointment) =>
        appointment.status ===
        "cancelled"
    ).length;

  const selectedAvailability =
    useMemo(() => {
      return (
        rescheduleAvailability.find(
          (item) =>
            item.date ===
            rescheduleDate
        ) ?? null
      );
    }, [
      rescheduleAvailability,
      rescheduleDate,
    ]);

  const availableRescheduleSlots =
    useMemo(() => {
      if (
        !selectedAvailability
      ) {
        return [];
      }

      return selectedAvailability
        .slots
        .filter(
          (slot) =>
            !slot.isBooked
        )
        .filter(
          (slot) => {
            const slotDateTime =
              getSlotDateTime(
                selectedAvailability.date,
                slot.startTime
              );

            if (!slotDateTime) {
              return false;
            }

            return (
              slotDateTime.getTime() >
              Date.now()
            );
          }
        );
    }, [
      selectedAvailability,
    ]);

  async function cancelAppointment(
    appointment: Appointment
  ) {
    const confirmed =
      window.confirm(
        "Are you sure you want to cancel this appointment? The appointment slot will become available again."
      );

    if (!confirmed) {
      return;
    }

    try {
      setCancellingId(
        appointment._id
      );

      setError("");
      setSuccessMessage("");

      await api.patch(
        `/appointments/${appointment._id}/status`,
        {
          status:
            "cancelled",
        }
      );

      setAppointments(
        (current) =>
          current.map(
            (item) =>
              item._id ===
              appointment._id
                ? {
                    ...item,
                    status:
                      "cancelled",
                  }
                : item
          )
      );

      if (
        reschedulingAppointment?._id ===
        appointment._id
      ) {
        closeReschedule();
      }

      setSuccessMessage(
        "Appointment cancelled successfully."
      );
    } catch (
      error: any
    ) {
      setError(
        error.response
          ?.data
          ?.message ||
          "Could not cancel the appointment."
      );
    } finally {
      setCancellingId(
        null
      );
    }
  }

  async function openReschedule(
    appointment: Appointment
  ) {
    const doctorId =
      getDoctorId(
        appointment
      );

    if (!doctorId) {
      setError(
        "Doctor information is missing from this appointment."
      );

      return;
    }

    try {
      setError("");
      setSuccessMessage("");

      setReschedulingAppointment(
        appointment
      );

      setRescheduleDate("");
      setRescheduleSlot(
        null
      );

      setLoadingAvailability(
        true
      );

      const response =
        await api.get(
          `/doctors/${doctorId}/availability`
        );

      setRescheduleAvailability(
        response.data
          .availability ??
          []
      );
    } catch (
      error: any
    ) {
      setRescheduleAvailability(
        []
      );

      setError(
        error.response
          ?.data
          ?.message ||
          "Available appointment times could not be loaded."
      );
    } finally {
      setLoadingAvailability(
        false
      );
    }
  }

  function closeReschedule() {
    setReschedulingAppointment(
      null
    );

    setRescheduleAvailability(
      []
    );

    setRescheduleDate("");

    setRescheduleSlot(
      null
    );

    setLoadingAvailability(
      false
    );
  }

  async function submitReschedule() {
    if (
      !reschedulingAppointment
    ) {
      return;
    }

    if (
      !rescheduleDate ||
      !rescheduleSlot
    ) {
      setError(
        "Choose a new available date and time."
      );

      return;
    }

    try {
      setReschedulingId(
        reschedulingAppointment._id
      );

      setError("");
      setSuccessMessage("");

      const response =
        await api.patch(
          `/appointments/${reschedulingAppointment._id}/reschedule`,
          {
            date:
              rescheduleDate,

            startTime:
              rescheduleSlot.startTime,

            endTime:
              rescheduleSlot.endTime,
          }
        );

      const updatedAppointment =
        response.data
          .appointment;

      setAppointments(
        (current) =>
          current.map(
            (appointment) =>
              appointment._id ===
              reschedulingAppointment._id
                ? {
                    ...appointment,
                    ...updatedAppointment,
                    status:
                      "rescheduled",
                  }
                : appointment
          )
      );

      setSuccessMessage(
        "Appointment rescheduled successfully."
      );

      closeReschedule();
    } catch (
      error: any
    ) {
      setError(
        error.response
          ?.data
          ?.message ||
          "Could not reschedule the appointment."
      );
    } finally {
      setReschedulingId(
        null
      );
    }
  }

  return (
    <main className="min-h-screen bg-[#F5FAFB]">
      <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <div className="flex flex-col justify-between gap-5 border-b border-[#DDE8EA] pb-8 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-teal">
              Patient appointments
            </p>

            <h1 className="mt-2 font-display text-3xl font-extrabold text-navy md:text-4xl">
              My appointments
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#647583]">
              Review your upcoming
              consultations,
              appointment history
              and current booking
              status.
            </p>
          </div>

          <Link
            to="/doctors"
            className="btn-primary shrink-0"
          >
            Book appointment
          </Link>
        </div>

        {successMessage && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2
              size={18}
              className="mt-0.5 shrink-0"
            />

            <p>
              {
                successMessage
              }
            </p>
          </div>
        )}

        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0"
            />

            <p>
              {error}
            </p>
          </div>
        )}

        <div className="mt-7 grid gap-4 sm:grid-cols-3">
          <div className="card p-5">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#EAF8FA]">
              <CalendarDays className="h-5 w-5 text-teal" />
            </div>

            <p className="mt-4 text-sm text-[#647583]">
              Upcoming
            </p>

            <p className="mt-1 font-display text-2xl font-bold text-navy">
              {
                upcomingCount
              }
            </p>
          </div>

          <div className="card p-5">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-sky-50">
              <CheckCircle2 className="h-5 w-5 text-sky-700" />
            </div>

            <p className="mt-4 text-sm text-[#647583]">
              Completed
            </p>

            <p className="mt-1 font-display text-2xl font-bold text-navy">
              {
                completedCount
              }
            </p>
          </div>

          <div className="card p-5">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-red-50">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>

            <p className="mt-4 text-sm text-[#647583]">
              Cancelled
            </p>

            <p className="mt-1 font-display text-2xl font-bold text-navy">
              {
                cancelledCount
              }
            </p>
          </div>
        </div>

        <div className="mt-8 overflow-x-auto">
          <div className="flex min-w-max gap-2 rounded-2xl border border-[#E2EBEF] bg-white p-2">
            {filters.map(
              (filter) => {
                const active =
                  selectedFilter ===
                  filter.value;

                return (
                  <button
                    type="button"
                    key={
                      filter.value
                    }
                    onClick={() =>
                      setSelectedFilter(
                        filter.value
                      )
                    }
                    className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                      active
                        ? "bg-[#EAF8FA] text-teal"
                        : "text-[#647583] hover:bg-[#F5FAFB] hover:text-navy"
                    }`}
                  >
                    {
                      filter.label
                    }
                  </button>
                );
              }
            )}
          </div>
        </div>

        <ListSearch value={search} onChange={setSearch} label="Search appointments, doctors or dates" />
        {loading ? (
          <LoadingState label="Loading your appointments..." />
        ) : (
          <div className="mt-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <p className="text-sm text-[#647583]">
                Showing{" "}
                <span className="font-semibold text-navy">
                  {
                    filteredAppointments.length
                  }
                </span>{" "}
                {filteredAppointments.length ===
                1
                  ? "appointment"
                  : "appointments"}
              </p>
            </div>

            {filteredAppointments.length >
            0 ? (
              <div className="grid gap-4">
                {filteredAppointments.map(
                  (
                    appointment
                  ) => {
                    const doctor =
                      appointment.doctorId;

                    const displayStatus =
                      getDisplayStatus(
                        appointment
                      );

                    const rescheduleOpen =
                      reschedulingAppointment
                        ?._id ===
                      appointment._id;

                    return (
                      <article
                        key={
                          appointment._id
                        }
                        className="card overflow-hidden"
                      >
                        <div className="p-5 md:p-6">
                          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
                            <div className="min-w-0">
                              <div className="flex items-start gap-4">
                                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#EAF8FA]">
                                  <Stethoscope className="h-5 w-5 text-teal" />
                                </div>

                                <div className="min-w-0">
                                  <p className="font-display text-lg font-bold text-navy">
                                    {typeof doctor ===
                                    "string"
                                      ? "Doctor"
                                      : doctor
                                          ?.userId
                                          ?.name ||
                                        "Doctor"}
                                  </p>

                                  {typeof doctor !==
                                    "string" &&
                                    doctor
                                      ?.speciality && (
                                      <p className="mt-1 text-sm font-medium text-teal">
                                        {
                                          doctor.speciality
                                        }
                                      </p>
                                    )}

                                  {typeof doctor !==
                                    "string" &&
                                    doctor
                                      ?.facility && (
                                      <p className="mt-2 flex items-center gap-1.5 text-sm text-[#647583]">
                                        <MapPin
                                          size={
                                            15
                                          }
                                        />

                                        {
                                          doctor.facility
                                        }
                                      </p>
                                    )}
                                </div>
                              </div>

                              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                <div className="rounded-xl bg-[#F5FAFB] p-4">
                                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#8A99A5]">
                                    <CalendarDays
                                      size={
                                        14
                                      }
                                    />

                                    Date
                                  </p>

                                  <p className="mt-2 text-sm font-semibold text-navy">
                                    {formatAppointmentDate(
                                      appointment.date
                                    )}
                                  </p>
                                </div>

                                <div className="rounded-xl bg-[#F5FAFB] p-4">
                                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#8A99A5]">
                                    <Clock3
                                      size={
                                        14
                                      }
                                    />

                                    Time
                                  </p>

                                  <p className="mt-2 text-sm font-semibold text-navy">
                                    {
                                      appointment.startTime
                                    }
                                    {" – "}
                                    {
                                      appointment.endTime
                                    }
                                  </p>
                                </div>
                              </div>

                              <div className="mt-5">
                                <p className="text-xs font-semibold uppercase tracking-wide text-[#8A99A5]">
                                  Reason for visit
                                </p>

                                <p className="mt-2 text-sm leading-6 text-[#43515C]">
                                  {
                                    appointment.reason
                                  }
                                </p>
                              </div>
                            </div>

                            <div className="flex shrink-0 flex-col items-start gap-3 md:items-end">
                              <span
                                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${statusClasses(
                                  displayStatus
                                )}`}
                              >
                                {getStatusLabel(
                                  displayStatus
                                )}
                              </span>

                              {canRescheduleAppointment(
                                appointment
                              ) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (
                                      rescheduleOpen
                                    ) {
                                      closeReschedule();
                                    } else {
                                      void openReschedule(
                                        appointment
                                      );
                                    }
                                  }}
                                  className="rounded-lg border border-[#B9E3E7] bg-white px-4 py-2 text-sm font-semibold text-teal transition hover:bg-[#EAF8FA]"
                                >
                                  {rescheduleOpen
                                    ? "Close reschedule"
                                    : "Reschedule"}
                                </button>
                              )}

                              {canCancelAppointment(
                                appointment
                              ) && (
                                <button
                                  type="button"
                                  disabled={
                                    cancellingId ===
                                    appointment._id
                                  }
                                  onClick={() =>
                                    cancelAppointment(
                                      appointment
                                    )
                                  }
                                  className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {cancellingId ===
                                  appointment._id
                                    ? "Cancelling..."
                                    : "Cancel appointment"}
                                </button>
                              )}

                              {typeof doctor !==
                                "string" &&
                                doctor?._id && (
                                  <Link
                                    to={`/doctors/${doctor._id}`}
                                    className="text-sm font-semibold text-teal transition hover:text-navy"
                                  >
                                    View doctor
                                  </Link>
                                )}
                            </div>
                          </div>
                        </div>

                        {rescheduleOpen && (
                          <div className="border-t border-[#E2EBEF] bg-[#FBFDFD] p-5 md:p-6">
                            <div className="max-w-3xl">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-teal">
                                  Change appointment
                                </p>

                                <h3 className="mt-1 font-display text-lg font-bold text-navy">
                                  Choose a new date and time
                                </h3>

                                <p className="mt-2 text-sm leading-6 text-[#647583]">
                                  Only currently available appointment slots for this doctor are shown.
                                </p>
                              </div>

                              {loadingAvailability ? (
                                <div className="mt-5 rounded-xl border border-[#E2EBEF] bg-white p-4 text-sm text-[#647583]">
                                  Loading available times...
                                </div>
                              ) : rescheduleAvailability.length ===
                                0 ? (
                                <div className="mt-5 rounded-xl border border-[#E2EBEF] bg-white p-4 text-sm text-[#647583]">
                                  This doctor does not currently have another available appointment date.
                                </div>
                              ) : (
                                <>
                                  <div className="mt-5">
                                    <p className="text-sm font-semibold text-navy">
                                      Available date
                                    </p>

                                    <div className="mt-3 flex flex-wrap gap-2">
                                      {rescheduleAvailability
                                        .filter(
                                          (
                                            item
                                          ) =>
                                            item.slots.some(
                                              (
                                                slot
                                              ) => {
                                                if (
                                                  slot.isBooked
                                                ) {
                                                  return false;
                                                }

                                                const slotDateTime =
                                                  getSlotDateTime(
                                                    item.date,
                                                    slot.startTime
                                                  );

                                                return Boolean(
                                                  slotDateTime &&
                                                    slotDateTime.getTime() >
                                                      Date.now()
                                                );
                                              }
                                            )
                                        )
                                        .map(
                                          (
                                            item
                                          ) => {
                                            const selected =
                                              rescheduleDate ===
                                              item.date;

                                            return (
                                              <button
                                                key={
                                                  item._id
                                                }
                                                type="button"
                                                onClick={() => {
                                                  setRescheduleDate(
                                                    item.date
                                                  );

                                                  setRescheduleSlot(
                                                    null
                                                  );

                                                  setError(
                                                    ""
                                                  );
                                                }}
                                                className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                                                  selected
                                                    ? "border-teal bg-[#EAF8FA] text-teal"
                                                    : "border-[#DCE8EB] bg-white text-navy hover:border-teal"
                                                }`}
                                              >
                                                {formatAppointmentDate(
                                                  item.date
                                                )}
                                              </button>
                                            );
                                          }
                                        )}
                                    </div>
                                  </div>

                                  {rescheduleDate && (
                                    <div className="mt-6">
                                      <p className="text-sm font-semibold text-navy">
                                        Available time
                                      </p>

                                      {availableRescheduleSlots.length >
                                      0 ? (
                                        <div className="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                                          {availableRescheduleSlots.map(
                                            (
                                              slot
                                            ) => {
                                              const selected =
                                                rescheduleSlot
                                                  ?.startTime ===
                                                  slot.startTime &&
                                                rescheduleSlot
                                                  ?.endTime ===
                                                  slot.endTime;

                                              return (
                                                <button
                                                  key={`${slot.startTime}-${slot.endTime}`}
                                                  type="button"
                                                  onClick={() => {
                                                    setRescheduleSlot(
                                                      slot
                                                    );

                                                    setError(
                                                      ""
                                                    );
                                                  }}
                                                  className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                                                    selected
                                                      ? "border-teal bg-[#EAF8FA] text-teal"
                                                      : "border-[#DCE8EB] bg-white text-navy hover:border-teal"
                                                  }`}
                                                >
                                                  {
                                                    slot.startTime
                                                  }
                                                  {" – "}
                                                  {
                                                    slot.endTime
                                                  }
                                                </button>
                                              );
                                            }
                                          )}
                                        </div>
                                      ) : (
                                        <div className="mt-3 rounded-xl border border-[#E2EBEF] bg-white p-4 text-sm text-[#647583]">
                                          There are no available future times on this date.
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  <div className="mt-6 flex flex-wrap gap-3">
                                    <button
                                      type="button"
                                      disabled={
                                        !rescheduleDate ||
                                        !rescheduleSlot ||
                                        reschedulingId ===
                                          appointment._id
                                      }
                                      onClick={() =>
                                        void submitReschedule()
                                      }
                                      className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      {reschedulingId ===
                                      appointment._id
                                        ? "Rescheduling..."
                                        : "Confirm new time"}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={
                                        closeReschedule
                                      }
                                      disabled={
                                        reschedulingId ===
                                        appointment._id
                                      }
                                      className="btn-secondary"
                                    >
                                      Keep current appointment
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                        <AppointmentPayment appointment={appointment} />
                      </article>
                    );
                  }
                )}
              </div>
            ) : (
              <div className="card p-8 text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-[#EAF8FA]">
                  <CalendarDays className="h-5 w-5 text-teal" />
                </div>

                <h2 className="mt-4 font-display text-lg font-bold text-navy">
                  No appointments found
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#647583]">
                  There are no
                  appointments matching
                  this filter.
                </p>

                <Link
                  to="/doctors"
                  className="btn-primary mt-5"
                >
                  Find a doctor
                </Link>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}