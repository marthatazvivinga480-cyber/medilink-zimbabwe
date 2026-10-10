import OptimizedImage from "../components/OptimizedImage";
import LoadingState from "../components/ui/LoadingState";
import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  FileText,
  Pill,
  Plus,
  ShieldCheck,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

import { api } from "../services/api";
import type { Appointment } from "../types";
import { useAuth } from "../context/AuthContext";

type ConsultationForm = {
  diagnosis: string;
  diagnosisExplanation: string;
  symptoms: string;
  observations: string;
  treatment: string;
  followUp: string;
};

type MedicineForm = {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
};

type ClinicalProfile = {
  bloodGroup: string;
  allergies: string;
  existingConditions: string;
};

type AppointmentFilter =
  | "all"
  | "pending"
  | "confirmed"
  | "rescheduled"
  | "completed"
  | "cancelled"
  | "no-show";

type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "rescheduled"
  | "completed"
  | "cancelled"
  | "no-show";

type DashboardView =
  | "appointments"
  | "availability"
  | "profile";

type DoctorProfile = {
  _id: string;
  speciality?: string;
  qualifications?: string[];
  biography?: string;
  location?: string;
  facility?: string;
  languages?: string[];
  yearsOfExperience?: number;
  areasOfCare?: string[];
  consultationTypes?: string[];
  photoUrl?: string;

  userId?: {
    _id?: string;
    name?: string;
    email?: string;
    phone?: string;
  };
};

type DoctorProfileForm = {
  name: string;
  phone: string;
  speciality: string;
  qualifications: string;
  biography: string;
  location: string;
  facility: string;
  languages: string;
  yearsOfExperience: string;
  areasOfCare: string;
  consultationTypes: string;
  photoUrl: string;
};

type AvailabilitySlot = {
  startTime: string;
  endTime: string;
  isBooked?: boolean;
};

type AvailabilityDay = {
  _id: string;
  date: string;
  slots: AvailabilitySlot[];
};

const emptyConsultation: ConsultationForm = {
  diagnosis: "",
  diagnosisExplanation: "",
  symptoms: "",
  observations: "",
  treatment: "",
  followUp: "",
};

const emptyClinicalProfile: ClinicalProfile = {
  bloodGroup: "",
  allergies: "",
  existingConditions: "",
};

const emptyDoctorProfileForm: DoctorProfileForm = {
  name: "",
  phone: "",
  speciality: "",
  qualifications: "",
  biography: "",
  location: "",
  facility: "",
  languages: "",
  yearsOfExperience: "0",
  areasOfCare: "",
  consultationTypes: "In-person",
  photoUrl: "",
};

function emptyMedicine(): MedicineForm {
  return {
    name: "",
    dosage: "",
    frequency: "",
    duration: "",
  };
}

function profileFormFromDoctor(
  doctor: DoctorProfile
): DoctorProfileForm {
  return {
    name:
      doctor.userId?.name ?? "",

    phone:
      doctor.userId?.phone ?? "",

    speciality:
      doctor.speciality ?? "",

    qualifications:
      (
        doctor.qualifications ??
        []
      ).join(", "),

    biography:
      doctor.biography ?? "",

    location:
      doctor.location ?? "",

    facility:
      doctor.facility ?? "",

    languages:
      (
        doctor.languages ??
        []
      ).join(", "),

    yearsOfExperience:
      String(
        doctor.yearsOfExperience ??
        0
      ),

    areasOfCare:
      (
        doctor.areasOfCare ??
        []
      ).join(", "),

    consultationTypes:
      (
        doctor.consultationTypes ??
        ["In-person"]
      ).join(", "),

    photoUrl:
      doctor.photoUrl ?? "",
  };
}

function splitList(
  value: string
) {
  return value
    .split(",")
    .map((item) =>
      item.trim()
    )
    .filter(Boolean);
}

function getToday() {
  const now =
    new Date();

  const year =
    now.getFullYear();

  const month =
    String(
      now.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      now.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}-${day}`;
}

function timeToMinutes(
  time: string
) {
  const [
    hours,
    minutes,
  ] = time
    .split(":")
    .map(Number);

  return (
    hours * 60 +
    minutes
  );
}

function minutesToTime(
  totalMinutes: number
) {
  const hours =
    Math.floor(
      totalMinutes /
      60
    );

  const minutes =
    totalMinutes %
    60;

  return `${String(
    hours
  ).padStart(
    2,
    "0"
  )}:${String(
    minutes
  ).padStart(
    2,
    "0"
  )}`;
}

function hasAppointmentStarted(
  date: string,
  startTime: string
) {
  const appointmentDateTime =
    new Date(
      `${date}T${startTime}:00`
    );

  if (
    Number.isNaN(
      appointmentDateTime.getTime()
    )
  ) {
    return false;
  }

  return (
    appointmentDateTime.getTime() <=
    Date.now()
  );
}

function formatAvailabilityDate(
  date: string
) {
  return new Date(
    `${date}T00:00:00`
  ).toLocaleDateString(
    undefined,
    {
      weekday:
        "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );
}

export default function DoctorDashboard() {
  const {
    user,
  } = useAuth();

  const [
    appointments,
    setAppointments,
  ] =
    useState<
      Appointment[]
    >([]);

  const [
    selected,
    setSelected,
  ] =
    useState<
      Appointment | null
    >(null);

  const [
    doctorProfile,
    setDoctorProfile,
  ] =
    useState<
      DoctorProfile | null
    >(null);

  const [
    dashboardView,
    setDashboardView,
  ] =
    useState<DashboardView>(
      "appointments"
    );

  const [
    filter,
    setFilter,
  ] =
    useState<AppointmentFilter>(
      "all"
    );

  const [
    form,
    setForm,
  ] =
    useState<ConsultationForm>({
      ...emptyConsultation,
    });

  const [
    clinicalProfile,
    setClinicalProfile,
  ] =
    useState<ClinicalProfile>({
      ...emptyClinicalProfile,
    });

  const [
    clinicalLoading,
    setClinicalLoading,
  ] =
    useState(false);

  const [
    clinicalSaving,
    setClinicalSaving,
  ] =
    useState(false);

  const [
    clinicalMessage,
    setClinicalMessage,
  ] =
    useState("");

  const [
    clinicalError,
    setClinicalError,
  ] =
    useState("");

  const [
    issuePrescription,
    setIssuePrescription,
  ] =
    useState(false);

  const [
    medicines,
    setMedicines,
  ] =
    useState<
      MedicineForm[]
    >([
      emptyMedicine(),
    ]);

  const [
    instructions,
    setInstructions,
  ] =
    useState("");

  const [
    expiresAt,
    setExpiresAt,
  ] =
    useState("");

  const [
    prescriptionCount,
    setPrescriptionCount,
  ] =
    useState(0);

  const [
    generatedPrescriptionCode,
    setGeneratedPrescriptionCode,
  ] =
    useState("");

  const [
    message,
    setMessage,
  ] =
    useState("");

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    updatingAppointmentId,
    setUpdatingAppointmentId,
  ] =
    useState<
      string | null
    >(null);

  const [
    availability,
    setAvailability,
  ] =
    useState<
      AvailabilityDay[]
    >([]);

  const [
    availabilityLoading,
    setAvailabilityLoading,
  ] =
    useState(false);

  const [
    availabilitySaving,
    setAvailabilitySaving,
  ] =
    useState(false);

  const [
    deletingAvailabilityDate,
    setDeletingAvailabilityDate,
  ] =
    useState<
      string | null
    >(null);

  const [
    availabilityDate,
    setAvailabilityDate,
  ] =
    useState("");

  const [
    availabilityStartTime,
    setAvailabilityStartTime,
  ] =
    useState(
      "08:00"
    );

  const [
    availabilityEndTime,
    setAvailabilityEndTime,
  ] =
    useState(
      "16:00"
    );

  const [
    slotDuration,
    setSlotDuration,
  ] =
    useState(30);

  const [
    generatedSlots,
    setGeneratedSlots,
  ] =
    useState<
      AvailabilitySlot[]
    >([]);

  const [
    profileForm,
    setProfileForm,
  ] =
    useState<DoctorProfileForm>({
      ...emptyDoctorProfileForm,
    });

  const [
    profileSaving,
    setProfileSaving,
  ] =
    useState(false);

  useEffect(() => {
    void loadDashboard();
  }, [
    user?.id,
    user?.email,
  ]);

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const results =
        await Promise.allSettled(
          [
            api.get(
              "/appointments/mine"
            ),

            api.get(
              "/doctors"
            ),

            api.get(
              "/prescriptions/doctor"
            ),

            api.get(
              "/doctors/me/availability"
            ),
          ]
        );

      const appointmentsResult =
        results[0];

      const doctorsResult =
        results[1];

      const prescriptionsResult =
        results[2];

      const availabilityResult =
        results[3];

      if (
        appointmentsResult.status ===
        "fulfilled"
      ) {
        setAppointments(
          appointmentsResult
            .value
            .data
            .appointments ??
          []
        );
      } else {
        setAppointments(
          []
        );

        setError(
          "Appointments could not be loaded."
        );
      }

      if (
        doctorsResult.status ===
        "fulfilled"
      ) {
        const doctors:
          DoctorProfile[] =
          doctorsResult
            .value
            .data
            .doctors ??
          [];

        const currentDoctor =
          doctors.find(
            (
              doctor
            ) =>
              doctor
                .userId
                ?._id ===
              user?.id ||
              doctor
                .userId
                ?.email ===
              user?.email
          ) ?? null;

        setDoctorProfile(
          currentDoctor
        );

        if (
          currentDoctor
        ) {
          setProfileForm(
            profileFormFromDoctor(
              currentDoctor
            )
          );
        }
      }

      if (
        prescriptionsResult.status ===
        "fulfilled"
      ) {
        setPrescriptionCount(
          prescriptionsResult
            .value
            .data
            .prescriptions
            ?.length ??
          0
        );
      }

      if (
        availabilityResult.status ===
        "fulfilled"
      ) {
        setAvailability(
          availabilityResult
            .value
            .data
            .availability ??
          []
        );
      } else {
        setAvailability(
          []
        );
      }
    } catch {
      setError(
        "Dashboard information could not be loaded."
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  async function loadAvailability() {
    try {
      setAvailabilityLoading(
        true
      );

      const response =
        await api.get(
          "/doctors/me/availability"
        );

      setAvailability(
        response.data
          .availability ??
        []
      );
    } catch (
    error: any
    ) {
      setError(
        error.response
          ?.data
          ?.message ||
        "Availability could not be loaded."
      );
    } finally {
      setAvailabilityLoading(
        false
      );
    }
  }

  const summary =
    useMemo(() => {
      const today =
        getToday();

      return {
        today:
          appointments.filter(
            (
              appointment
            ) =>
              appointment.date ===
              today &&
              appointment.status !==
              "cancelled"
          ).length,

        pending:
          appointments.filter(
            (
              appointment
            ) =>
              appointment.status ===
              "pending"
          ).length,

        confirmed:
          appointments.filter(
            (
              appointment
            ) =>
              appointment.status ===
              "confirmed"
          ).length,

        completed:
          appointments.filter(
            (
              appointment
            ) =>
              appointment.status ===
              "completed"
          ).length,
      };
    }, [
      appointments,
    ]);

  const filteredAppointments = useMemo(() => {
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Harare", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    const priority = (a: Appointment) => a.date === today && !["completed", "cancelled", "no-show"].includes(a.status) ? 0 : a.status === "pending" ? 1 : ["confirmed", "rescheduled"].includes(a.status) ? 2 : 3;
    return appointments.filter(a => filter === "all" || a.status === filter).sort((a,b) => priority(a)-priority(b) || (a.date + a.startTime).localeCompare(b.date + b.startTime));
  }, [appointments, filter]);

  const displayName =
    doctorProfile
      ?.userId
      ?.name ||
    user?.name ||
    "Doctor";

  const initials =
    useMemo(() => {
      return displayName
        .split(" ")
        .filter(Boolean)
        .map(
          (part) =>
            part[0]
        )
        .join("")
        .slice(0, 2)
        .toUpperCase();
    }, [
      displayName,
    ]);

  function updateProfileField(
    field:
      keyof DoctorProfileForm,
    value: string
  ) {
    setProfileForm(
      (current) => ({
        ...current,
        [field]:
          value,
      })
    );
  }

  function resetProfileForm() {
    if (
      !doctorProfile
    ) {
      return;
    }

    setProfileForm(
      profileFormFromDoctor(
        doctorProfile
      )
    );

    setMessage("");
    setError("");
  }

  async function saveDoctorProfile() {
    const name =
      profileForm.name.trim();

    const speciality =
      profileForm.speciality.trim();

    if (!name) {
      setError(
        "Enter the doctor's name before saving the profile."
      );

      return;
    }

    if (
      !speciality
    ) {
      setError(
        "Enter a speciality before saving the profile."
      );

      return;
    }

    const yearsOfExperience =
      Number(
        profileForm
          .yearsOfExperience
      );

    if (
      !Number.isFinite(
        yearsOfExperience
      ) ||
      yearsOfExperience <
      0
    ) {
      setError(
        "Years of experience must be zero or greater."
      );

      return;
    }

    try {
      setProfileSaving(
        true
      );

      setMessage("");
      setError("");

      const response =
        await api.put(
          "/doctors/me",
          {
            name,

            phone:
              profileForm.phone.trim(),

            speciality,

            qualifications:
              splitList(
                profileForm.qualifications
              ),

            biography:
              profileForm.biography.trim(),

            location:
              profileForm.location.trim(),

            facility:
              profileForm.facility.trim(),

            languages:
              splitList(
                profileForm.languages
              ),

            yearsOfExperience,

            areasOfCare:
              splitList(
                profileForm.areasOfCare
              ),

            consultationTypes:
              splitList(
                profileForm.consultationTypes
              ),

            photoUrl:
              profileForm.photoUrl.trim(),
          }
        );

      const updatedUser =
        response.data
          .user ??
        {};

      const updatedDoctor =
        response.data
          .doctor ??
        {};

      const nextProfile:
        DoctorProfile = {
        ...(doctorProfile ?? {
          _id:
            updatedDoctor._id ??
            "",
        }),

        ...updatedDoctor,

        userId: {
          ...doctorProfile
            ?.userId,

          _id:
            updatedUser._id ??
            doctorProfile
              ?.userId
              ?._id,

          name:
            updatedUser.name ??
            name,

          email:
            updatedUser.email ??
            doctorProfile
              ?.userId
              ?.email,

          phone:
            updatedUser.phone ??
            profileForm.phone.trim(),
        },
      };

      setDoctorProfile(
        nextProfile
      );

      setProfileForm(
        profileFormFromDoctor(
          nextProfile
        )
      );

      setMessage(
        "Doctor profile updated successfully."
      );
    } catch (
    error: any
    ) {
      setError(
        error.response
          ?.data
          ?.message ||
        "The doctor profile could not be updated."
      );
    } finally {
      setProfileSaving(
        false
      );
    }
  }

  async function updateAppointmentStatus(
    appointment:
      Appointment,
    status:
      AppointmentStatus
  ) {
    try {
      setUpdatingAppointmentId(
        appointment._id
      );

      setMessage("");
      setError("");

      const response =
        await api.patch(
          `/appointments/${appointment._id}/status`,
          {
            status,
          }
        );

      const updatedAppointment =
        response.data
          .appointment;

      setAppointments(
        (current) =>
          current.map(
            (item) =>
              item._id ===
                appointment._id
                ? {
                  ...item,

                  status:
                    updatedAppointment.status,
                }
                : item
          )
      );

      if (
        selected?._id ===
        appointment._id
      ) {
        setSelected(
          null
        );
      }

      if (
        status ===
        "confirmed"
      ) {
        setMessage(
          "Appointment confirmed successfully."
        );
      }

      if (
        status ===
        "cancelled"
      ) {
        setMessage(
          "Appointment cancelled. The time slot is available again."
        );

        await loadAvailability();
      }

      if (
        status ===
        "no-show"
      ) {
        setMessage(
          "Appointment marked as no-show."
        );
      }
    } catch (
    error: any
    ) {
      setError(
        error.response
          ?.data
          ?.message ||
        "The appointment status could not be updated."
      );
    } finally {
      setUpdatingAppointmentId(
        null
      );
    }
  }

  async function selectAppointment(
    appointment: Appointment
  ) {
    const canOpenConsultation =
      appointment.status === "confirmed" ||
      (appointment.status === "rescheduled" &&
        hasAppointmentStarted(
          appointment.date,
          appointment.startTime
        ));

    if (!canOpenConsultation) {
      return;
    }

    setSelected(appointment);

    setForm({
      ...emptyConsultation,
    });

    setClinicalProfile({
      ...emptyClinicalProfile,
    });

    setIssuePrescription(false);

    setMedicines([
      emptyMedicine(),
    ]);

    setInstructions("");

    setExpiresAt("");

    setMessage("");
    setError("");

    setClinicalMessage("");
    setClinicalError("");

    setGeneratedPrescriptionCode("");

    const patientId =
      appointment.patientId?._id;

    if (!patientId) {
      setClinicalError(
        "Patient clinical information could not be loaded."
      );

      return;
    }

    try {
      setClinicalLoading(true);

      const response =
        await api.get(
          `/patients/${patientId}/clinical`
        );

      const clinical =
        response.data.clinicalProfile;

      setClinicalProfile({
        bloodGroup:
          clinical?.bloodGroup ?? "",

        allergies:
          Array.isArray(
            clinical?.allergies
          )
            ? clinical.allergies.join(
              ", "
            )
            : "",

        existingConditions:
          Array.isArray(
            clinical?.existingConditions
          )
            ? clinical.existingConditions.join(
              ", "
            )
            : "",
      });
    } catch (error: any) {
      setClinicalError(
        error.response?.data?.message ||
        "Patient clinical information could not be loaded."
      );
    } finally {
      setClinicalLoading(false);
    }
  }

  function updateClinicalField(
    field:
      keyof ClinicalProfile,
    value: string
  ) {
    setClinicalProfile(
      (current) => ({
        ...current,
        [field]:
          value,
      })
    );
  }

  async function saveClinicalProfile() {
    if (
      !selected
    ) {
      return;
    }

    const patientId =
      selected
        .patientId
        ?._id;

    if (
      !patientId
    ) {
      setClinicalError(
        "Patient information is missing from this appointment."
      );

      return;
    }

    try {
      setClinicalSaving(
        true
      );

      setClinicalMessage(
        ""
      );

      setClinicalError(
        ""
      );

      const allergies =
        splitList(
          clinicalProfile.allergies
        );

      const existingConditions =
        splitList(
          clinicalProfile.existingConditions
        );

      const response =
        await api.put(
          `/patients/${patientId}/clinical`,
          {
            bloodGroup:
              clinicalProfile.bloodGroup,

            allergies,

            existingConditions,
          }
        );

      const updated =
        response.data
          .clinicalProfile;

      setClinicalProfile({
        bloodGroup:
          updated?.bloodGroup ??
          "",

        allergies:
          Array.isArray(
            updated?.allergies
          )
            ? updated.allergies.join(
              ", "
            )
            : "",

        existingConditions:
          Array.isArray(
            updated?.existingConditions
          )
            ? updated.existingConditions.join(
              ", "
            )
            : "",
      });

      setClinicalMessage(
        "Clinical information saved successfully."
      );
    } catch (
    error: any
    ) {
      setClinicalError(
        error.response
          ?.data
          ?.message ||
        "Clinical information could not be saved."
      );
    } finally {
      setClinicalSaving(
        false
      );
    }
  }

  function updateConsultationField(
    field:
      keyof ConsultationForm,
    value: string
  ) {
    setForm(
      (current) => ({
        ...current,
        [field]:
          value,
      })
    );
  }

  function updateMedicine(
    index: number,
    field:
      keyof MedicineForm,
    value: string
  ) {
    setMedicines(
      (current) =>
        current.map(
          (
            medicine,
            medicineIndex
          ) =>
            medicineIndex ===
              index
              ? {
                ...medicine,
                [field]:
                  value,
              }
              : medicine
        )
    );
  }

  function addMedicine() {
    setMedicines(
      (current) => [
        ...current,
        emptyMedicine(),
      ]
    );
  }

  function removeMedicine(
    index: number
  ) {
    setMedicines(
      (current) => {
        if (
          current.length ===
          1
        ) {
          return [
            emptyMedicine(),
          ];
        }

        return current.filter(
          (
            _,
            medicineIndex
          ) =>
            medicineIndex !==
            index
        );
      }
    );
  }

  function generateSlots() {
    setMessage("");
    setError("");

    if (
      !availabilityDate
    ) {
      setError(
        "Choose a date before generating appointment slots."
      );

      return;
    }

    if (
      availabilityDate <
      getToday()
    ) {
      setError(
        "Availability cannot be created for a past date."
      );

      return;
    }

    const startMinutes =
      timeToMinutes(
        availabilityStartTime
      );

    const endMinutes =
      timeToMinutes(
        availabilityEndTime
      );

    if (
      endMinutes <=
      startMinutes
    ) {
      setError(
        "End time must be later than start time."
      );

      return;
    }

    if (
      slotDuration <
      15 ||
      slotDuration >
      180
    ) {
      setError(
        "Appointment duration must be between 15 and 180 minutes."
      );

      return;
    }

    const slots:
      AvailabilitySlot[] =
      [];

    let current =
      startMinutes;

    while (
      current +
      slotDuration <=
      endMinutes
    ) {
      slots.push({
        startTime:
          minutesToTime(
            current
          ),

        endTime:
          minutesToTime(
            current +
            slotDuration
          ),

        isBooked:
          false,
      });

      current +=
        slotDuration;
    }

    if (
      slots.length ===
      0
    ) {
      setError(
        "The selected time range is too short for this appointment duration."
      );

      return;
    }

    setGeneratedSlots(
      slots
    );
  }

  function removeGeneratedSlot(
    index: number
  ) {
    setGeneratedSlots(
      (current) =>
        current.filter(
          (
            _,
            slotIndex
          ) =>
            slotIndex !==
            index
        )
    );
  }

  function editAvailabilityDay(
    day:
      AvailabilityDay
  ) {
    setAvailabilityDate(
      day.date
    );

    const slots =
      day.slots ??
      [];

    setGeneratedSlots(
      slots.map(
        (slot) => ({
          startTime:
            slot.startTime,

          endTime:
            slot.endTime,

          isBooked:
            Boolean(
              slot.isBooked
            ),
        })
      )
    );

    if (
      slots.length >
      0
    ) {
      setAvailabilityStartTime(
        slots[0]
          .startTime
      );

      setAvailabilityEndTime(
        slots[
          slots.length -
          1
        ].endTime
      );

      const firstDuration =
        timeToMinutes(
          slots[0]
            .endTime
        ) -
        timeToMinutes(
          slots[0]
            .startTime
        );

      if (
        firstDuration >
        0
      ) {
        setSlotDuration(
          firstDuration
        );
      }
    }

    setMessage("");
    setError("");

    requestAnimationFrame(
      () => {
        document
          .getElementById(
            "availability-editor"
          )
          ?.scrollIntoView(
            {
              behavior:
                "smooth",

              block:
                "start",
            }
          );
      }
    );
  }

  function resetAvailabilityForm() {
    setAvailabilityDate(
      ""
    );

    setAvailabilityStartTime(
      "08:00"
    );

    setAvailabilityEndTime(
      "16:00"
    );

    setSlotDuration(
      30
    );

    setGeneratedSlots(
      []
    );
  }

  async function saveAvailability() {
    if (
      !availabilityDate
    ) {
      setError(
        "Choose a date first."
      );

      return;
    }

    if (
      generatedSlots.length ===
      0
    ) {
      setError(
        "Generate at least one appointment slot before saving."
      );

      return;
    }

    try {
      setAvailabilitySaving(
        true
      );

      setMessage("");
      setError("");

      await api.post(
        "/doctors/availability",
        {
          date:
            availabilityDate,

          slots:
            generatedSlots.map(
              (
                slot
              ) => ({
                startTime:
                  slot.startTime,

                endTime:
                  slot.endTime,
              })
            ),
        }
      );

      await loadAvailability();

      setMessage(
        "Availability saved successfully."
      );

      resetAvailabilityForm();
    } catch (
    error: any
    ) {
      setError(
        error.response
          ?.data
          ?.message ||
        "Availability could not be saved."
      );
    } finally {
      setAvailabilitySaving(
        false
      );
    }
  }

  async function deleteAvailability(
    day:
      AvailabilityDay
  ) {
    try {
      setDeletingAvailabilityDate(
        day.date
      );

      setMessage("");
      setError("");

      await api.delete(
        `/doctors/availability/${day.date}`
      );

      setAvailability(
        (current) =>
          current.filter(
            (item) =>
              item.date !==
              day.date
          )
      );

      if (
        availabilityDate ===
        day.date
      ) {
        resetAvailabilityForm();
      }

      setMessage(
        "Availability removed successfully."
      );
    } catch (
    error: any
    ) {
      setError(
        error.response
          ?.data
          ?.message ||
        "Availability could not be removed."
      );
    } finally {
      setDeletingAvailabilityDate(
        null
      );
    }
  }

async function completeConsultation() {
  if (!selected) {
    return;
  }

  if (
    selected.status !== "confirmed" &&
    selected.status !== "rescheduled"
  ) {
    setError(
      "Only confirmed or rescheduled appointments can be completed."
    );

    return;
  }

  if (
    !hasAppointmentStarted(
      selected.date,
      selected.startTime
    )
  ) {
    setError(
      "The consultation cannot be completed before the scheduled appointment time."
    );

    return;
  }

  setMessage("");
  setError("");
  setGeneratedPrescriptionCode("");

  if (!form.diagnosis.trim()) {
    setError(
      "Enter the diagnosis before completing the consultation."
    );

    return;
  }

  if (
    issuePrescription &&
    medicines.some(
      (medicine) =>
        !medicine.name.trim() ||
        !medicine.dosage.trim() ||
        !medicine.frequency.trim() ||
        !medicine.duration.trim()
    )
  ) {
    setError(
      "Complete all medicine fields before issuing the prescription."
    );

    return;
  }

  const patientId =
    selected.patientId?._id;

  if (!patientId) {
    setError(
      "Patient information is missing from this appointment."
    );

    return;
  }

  try {
    setSaving(true);

    const response =
      await api.post(
        "/consultations/complete",
        {
          patientId,

          appointmentId:
            selected._id,

          diagnosis:
            form.diagnosis.trim(),

          diagnosisExplanation:
            form.diagnosisExplanation.trim(),

          symptoms:
            form.symptoms.trim(),

          observations:
            form.observations.trim(),

          treatment:
            form.treatment.trim(),

          followUp:
            form.followUp.trim(),

          issuePrescription,

          medicines:
            issuePrescription
              ? medicines.map(
                  (medicine) => ({
                    name:
                      medicine.name.trim(),

                    dosage:
                      medicine.dosage.trim(),

                    frequency:
                      medicine.frequency.trim(),

                    duration:
                      medicine.duration.trim(),
                  })
                )
              : [],

          instructions:
            issuePrescription
              ? instructions.trim()
              : "",

          expiresAt:
            issuePrescription &&
            expiresAt
              ? expiresAt
              : undefined,
        }
      );

    const prescriptionCode =
      response.data
        .prescription
        ?.prescriptionCode ??
      "";

    if (prescriptionCode) {
      setGeneratedPrescriptionCode(
        prescriptionCode
      );

      setPrescriptionCount(
        (current) =>
          current + 1
      );
    }

    setAppointments(
      (current) =>
        current.map(
          (appointment) =>
            appointment._id ===
            selected._id
              ? {
                  ...appointment,
                  status:
                    "completed",
                }
              : appointment
        )
    );

    setMessage(
      prescriptionCode
        ? `Consultation saved. Prescription ${prescriptionCode} was issued.`
        : "Consultation saved successfully."
    );

    setSelected(null);

    setForm({
      ...emptyConsultation,
    });

    setClinicalProfile({
      ...emptyClinicalProfile,
    });

    setIssuePrescription(false);

    setMedicines([
      emptyMedicine(),
    ]);

    setInstructions("");
    setExpiresAt("");
  } catch (error: any) {
    setError(
      error.response?.data?.message ||
      "The consultation could not be completed."
    );
  } finally {
    setSaving(false);
  }
}


  return (
    <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
      <section className="flex flex-col justify-between gap-6 border-b border-[#E2EBEF] pb-7 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          {doctorProfile?.photoUrl ? (
            <OptimizedImage
              src={
                doctorProfile.photoUrl
              }
              alt={`${displayName} profile`}
              className="h-16 w-16 rounded-full border border-[#E2EBEF] bg-white object-cover shadow-sm"
            />
          ) : (
            <DoctorInitials
              initials={
                initials
              }
            />
          )}

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-teal">
              Doctor dashboard
            </p>

            <h1 className="mt-1 font-display text-3xl font-extrabold text-navy">
              Welcome,{" "}
              {displayName}.
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[#647583]">
              {doctorProfile
                ?.speciality && (
                  <span>
                    {
                      doctorProfile.speciality
                    }
                  </span>
                )}

              {doctorProfile
                ?.facility && (
                  <>
                    <span>
                      •
                    </span>

                    <span>
                      {
                        doctorProfile.facility
                      }
                    </span>
                  </>
                )}

              {doctorProfile
                ?.location && (
                  <>
                    <span>
                      •
                    </span>

                    <span>
                      {
                        doctorProfile.location
                      }
                    </span>
                  </>
                )}
            </div>
          </div>
        </div>

      </section>

      {message && (
        <div
          role="status"
          className="mt-5 rounded-xl border border-[#BFE6DD] bg-[#F0FBF8] p-4 text-sm text-[#176B58]"
        >
          {message}

          {generatedPrescriptionCode && (
            <p className="mt-2 font-semibold">
              Prescription
              code:{" "}
              {
                generatedPrescriptionCode
              }
            </p>
          )}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mt-5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <section className="mt-8 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <DashboardStat
          icon={
            <CalendarDays className="h-5 w-5" />
          }
          label="Today's appointments"
          value={
            summary.today
          }
        />

        <DashboardStat
          icon={
            <Clock3 className="h-5 w-5" />
          }
          label="Pending requests"
          value={
            summary.pending
          }
        />

        <DashboardStat
          icon={
            <CheckCircle2 className="h-5 w-5" />
          }
          label="Confirmed"
          value={
            summary.confirmed
          }
        />

        <DashboardStat
          icon={
            <FileText className="h-5 w-5" />
          }
          label="Completed"
          value={
            summary.completed
          }
        />
      </section>

      <section className="mt-5">
        <div className="card flex items-center gap-3 p-5">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#EAF8FA] text-teal">
            <Pill className="h-5 w-5" />
          </div>

          <div>
            <p className="text-sm text-[#647583]">
              Prescriptions
              issued
            </p>

            <p className="mt-1 font-display text-xl font-bold text-navy">
              {
                prescriptionCount
              }
            </p>
          </div>
        </div>
      </section>

      <div className="mt-8 flex w-fit rounded-xl border border-[#E2EBEF] bg-[#F8FBFC] p-1">
        {(
          [
            {
              value:
                "appointments",
              label:
                "Appointments",
            },

            {
              value:
                "availability",
              label:
                "Availability",
            },

            {
              value:
                "profile",
              label:
                "Profile",
            },
          ] as {
            value:
            DashboardView;
            label:
            string;
          }[]
        ).map(
          (item) => (
            <button
              key={
                item.value
              }
              type="button"
              onClick={() => {
                setDashboardView(
                  item.value
                );

                setMessage(
                  ""
                );

                setError(
                  ""
                );

                if (
                  item.value ===
                  "availability"
                ) {
                  void loadAvailability();
                }
              }}
              className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition ${dashboardView ===
                item.value
                ? "bg-white text-teal shadow-sm"
                : "text-[#647583] hover:text-navy"
                }`}
            >
              {
                item.label
              }
            </button>
          )
        )}
      </div>

      {dashboardView ===
        "availability" ? (
        <AvailabilityManager
          availability={
            availability
          }
          loading={
            availabilityLoading
          }
          saving={
            availabilitySaving
          }
          deletingDate={
            deletingAvailabilityDate
          }
          date={
            availabilityDate
          }
          startTime={
            availabilityStartTime
          }
          endTime={
            availabilityEndTime
          }
          duration={
            slotDuration
          }
          slots={
            generatedSlots
          }
          onDateChange={
            setAvailabilityDate
          }
          onStartTimeChange={
            setAvailabilityStartTime
          }
          onEndTimeChange={
            setAvailabilityEndTime
          }
          onDurationChange={
            setSlotDuration
          }
          onGenerate={
            generateSlots
          }
          onSave={
            saveAvailability
          }
          onReset={
            resetAvailabilityForm
          }
          onRemoveSlot={
            removeGeneratedSlot
          }
          onEditDay={
            editAvailabilityDay
          }
          onDeleteDay={
            deleteAvailability
          }
        />
      ) : dashboardView ===
        "profile" ? (
        <DoctorProfileManager
          form={
            profileForm
          }
          saving={
            profileSaving
          }
          onChange={
            updateProfileField
          }
          onSave={
            saveDoctorProfile
          }
          onReset={
            resetProfileForm
          }
        />
      ) : (
        <div className="mt-9 grid gap-8 xl:grid-cols-[minmax(0,1fr)_520px]">
          <section>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-5 w-5 text-teal" />

                <h2 className="font-display text-xl font-bold text-navy">
                  Schedule and requests
                </h2>
              </div>

              <div className="flex max-w-full overflow-x-auto rounded-xl border border-[#E2EBEF] bg-[#F8FBFC] p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {(
                  [
                    "all",
                    "pending",
                    "confirmed",
                    "rescheduled",
                    "completed",
                    "cancelled",
                    "no-show",
                  ] as AppointmentFilter[]
                ).map(
                  (
                    option
                  ) => (
                    <button
                      key={
                        option
                      }
                      type="button"
                      onClick={() =>
                        setFilter(
                          option
                        )
                      }
                      className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold capitalize transition ${filter ===
                        option
                        ? "bg-white text-teal shadow-sm"
                        : "text-[#647583] hover:text-navy"
                        }`}
                    >
                      {
                        option
                      }
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              {loading ? (
                <LoadingState label="Loading appointments..." />
              ) : filteredAppointments.length ===
                0 ? (
                <div className="card flex min-h-48 flex-col items-center justify-center px-6 py-10 text-center">
                  <CalendarDays className="h-7 w-7 text-teal" />

                  <p className="mt-4 font-semibold text-navy">
                    No{" "}
                    {filter ===
                      "all"
                      ? ""
                      : filter}{" "}
                    appointments
                  </p>
                </div>
              ) : (
                filteredAppointments.map(
                  (
                    appointment
                  ) => {
                    const status =
                      appointment.status;

                    const isPending =
                      status ===
                      "pending";

                    const isConfirmed =
                      status ===
                      "confirmed";

                    const isRescheduled =
                      status ===
                      "rescheduled";


                    const isCompleted =
                      status ===
                      "completed";

                    const isCancelled =
                      status ===
                      "cancelled";

                    const isNoShow =
                      status ===
                      "no-show";

                    const appointmentStarted =
                      hasAppointmentStarted(
                        appointment.date,
                        appointment.startTime
                      );

                    const isSelected =
                      selected?._id ===
                      appointment._id;

                    const isUpdating =
                      updatingAppointmentId ===
                      appointment._id;

                    const patientName =
                      appointment
                        .patientId
                        ?.userId
                        ?.name ||
                      "Patient";

                    return (
                      <article
                        key={
                          appointment._id
                        }
                        className={`card p-5 transition ${isSelected
                          ? "border-teal bg-[#F5FBFC]"
                          : ""
                          }`}
                      >
                        <div className="flex justify-between gap-4">
                          <div>
                            <p className="font-semibold text-navy">
                              {
                                patientName
                              }
                            </p>

                            <p className="mt-1 text-sm text-[#647583]">
                              {
                                appointment.date
                              }{" "}
                              •{" "}
                              {
                                appointment.startTime
                              }
                            </p>

                            <p className="mt-2 text-sm leading-6 text-[#647583]">
                              {
                                appointment.reason
                              }
                            </p>
                          </div>

                          <AppointmentStatusBadge
                            status={
                              status
                            }
                          />
                        </div>

                        {isPending && (
                          appointmentStarted ? (
                            <p className="mt-4 border-t border-[#E2EBEF] pt-4 text-xs font-semibold text-[#9A6700]">
                              Awaiting update
                            </p>
                          ) : (
                            <div className="mt-4 flex flex-wrap gap-2 border-t border-[#E2EBEF] pt-4">
                              <button
                                type="button"
                                disabled={
                                  isUpdating
                                }
                                onClick={() =>
                                  void updateAppointmentStatus(
                                    appointment,
                                    "confirmed"
                                  )
                                }
                                className="inline-flex items-center gap-2 rounded-lg bg-teal px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                              >
                                <Check className="h-4 w-4" />

                                {isUpdating
                                  ? "Updating..."
                                  : "Confirm appointment"}
                              </button>

                              <button
                                type="button"
                                disabled={
                                  isUpdating
                                }
                                onClick={() =>
                                  void updateAppointmentStatus(
                                    appointment,
                                    "cancelled"
                                  )
                                }
                                className="inline-flex items-center gap-2 rounded-lg border border-[#E2EBEF] bg-white px-4 py-2 text-xs font-semibold text-[#647583] hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                              >
                                <X className="h-4 w-4" />

                                Cancel
                              </button>
                            </div>
                          )
                        )}


                        {isRescheduled && (
                          appointmentStarted ? (
                            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[#E2EBEF] pt-4">
                              <button
                                type="button"
                                onClick={() =>
                                  void selectAppointment(
                                    appointment
                                  )
                                }
                                className="text-sm font-semibold text-teal hover:text-navy"
                              >
                                {isSelected
                                  ? "Consultation selected"
                                  : "Open consultation →"}
                              </button>

                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() =>
                                  void updateAppointmentStatus(
                                    appointment,
                                    "no-show"
                                  )
                                }
                                className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                              >
                                <X className="h-4 w-4" />

                                {isUpdating
                                  ? "Updating..."
                                  : "Mark no-show"}
                              </button>
                            </div>
                          ) : (
                            <div className="mt-4 flex flex-wrap gap-2 border-t border-[#E2EBEF] pt-4">
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() =>
                                  void updateAppointmentStatus(
                                    appointment,
                                    "confirmed"
                                  )
                                }
                                className="inline-flex items-center gap-2 rounded-lg bg-teal px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                              >
                                <Check className="h-4 w-4" />

                                {isUpdating
                                  ? "Updating..."
                                  : "Confirm appointment"}
                              </button>

                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() =>
                                  void updateAppointmentStatus(
                                    appointment,
                                    "cancelled"
                                  )
                                }
                                className="inline-flex items-center gap-2 rounded-lg border border-[#E2EBEF] bg-white px-4 py-2 text-xs font-semibold text-[#647583] hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                              >
                                <X className="h-4 w-4" />

                                Cancel
                              </button>
                            </div>
                          )
                        )}


                        {isConfirmed && (
                          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[#E2EBEF] pt-4">
                            {appointmentStarted ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    void selectAppointment(
                                      appointment
                                    )
                                  }
                                  className="text-sm font-semibold text-teal hover:text-navy"
                                >
                                  {isSelected
                                    ? "Consultation selected"
                                    : "Open consultation →"}
                                </button>

                                <button
                                  type="button"
                                  disabled={
                                    isUpdating
                                  }
                                  onClick={() =>
                                    void updateAppointmentStatus(
                                      appointment,
                                      "no-show"
                                    )
                                  }
                                  className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                                >
                                  <X className="h-4 w-4" />

                                  {isUpdating
                                    ? "Updating..."
                                    : "Mark no-show"}
                                </button>
                              </>
                            ) : (
                              <p className="text-xs font-semibold text-[#647583]">
                                Consultation available at the scheduled appointment time.
                              </p>
                            )}
                          </div>
                        )}

                        {isCompleted && (
                          <p className="mt-4 border-t border-[#E2EBEF] pt-4 text-xs text-[#8A99A5]">
                            Consultation
                            completed
                          </p>
                        )}

                        {isCancelled && (
                          <p className="mt-4 border-t border-[#E2EBEF] pt-4 text-xs text-[#8A99A5]">
                            This appointment
                            was cancelled.
                          </p>
                        )}

                        {isNoShow && (
                          <p className="mt-4 border-t border-[#E2EBEF] pt-4 text-xs text-[#8A99A5]">
                            Patient did not attend this appointment.
                          </p>
                        )}
                      </article>
                    );
                  }
                )
              )}
            </div>
          </section>

          {selected ? (
            <aside className="card h-fit overflow-hidden">
              <div className="border-b border-[#E2EBEF] px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#EAF8FA] text-teal">
                    <FileText className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-teal">
                      Consultation
                    </p>

                    <h2 className="mt-1 font-display text-xl font-bold text-navy">
                      {selected
                        .patientId
                        ?.userId
                        ?.name ||
                        "Patient"}
                    </h2>
                  </div>
                </div>

                <div className="mt-4 rounded-xl bg-[#F8FBFC] px-4 py-3 text-sm text-[#647583]">
                  <p className="font-medium text-navy">
                    {
                      selected.date
                    }{" "}
                    •{" "}
                    {
                      selected.startTime
                    }
                  </p>

                  <p className="mt-1">
                    {
                      selected.reason
                    }
                  </p>
                </div>
              </div>

              <div className="p-6">
                <p className="mb-5 border-b border-slate-200 pb-4 text-sm text-slate-600">Review patient context → document findings → treatment and prescription → follow-up → complete consultation</p>
                <section className="mb-7 rounded-2xl border border-[#DCE8EB] bg-[#F8FBFC] p-5">
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#EAF8FA] text-teal">
                      <ShieldCheck className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-teal">
                        Patient clinical
                        profile
                      </p>

                      <h3 className="mt-1 font-display text-lg font-bold text-navy">
                        Clinical
                        information
                      </h3>

                      <p className="mt-1 text-xs leading-5 text-[#647583]">
                        Persistent
                        clinical
                        information
                        available to
                        authorised
                        healthcare
                        professionals.
                      </p>
                    </div>
                  </div>

                  {clinicalLoading ? (
                    <LoadingState label="Loading clinical information..." />
                  ) : (
                    <div className="mt-5 space-y-5">
                      {clinicalMessage && (
                        <div className="rounded-xl border border-[#BFE6DD] bg-[#F0FBF8] px-4 py-3 text-sm text-[#176B58]">
                          {
                            clinicalMessage
                          }
                        </div>
                      )}

                      {clinicalError && (
                        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                          {
                            clinicalError
                          }
                        </div>
                      )}

                      <div>
                        <p className="text-sm font-semibold text-navy">
                          Blood group
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2">
                          {[
                            "A+",
                            "A-",
                            "B+",
                            "B-",
                            "AB+",
                            "AB-",
                            "O+",
                            "O-",
                          ].map(
                            (
                              bloodGroup
                            ) => {
                              const active =
                                clinicalProfile.bloodGroup ===
                                bloodGroup;

                              return (
                                <button
                                  key={
                                    bloodGroup
                                  }
                                  type="button"
                                  onClick={() =>
                                    updateClinicalField(
                                      "bloodGroup",
                                      bloodGroup
                                    )
                                  }
                                  className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${active
                                    ? "border-teal bg-[#EAF8FA] text-teal"
                                    : "border-[#DCE8EB] bg-white text-[#647583] hover:border-teal hover:text-teal"
                                    }`}
                                >
                                  {
                                    bloodGroup
                                  }
                                </button>
                              );
                            }
                          )}
                        </div>

                        {clinicalProfile.bloodGroup && (
                          <button
                            type="button"
                            onClick={() =>
                              updateClinicalField(
                                "bloodGroup",
                                ""
                              )
                            }
                            className="mt-2 text-xs font-semibold text-[#8A99A5] hover:text-red-600"
                          >
                            Clear blood
                            group
                          </button>
                        )}
                      </div>

                      <label className="block text-sm font-semibold text-navy">
                        Allergies

                        <textarea
                          className="field mt-2 min-h-20 resize-y"
                          placeholder="Example: Penicillin, peanuts"
                          value={
                            clinicalProfile.allergies
                          }
                          onChange={(
                            event
                          ) =>
                            updateClinicalField(
                              "allergies",
                              event.target.value
                            )
                          }
                        />

                        <span className="mt-2 block text-xs font-normal text-[#8A99A5]">
                          Separate multiple
                          allergies with
                          commas.
                        </span>
                      </label>

                      <label className="block text-sm font-semibold text-navy">
                        Existing
                        conditions

                        <textarea
                          className="field mt-2 min-h-20 resize-y"
                          placeholder="Example: Asthma, hypertension"
                          value={
                            clinicalProfile.existingConditions
                          }
                          onChange={(
                            event
                          ) =>
                            updateClinicalField(
                              "existingConditions",
                              event.target.value
                            )
                          }
                        />

                        <span className="mt-2 block text-xs font-normal text-[#8A99A5]">
                          Separate multiple
                          conditions with
                          commas.
                        </span>
                      </label>

                      <button
                        type="button"
                        onClick={() =>
                          void saveClinicalProfile()
                        }
                        disabled={
                          clinicalSaving
                        }
                        className="btn-secondary w-full"
                      >
                        {clinicalSaving
                          ? "Saving clinical information..."
                          : "Save clinical information"}
                      </button>

                      <p className="text-xs leading-5 text-[#8A99A5]">
                        Update these
                        details only when
                        clinically
                        appropriate.
                      </p>
                    </div>
                  )}
                </section>

                <ConsultationSection
                  title="Assessment"
                  description="Document the diagnosis and explain it clearly."
                >
                  <ConsultationField
                    label="Diagnosis"
                    value={
                      form.diagnosis
                    }
                    onChange={(
                      value
                    ) =>
                      updateConsultationField(
                        "diagnosis",
                        value
                      )
                    }
                    required
                  />

                  <ConsultationField
                    label="Diagnosis explanation"
                    value={
                      form.diagnosisExplanation
                    }
                    onChange={(
                      value
                    ) =>
                      updateConsultationField(
                        "diagnosisExplanation",
                        value
                      )
                    }
                  />
                </ConsultationSection>

                <ConsultationSection
                  title="Clinical notes"
                  description="Record reported symptoms and relevant observations."
                >
                  <ConsultationField
                    label="Symptoms"
                    value={
                      form.symptoms
                    }
                    onChange={(
                      value
                    ) =>
                      updateConsultationField(
                        "symptoms",
                        value
                      )
                    }
                  />

                  <ConsultationField
                    label="Clinical observations"
                    value={
                      form.observations
                    }
                    onChange={(
                      value
                    ) =>
                      updateConsultationField(
                        "observations",
                        value
                      )
                    }
                  />
                </ConsultationSection>

                <ConsultationSection
                  title="Care plan"
                  description="Record the treatment provided and the next steps."
                  last
                >
                  <ConsultationField
                    label="Treatment"
                    value={
                      form.treatment
                    }
                    onChange={(
                      value
                    ) =>
                      updateConsultationField(
                        "treatment",
                        value
                      )
                    }
                  />

                  <ConsultationField
                    label="Follow-up plan"
                    value={
                      form.followUp
                    }
                    onChange={(
                      value
                    ) =>
                      updateConsultationField(
                        "followUp",
                        value
                      )
                    }
                  />
                </ConsultationSection>

                <div className="mt-7 border-t border-[#E2EBEF] pt-7">
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-[#F8FBFC] p-4">
                    <input
                      type="checkbox"
                      checked={
                        issuePrescription
                      }
                      onChange={(
                        event
                      ) =>
                        setIssuePrescription(
                          event.target.checked
                        )
                      }
                      className="mt-1 h-4 w-4 accent-teal"
                    />

                    <div>
                      <p className="font-semibold text-navy">
                        Issue a
                        prescription
                      </p>

                      <p className="mt-1 text-xs leading-5 text-[#647583]">
                        Add only medicines
                        selected by the
                        prescribing
                        clinician.
                      </p>
                    </div>
                  </label>

                  {issuePrescription && (
                    <div className="mt-6">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <Pill className="h-5 w-5 text-teal" />

                          <h3 className="font-display text-lg font-bold text-navy">
                            Medicines
                          </h3>
                        </div>

                        <button
                          type="button"
                          onClick={
                            addMedicine
                          }
                          className="inline-flex items-center gap-1 text-sm font-semibold text-teal"
                        >
                          <Plus className="h-4 w-4" />

                          Add medicine
                        </button>
                      </div>

                      <div className="mt-4 space-y-4">
                        {medicines.map(
                          (
                            medicine,
                            index
                          ) => (
                            <div
                              key={
                                index
                              }
                              className="rounded-xl border border-[#E2EBEF] bg-[#F8FBFC] p-4"
                            >
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold text-navy">
                                  Medicine{" "}
                                  {index +
                                    1}
                                </p>

                                <button
                                  type="button"
                                  onClick={() =>
                                    removeMedicine(
                                      index
                                    )
                                  }
                                  className="text-[#8A99A5] hover:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>

                              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                <input
                                  className="field"
                                  placeholder="Medicine name"
                                  value={
                                    medicine.name
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    updateMedicine(
                                      index,
                                      "name",
                                      event.target.value
                                    )
                                  }
                                />

                                <input
                                  className="field"
                                  placeholder="Dosage"
                                  value={
                                    medicine.dosage
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    updateMedicine(
                                      index,
                                      "dosage",
                                      event.target.value
                                    )
                                  }
                                />

                                <input
                                  className="field"
                                  placeholder="Frequency"
                                  value={
                                    medicine.frequency
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    updateMedicine(
                                      index,
                                      "frequency",
                                      event.target.value
                                    )
                                  }
                                />

                                <input
                                  className="field"
                                  placeholder="Duration"
                                  value={
                                    medicine.duration
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    updateMedicine(
                                      index,
                                      "duration",
                                      event.target.value
                                    )
                                  }
                                />
                              </div>
                            </div>
                          )
                        )}
                      </div>

                      <label className="mt-5 block text-sm font-semibold text-navy">
                        Prescription
                        instructions

                        <textarea
                          className="field mt-2 min-h-20 resize-y"
                          value={
                            instructions
                          }
                          onChange={(
                            event
                          ) =>
                            setInstructions(
                              event.target.value
                            )
                          }
                          placeholder="Additional dispensing or administration instructions"
                        />
                      </label>

                      <label className="mt-5 block text-sm font-semibold text-navy">
                        Expiry date

                        <span className="ml-1 font-normal text-[#8A99A5]">
                          optional
                        </span>

                        <input
                          type="date"
                          className="field mt-2"
                          value={
                            expiresAt
                          }
                          onChange={(
                            event
                          ) =>
                            setExpiresAt(
                              event.target.value
                            )
                          }
                        />
                      </label>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className="btn-primary mt-8 w-full"
                  onClick={() =>
                    void completeConsultation()
                  }
                  disabled={
                    saving
                  }
                >
                  {saving
                    ? "Saving..."
                    : "Complete consultation"}
                </button>
              </div>
            </aside>
          ) : (
            <aside className="card flex min-h-[320px] h-fit flex-col items-center justify-center p-8 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-[#EAF8FA] text-teal">
                <UserRound className="h-6 w-6" />
              </div>

              <h2 className="mt-5 font-display text-lg font-bold text-navy">
                Select a confirmed
                appointment
              </h2>

              <p className="mt-2 max-w-sm text-sm leading-6 text-[#647583]">
                Confirm a pending
                appointment first,
                then open it to
                document the
                consultation and
                update relevant
                patient clinical
                information.
              </p>
            </aside>
          )}
        </div>
      )}
    </main>
  );
}

function DoctorProfileManager({
  form,
  saving,
  onChange,
  onSave,
  onReset,
}: {
  form:
  DoctorProfileForm;

  saving:
  boolean;

  onChange: (
    field:
      keyof DoctorProfileForm,
    value: string
  ) => void;

  onSave:
  () => void;

  onReset:
  () => void;
}) {
  return (
    <section className="mt-9 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="card p-6 sm:p-7">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-teal">
          Doctor profile
        </p>

        <h2 className="mt-2 font-display text-2xl font-bold text-navy">
          Edit professional
          information
        </h2>

        <p className="mt-2 text-sm leading-6 text-[#647583]">
          Keep the information
          patients see on your
          public MediLink profile
          accurate and up to date.
        </p>

        <div className="mt-7 grid gap-5 sm:grid-cols-2">
          <ProfileField
            label="Full name"
            value={
              form.name
            }
            onChange={(
              value
            ) =>
              onChange(
                "name",
                value
              )
            }
          />

          <ProfileField
            label="Phone"
            value={
              form.phone
            }
            onChange={(
              value
            ) =>
              onChange(
                "phone",
                value
              )
            }
          />

          <ProfileField
            label="Speciality"
            value={
              form.speciality
            }
            onChange={(
              value
            ) =>
              onChange(
                "speciality",
                value
              )
            }
          />

          <ProfileField
            label="Years of experience"
            type="number"
            value={
              form.yearsOfExperience
            }
            onChange={(
              value
            ) =>
              onChange(
                "yearsOfExperience",
                value
              )
            }
          />

          <ProfileField
            label="Facility"
            value={
              form.facility
            }
            onChange={(
              value
            ) =>
              onChange(
                "facility",
                value
              )
            }
          />

          <ProfileField
            label="Location"
            value={
              form.location
            }
            onChange={(
              value
            ) =>
              onChange(
                "location",
                value
              )
            }
          />

          <ProfileField
            label="Qualifications"
            value={
              form.qualifications
            }
            onChange={(
              value
            ) =>
              onChange(
                "qualifications",
                value
              )
            }
            hint="Separate with commas."
          />

          <ProfileField
            label="Languages"
            value={
              form.languages
            }
            onChange={(
              value
            ) =>
              onChange(
                "languages",
                value
              )
            }
            hint="Separate with commas."
          />

          <ProfileField
            label="Areas of care"
            value={
              form.areasOfCare
            }
            onChange={(
              value
            ) =>
              onChange(
                "areasOfCare",
                value
              )
            }
            hint="Separate with commas."
          />

          <ProfileField
            label="Consultation types"
            value={
              form.consultationTypes
            }
            onChange={(
              value
            ) =>
              onChange(
                "consultationTypes",
                value
              )
            }
            hint="Separate with commas."
          />

          <div className="sm:col-span-2">
            <ProfileField
              label="Photo URL"
              value={
                form.photoUrl
              }
              onChange={(
                value
              ) =>
                onChange(
                  "photoUrl",
                  value
                )
              }
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-navy">
              Biography

              <textarea
                className="field mt-2 min-h-36 resize-y"
                value={
                  form.biography
                }
                onChange={(
                  event
                ) =>
                  onChange(
                    "biography",
                    event.target.value
                  )
                }
              />
            </label>
          </div>
        </div>

        <div className="mt-7 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={
              onSave
            }
            disabled={
              saving
            }
            className="btn-primary"
          >
            {saving
              ? "Saving..."
              : "Save profile"}
          </button>

          <button
            type="button"
            onClick={
              onReset
            }
            className="btn-secondary"
          >
            Reset changes
          </button>
        </div>
      </div>

      <aside className="card h-fit p-6">
        <UserRound className="h-6 w-6 text-teal" />

        <h3 className="mt-4 font-display text-lg font-bold text-navy">
          Public profile
        </h3>

        <p className="mt-2 text-sm leading-6 text-[#647583]">
          These details appear to
          patients when they browse
          doctors and review your
          profile before booking.
        </p>
      </aside>
    </section>
  );
}

function ProfileField({
  label,
  value,
  onChange,
  type = "text",
  hint,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  type?: string;
  hint?: string;
}) {
  return (
    <label className="block text-sm font-semibold text-navy">
      {label}

      <input
        type={
          type
        }
        className="field mt-2"
        value={
          value
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
      />

      {hint && (
        <span className="mt-2 block text-xs font-normal text-[#8A99A5]">
          {hint}
        </span>
      )}
    </label>
  );
}

function AvailabilityManager({
  availability,
  loading,
  saving,
  deletingDate,
  date,
  startTime,
  endTime,
  duration,
  slots,
  onDateChange,
  onStartTimeChange,
  onEndTimeChange,
  onDurationChange,
  onGenerate,
  onSave,
  onReset,
  onRemoveSlot,
  onEditDay,
  onDeleteDay,
}: {
  availability:
  AvailabilityDay[];
  loading: boolean;
  saving: boolean;
  deletingDate:
  string | null;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  slots:
  AvailabilitySlot[];

  onDateChange: (
    value: string
  ) => void;

  onStartTimeChange: (
    value: string
  ) => void;

  onEndTimeChange: (
    value: string
  ) => void;

  onDurationChange: (
    value: number
  ) => void;

  onGenerate:
  () => void;

  onSave:
  () => void;

  onReset:
  () => void;

  onRemoveSlot: (
    index: number
  ) => void;

  onEditDay: (
    day:
      AvailabilityDay
  ) => void;

  onDeleteDay: (
    day:
      AvailabilityDay
  ) => void;
}) {
  const [
    durationOpen,
    setDurationOpen,
  ] =
    useState(false);

  const durationOptions =
    [
      15,
      20,
      30,
      45,
      60,
    ];

  return (
    <div className="mt-9 grid gap-8 lg:grid-cols-[420px_minmax(0,1fr)]">
      <section
        id="availability-editor"
        className="card h-fit scroll-mt-24 p-6"
      >
        <div className="flex items-center gap-3">
          <CalendarDays className="h-6 w-6 text-teal" />

          <div>
            <h2 className="font-display text-xl font-bold text-navy">
              Set availability
            </h2>

            <p className="mt-1 text-sm text-[#647583]">
              Choose when patients
              can book you.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-5">
          <label className="block text-sm font-semibold text-navy">
            Date

            <input
              type="date"
              min={
                getToday()
              }
              className="field mt-2"
              value={
                date
              }
              onChange={(
                event
              ) =>
                onDateChange(
                  event.target.value
                )
              }
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-navy">
              Start time

              <input
                type="time"
                className="field mt-2"
                value={
                  startTime
                }
                onChange={(
                  event
                ) =>
                  onStartTimeChange(
                    event.target.value
                  )
                }
              />
            </label>

            <label className="block text-sm font-semibold text-navy">
              End time

              <input
                type="time"
                className="field mt-2"
                value={
                  endTime
                }
                onChange={(
                  event
                ) =>
                  onEndTimeChange(
                    event.target.value
                  )
                }
              />
            </label>
          </div>

          <div className="relative">
            <p className="text-sm font-semibold text-navy">
              Appointment
              duration
            </p>

            <button
              type="button"
              onClick={() =>
                setDurationOpen(
                  (
                    current
                  ) =>
                    !current
                )
              }
              className="mt-2 flex h-[46px] w-full items-center justify-between rounded-xl border border-[#D7E2E7] bg-white px-4 text-sm font-semibold text-navy"
            >
              <span>
                {
                  duration
                }{" "}
                minutes
              </span>

              <span>
                ▾
              </span>
            </button>

            {durationOpen && (
              <div className="absolute left-0 right-0 z-30 mt-2 overflow-hidden rounded-xl border border-[#D7E2E7] bg-white p-1.5 shadow-lg">
                {durationOptions.map(
                  (
                    option
                  ) => (
                    <button
                      key={
                        option
                      }
                      type="button"
                      onClick={() => {
                        onDurationChange(
                          option
                        );

                        setDurationOpen(
                          false
                        );
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-3.5 py-2.5 text-left text-sm ${option ===
                        duration
                        ? "bg-[#EAF8FA] font-semibold text-teal"
                        : "text-navy hover:bg-[#F5FAFB]"
                        }`}
                    >
                      <span>
                        {
                          option
                        }{" "}
                        minutes
                      </span>

                      {option ===
                        duration && (
                          <Check className="h-4 w-4" />
                        )}
                    </button>
                  )
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={
              onGenerate
            }
            className="btn-secondary w-full"
          >
            Generate slots
          </button>
        </div>

        {slots.length >
          0 && (
            <div className="mt-6 border-t border-[#E2EBEF] pt-6">
              <div className="space-y-2">
                {slots.map(
                  (
                    slot,
                    index
                  ) => (
                    <div
                      key={`${slot.startTime}-${slot.endTime}`}
                      className="flex items-center justify-between rounded-lg border border-[#DCE8EB] bg-white px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-semibold text-navy">
                          {
                            slot.startTime
                          }{" "}
                          –{" "}
                          {
                            slot.endTime
                          }
                        </p>

                        {slot.isBooked && (
                          <p className="text-xs text-[#8A99A5]">
                            Booked
                          </p>
                        )}
                      </div>

                      {!slot.isBooked && (
                        <button
                          type="button"
                          onClick={() =>
                            onRemoveSlot(
                              index
                            )
                          }
                          className="text-[#8A99A5] hover:text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  )
                )}
              </div>

              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  disabled={
                    saving
                  }
                  onClick={
                    onSave
                  }
                  className="btn-primary flex-1"
                >
                  {saving
                    ? "Saving..."
                    : "Save availability"}
                </button>

                <button
                  type="button"
                  onClick={
                    onReset
                  }
                  className="btn-secondary"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
      </section>

      <section>
        <h2 className="font-display text-xl font-bold text-navy">
          Upcoming
          availability
        </h2>

        <p className="mt-1 text-sm text-[#647583]">
          Manage your published
          appointment schedule.
        </p>

        <div className="mt-4 space-y-4">
          {loading ? (
            <div className="card p-6 text-sm text-[#647583]">
              Loading
              availability...
            </div>
          ) : availability.length ===
            0 ? (
            <div className="card p-8 text-center text-sm text-[#647583]">
              No upcoming
              availability.
            </div>
          ) : (
            availability.map(
              (
                day
              ) => {
                const booked =
                  day.slots.filter(
                    (
                      slot
                    ) =>
                      slot.isBooked
                  ).length;

                const available =
                  day.slots.length -
                  booked;

                return (
                  <div
                    key={
                      day._id
                    }
                    className="card p-5"
                  >
                    <div className="flex flex-col justify-between gap-4 sm:flex-row">
                      <div>
                        <p className="font-display text-lg font-bold text-navy">
                          {formatAvailabilityDate(
                            day.date
                          )}
                        </p>

                        <p className="mt-2 text-xs text-[#647583]">
                          {
                            available
                          }{" "}
                          available •{" "}
                          {
                            booked
                          }{" "}
                          booked
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            onEditDay(
                              day
                            )
                          }
                          className="btn-secondary"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          disabled={
                            deletingDate ===
                            day.date
                          }
                          onClick={() =>
                            onDeleteDay(
                              day
                            )
                          }
                          className="rounded-lg border border-red-100 px-3 py-2 text-xs font-semibold text-red-600"
                        >
                          {deletingDate ===
                            day.date
                            ? "Removing..."
                            : "Remove"}
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {day.slots.map(
                        (
                          slot,
                          index
                        ) => (
                          <div
                            key={`${day.date}-${index}`}
                            className="rounded-lg border border-[#E2EBEF] bg-[#F8FBFC] px-3 py-2.5"
                          >
                            <p className="text-sm font-semibold text-navy">
                              {
                                slot.startTime
                              }{" "}
                              –{" "}
                              {
                                slot.endTime
                              }
                            </p>

                            <p className="mt-1 text-xs text-[#8A99A5]">
                              {slot.isBooked
                                ? "Booked"
                                : "Available"}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                );
              }
            )
          )}
        </div>
      </section>
    </div>
  );
}

function AppointmentStatusBadge({
  status,
}: {
  status: string;
}) {
  const styles:
    Record<
      string,
      string
    > = {
    confirmed:
      "bg-[#EAF8FA] text-teal",

    pending:
      "bg-[#FFF7E8] text-[#9A6700]",

    completed:
      "bg-[#F1F5F7] text-[#647583]",

    cancelled:
      "bg-red-50 text-red-700",

    rescheduled:
      "bg-violet-50 text-violet-700",

    "no-show":
      "bg-amber-50 text-amber-700",
  };

  return (
    <span
      className={`h-fit shrink-0 rounded-full px-3 py-1 text-xs font-semibold capitalize ${styles[
        status
      ] ??
        "bg-[#F1F5F7] text-[#647583]"
        }`}
    >
      {status === "no-show"
        ? "No-show"
        : status}
    </span>
  );
}

function ConsultationSection({
  title,
  description,
  children,
  last = false,
}: {
  title: string;
  description: string;
  children:
  ReactNode;
  last?: boolean;
}) {
  return (
    <section
      className={
        last
          ? "pt-6"
          : "border-b border-[#E2EBEF] py-6"
      }
    >
      <h3 className="font-display text-base font-bold text-navy">
        {title}
      </h3>

      <p className="mt-1 text-xs leading-5 text-[#8A99A5]">
        {
          description
        }
      </p>

      <div className="mt-4 space-y-4">
        {children}
      </div>
    </section>
  );
}

function ConsultationField({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string;
  value: string;

  onChange: (
    value: string
  ) => void;

  required?: boolean;
}) {
  return (
    <label className="block text-sm font-semibold text-navy">
      {label}

      {required && (
        <span className="ml-1 text-teal">
          *
        </span>
      )}

      <textarea
        className="field mt-2 min-h-16 resize-y"
        value={
          value
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
      />
    </label>
  );
}

function DoctorInitials({
  initials,
}: {
  initials:
  string;
}) {
  return (
    <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-[#EAF8FA] font-display text-lg font-bold text-teal">
      {initials}
    </div>
  );
}

function DashboardStat({
  icon,
  label,
  value,
}: {
  icon:
  ReactNode;
  label:
  string;
  value:
  number;
}) {
  return (
    <div className="card p-5">
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#EAF8FA] text-teal">
        {icon}
      </div>

      <p className="mt-4 text-sm text-[#647583]">
        {label}
      </p>

      <p className="mt-1 font-display text-2xl font-bold text-navy">
        {value}
      </p>
    </div>
  );
}
