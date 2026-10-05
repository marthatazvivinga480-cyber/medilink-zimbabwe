import {
  FormEvent,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Activity,
  CalendarDays,
  Check,
  ChevronDown,
  Eye,
  KeyRound,
  Pencil,
  Power,
  RefreshCw,
  Search,
  ShieldCheck,
  Stethoscope,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import { Link } from "react-router-dom";

import { api } from "../services/api";
import { Doctor } from "../types";

type DoctorForm = {
  name: string;
  email: string;
  password: string;
  phone: string;
  speciality: string;
  qualifications: string;
  biography: string;
  location: string;
  registrationInfo: string;
  photoUrl: string;
  facility: string;
  languages: string;
  yearsOfExperience: string;
  areasOfCare: string;
  consultationTypes: string;
  isVerified: boolean;
};

type AdminStats = {
  doctors: number;
  patients: number;
  appointments: number;
  activeDoctors: number;
  verifiedDoctors: number;
};

type AdminDoctor = Omit<
  Doctor,
  "userId"
> & {
  userId: Doctor["userId"] & {
    isActive?: boolean;
  };
};

type VerificationFilter =
  | "all"
  | "verified"
  | "pending";

type AccountFilter =
  | "all"
  | "active"
  | "inactive";

type FilterOption = {
  value: string;
  label: string;
};

type AddDoctorMode =
  | "new"
  | "existing";

const defaultDoctorPhotoUrls: Record<
  string,
  string
> = {
  "Melody Tom":
    "/images/doctors/melody-tom.png",
};

const emptyDoctorForm: DoctorForm = {
  name: "",
  email: "",
  password: "",
  phone: "",
  speciality: "",
  qualifications: "",
  biography: "",
  location: "",
  registrationInfo: "",
  photoUrl: "",
  facility: "",
  languages: "",
  yearsOfExperience: "0",
  areasOfCare: "",
  consultationTypes: "In-person",
  isVerified: true,
};

const emptyStats: AdminStats = {
  doctors: 0,
  patients: 0,
  appointments: 0,
  activeDoctors: 0,
  verifiedDoctors: 0,
};

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function doctorToForm(
  doctor: AdminDoctor
): DoctorForm {
  const doctorName =
    doctor.userId?.name ?? "";

  const savedPhotoUrl =
    doctor.photoUrl?.trim();

  return {
    name: doctorName,

    email:
      doctor.userId?.email ?? "",

    password: "",

    phone:
      doctor.userId?.phone ?? "",

    speciality:
      doctor.speciality ?? "",

    qualifications: (
      doctor.qualifications ?? []
    ).join(", "),

    biography:
      doctor.biography ?? "",

    location:
      doctor.location ?? "",

    registrationInfo:
      doctor.registrationInfo ?? "",

    photoUrl:
      savedPhotoUrl ||
      defaultDoctorPhotoUrls[
        doctorName
      ] ||
      "",

    facility:
      doctor.facility ?? "",

    languages: (
      doctor.languages ?? []
    ).join(", "),

    yearsOfExperience: String(
      doctor.yearsOfExperience ?? 0
    ),

    areasOfCare: (
      doctor.areasOfCare ?? []
    ).join(", "),

    consultationTypes: (
      doctor.consultationTypes ?? [
        "In-person",
      ]
    ).join(", "),

    isVerified:
      doctor.isVerified ?? false,
  };
}

export default function AdminDashboard() {
  const [doctors, setDoctors] =
    useState<AdminDoctor[]>([]);

  const [stats, setStats] =
    useState<AdminStats>(
      emptyStats
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    showAddDoctor,
    setShowAddDoctor,
  ] = useState(false);

  const [
    addDoctorMode,
    setAddDoctorMode,
  ] =
    useState<AddDoctorMode>(
      "new"
    );

  const [
    selectedExistingDoctorId,
    setSelectedExistingDoctorId,
  ] = useState("");

  const [
    doctorForm,
    setDoctorForm,
  ] = useState<DoctorForm>({
    ...emptyDoctorForm,
  });

  const [
    savingDoctor,
    setSavingDoctor,
  ] = useState(false);

  const [
    formError,
    setFormError,
  ] = useState("");

  const [
    editingDoctor,
    setEditingDoctor,
  ] =
    useState<AdminDoctor | null>(
      null
    );

  const [
    editForm,
    setEditForm,
  ] = useState<DoctorForm>({
    ...emptyDoctorForm,
  });

  const [
    savingEdit,
    setSavingEdit,
  ] = useState(false);

  const [
    editError,
    setEditError,
  ] = useState("");

  const [
    resetDoctor,
    setResetDoctor,
  ] =
    useState<AdminDoctor | null>(
      null
    );

  const [
    resetPassword,
    setResetPassword,
  ] = useState("");

  const [
    resetError,
    setResetError,
  ] = useState("");

  const [
    resettingPassword,
    setResettingPassword,
  ] = useState(false);

  const [
    statusDoctorId,
    setStatusDoctorId,
  ] =
    useState<string | null>(
      null
    );

  const [search, setSearch] =
    useState("");

  const [
    specialityFilter,
    setSpecialityFilter,
  ] = useState("all");

  const [
    locationFilter,
    setLocationFilter,
  ] = useState("all");

  const [
    verificationFilter,
    setVerificationFilter,
  ] =
    useState<VerificationFilter>(
      "all"
    );

  const [
    accountFilter,
    setAccountFilter,
  ] =
    useState<AccountFilter>(
      "all"
    );

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const [
        doctorsResponse,
        statsResponse,
      ] = await Promise.all([
        api.get("/admin/doctors"),
        api.get("/admin/stats"),
      ]);

      setDoctors(
        doctorsResponse.data
          .doctors ?? []
      );

      setStats(
        statsResponse.data.stats ??
          emptyStats
      );
    } catch (error: any) {
      setError(
        error.response?.data
          ?.message ||
          "Unable to load admin dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const anyModalOpen =
    showAddDoctor ||
    Boolean(editingDoctor) ||
    Boolean(resetDoctor);

  useEffect(() => {
    if (!anyModalOpen) {
      document.body.style.overflow =
        "";

      document.body.style.paddingRight =
        "";

      return;
    }

    const scrollbarWidth =
      window.innerWidth -
      document.documentElement
        .clientWidth;

    document.body.style.overflow =
      "hidden";

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight =
        `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow =
        "";

      document.body.style.paddingRight =
        "";
    };
  }, [anyModalOpen]);

  const specialities =
    useMemo(() => {
      return Array.from(
        new Set(
          doctors
            .map((doctor) =>
              doctor.speciality?.trim()
            )
            .filter(
              Boolean
            ) as string[]
        )
      ).sort();
    }, [doctors]);

  const locations =
    useMemo(() => {
      return Array.from(
        new Set(
          doctors
            .map((doctor) =>
              doctor.location?.trim()
            )
            .filter(
              Boolean
            ) as string[]
        )
      ).sort();
    }, [doctors]);

  const filteredDoctors =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return doctors.filter(
        (doctor) => {
          const name =
            doctor.userId?.name
              ?.toLowerCase() ??
            "";

          const email =
            doctor.userId?.email
              ?.toLowerCase() ??
            "";

          const speciality =
            doctor.speciality
              ?.toLowerCase() ??
            "";

          const facility =
            doctor.facility
              ?.toLowerCase() ??
            "";

          const location =
            doctor.location
              ?.toLowerCase() ??
            "";

          const matchesSearch =
            !query ||
            name.includes(query) ||
            email.includes(
              query
            ) ||
            speciality.includes(
              query
            ) ||
            facility.includes(
              query
            ) ||
            location.includes(
              query
            );

          const matchesSpeciality =
            specialityFilter ===
              "all" ||
            doctor.speciality ===
              specialityFilter;

          const matchesLocation =
            locationFilter ===
              "all" ||
            doctor.location ===
              locationFilter;

          const matchesVerification =
            verificationFilter ===
              "all" ||
            (verificationFilter ===
              "verified" &&
              doctor.isVerified ===
                true) ||
            (verificationFilter ===
              "pending" &&
              doctor.isVerified !==
                true);

          const isActive =
            doctor.userId
              ?.isActive !== false;

          const matchesAccount =
            accountFilter ===
              "all" ||
            (accountFilter ===
              "active" &&
              isActive) ||
            (accountFilter ===
              "inactive" &&
              !isActive);

          return (
            matchesSearch &&
            matchesSpeciality &&
            matchesLocation &&
            matchesVerification &&
            matchesAccount
          );
        }
      );
    }, [
      doctors,
      search,
      specialityFilter,
      locationFilter,
      verificationFilter,
      accountFilter,
    ]);

  function updateDoctorField<
    K extends keyof DoctorForm
  >(
    field: K,
    value: DoctorForm[K]
  ) {
    setDoctorForm(
      (current) => ({
        ...current,
        [field]: value,
      })
    );
  }

  function updateEditField<
    K extends keyof DoctorForm
  >(
    field: K,
    value: DoctorForm[K]
  ) {
    setEditForm(
      (current) => ({
        ...current,
        [field]: value,
      })
    );
  }

  function openAddDoctor() {
    setAddDoctorMode(
      "new"
    );

    setSelectedExistingDoctorId(
      ""
    );

    setDoctorForm({
      ...emptyDoctorForm,
    });

    setFormError("");

    setSuccessMessage("");

    setShowAddDoctor(true);
  }

  function closeAddDoctor() {
    if (savingDoctor) {
      return;
    }

    setShowAddDoctor(false);

    setAddDoctorMode(
      "new"
    );

    setSelectedExistingDoctorId(
      ""
    );

    setDoctorForm({
      ...emptyDoctorForm,
    });

    setFormError("");
  }

  function changeAddDoctorMode(
    mode: AddDoctorMode
  ) {
    setAddDoctorMode(mode);

    setSelectedExistingDoctorId(
      ""
    );

    setDoctorForm({
      ...emptyDoctorForm,
    });

    setFormError("");
  }

  function selectExistingDoctor(
    doctorId: string
  ) {
    setSelectedExistingDoctorId(
      doctorId
    );

    setFormError("");

    if (!doctorId) {
      setDoctorForm({
        ...emptyDoctorForm,
      });

      return;
    }

    const doctor =
      doctors.find(
        (item) =>
          item._id === doctorId
      );

    if (!doctor) {
      setDoctorForm({
        ...emptyDoctorForm,
      });

      setFormError(
        "The selected doctor profile could not be found."
      );

      return;
    }

    setDoctorForm({
      ...doctorToForm(doctor),
      password: "",
    });
  }

  function openEditDoctor(
    doctor: AdminDoctor
  ) {
    setEditingDoctor(doctor);

    setEditForm(
      doctorToForm(doctor)
    );

    setEditError("");

    setSuccessMessage("");
  }

  function closeEditDoctor() {
    if (savingEdit) {
      return;
    }

    setEditingDoctor(null);

    setEditError("");
  }

  function openResetPassword(
    doctor: AdminDoctor
  ) {
    setResetDoctor(doctor);

    setResetPassword("");

    setResetError("");

    setSuccessMessage("");
  }

  function closeResetPassword() {
    if (resettingPassword) {
      return;
    }

    setResetDoctor(null);

    setResetPassword("");

    setResetError("");
  }

  function validateDoctorForm(
    form: DoctorForm,
    requirePassword: boolean
  ) {
    const name =
      form.name.trim();

    const email =
      form.email
        .trim()
        .toLowerCase();

    const speciality =
      form.speciality.trim();

    const yearsOfExperience =
      Number(
        form.yearsOfExperience
      );

    if (!name) {
      return "Doctor name is required.";
    }

    if (!email) {
      return "Doctor email is required.";
    }

    if (
      requirePassword &&
      form.password.length < 8
    ) {
      return "Temporary password must be at least 8 characters.";
    }

    if (!speciality) {
      return "Doctor speciality is required.";
    }

    if (
      !Number.isInteger(
        yearsOfExperience
      ) ||
      yearsOfExperience < 0
    ) {
      return "Years of experience must be zero or a positive whole number.";
    }

    return "";
  }

  function doctorPayload(
    form: DoctorForm
  ) {
    return {
      name:
        form.name.trim(),

      email:
        form.email
          .trim()
          .toLowerCase(),

      phone:
        form.phone.trim(),

      speciality:
        form.speciality.trim(),

      qualifications:
        splitList(
          form.qualifications
        ),

      biography:
        form.biography.trim(),

      location:
        form.location.trim(),

      registrationInfo:
        form.registrationInfo.trim(),

      photoUrl:
        form.photoUrl.trim(),

      facility:
        form.facility.trim(),

      languages:
        splitList(
          form.languages
        ),

      yearsOfExperience:
        Number(
          form.yearsOfExperience
        ),

      areasOfCare:
        splitList(
          form.areasOfCare
        ),

      consultationTypes:
        splitList(
          form.consultationTypes
        ),

      isVerified:
        form.isVerified,
    };
  }

  async function createDoctor(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setFormError("");

    setSuccessMessage("");

    if (
      addDoctorMode ===
        "existing" &&
      !selectedExistingDoctorId
    ) {
      setFormError(
        "Select an existing doctor profile before creating the login account."
      );

      return;
    }

    const validationError =
      validateDoctorForm(
        doctorForm,
        true
      );

    if (validationError) {
      setFormError(
        validationError
      );

      return;
    }

    try {
      setSavingDoctor(true);

      await api.post(
        "/admin/doctors",
        {
          ...doctorPayload(
            doctorForm
          ),

          password:
            doctorForm.password,

          ...(addDoctorMode ===
            "existing"
            ? {
                existingDoctorId:
                  selectedExistingDoctorId,
              }
            : {}),
        }
      );

      const name =
        doctorForm.name.trim();

      const linkedExistingProfile =
        addDoctorMode ===
        "existing";

      setDoctorForm({
        ...emptyDoctorForm,
      });

      setSelectedExistingDoctorId(
        ""
      );

      setAddDoctorMode(
        "new"
      );

      setShowAddDoctor(false);

      setSuccessMessage(
        linkedExistingProfile
          ? `Login account for ${name} was linked to the existing doctor profile successfully.`
          : `Doctor account for ${name} was created successfully.`
      );

      await loadDashboard();
    } catch (error: any) {
      setFormError(
        error.response?.data
          ?.message ||
          "Unable to create doctor account."
      );
    } finally {
      setSavingDoctor(false);
    }
  }

  async function saveDoctorEdit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!editingDoctor) {
      return;
    }

    setEditError("");

    setSuccessMessage("");

    const validationError =
      validateDoctorForm(
        editForm,
        false
      );

    if (validationError) {
      setEditError(
        validationError
      );

      return;
    }

    try {
      setSavingEdit(true);

      await api.put(
        `/admin/doctors/${editingDoctor._id}`,
        doctorPayload(
          editForm
        )
      );

      const name =
        editForm.name.trim();

      setEditingDoctor(null);

      setSuccessMessage(
        `${name}'s doctor profile was updated successfully.`
      );

      await loadDashboard();
    } catch (error: any) {
      setEditError(
        error.response?.data
          ?.message ||
          "Unable to update doctor."
      );
    } finally {
      setSavingEdit(false);
    }
  }

  async function submitPasswordReset(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!resetDoctor) {
      return;
    }

    setResetError("");

    if (
      resetPassword.length < 8
    ) {
      setResetError(
        "Password must be at least 8 characters."
      );

      return;
    }

    try {
      setResettingPassword(
        true
      );

      await api.post(
        `/admin/doctors/${resetDoctor._id}/reset-password`,
        {
          password:
            resetPassword,
        }
      );

      const name =
        resetDoctor.userId
          ?.name ?? "Doctor";

      setResetDoctor(null);

      setResetPassword("");

      setSuccessMessage(
        `Password reset successfully for ${name}.`
      );
    } catch (error: any) {
      setResetError(
        error.response?.data
          ?.message ||
          "Unable to reset doctor password."
      );
    } finally {
      setResettingPassword(
        false
      );
    }
  }

  async function toggleDoctorStatus(
    doctor: AdminDoctor
  ) {
    const currentlyActive =
      doctor.userId
        ?.isActive !== false;

    const doctorName =
      doctor.userId?.name ??
      "this doctor";

    const action =
      currentlyActive
        ? "deactivate"
        : "reactivate";

    const confirmed =
      window.confirm(
        `Are you sure you want to ${action} ${doctorName}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setStatusDoctorId(
        doctor._id
      );

      setSuccessMessage("");

      await api.patch(
        `/admin/doctors/${doctor._id}/status`,
        {
          isActive:
            !currentlyActive,
        }
      );

      setSuccessMessage(
        currentlyActive
          ? `${doctorName}'s account was deactivated.`
          : `${doctorName}'s account was reactivated.`
      );

      await loadDashboard();
    } catch (error: any) {
      setError(
        error.response?.data
          ?.message ||
          "Unable to update doctor account status."
      );
    } finally {
      setStatusDoctorId(null);
    }
  }

  function clearFilters() {
    setSearch("");

    setSpecialityFilter(
      "all"
    );

    setLocationFilter(
      "all"
    );

    setVerificationFilter(
      "all"
    );

    setAccountFilter(
      "all"
    );
  }

  return (
    <main className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#F5FAFB]">
      <section className="mx-auto w-full max-w-7xl px-5 py-10 lg:px-8">
        <div className="flex min-w-0 flex-col gap-5 border-b border-[#DDE8EA] pb-8 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-teal">
              Administration
            </p>

            <h1 className="mt-2 break-words font-display text-3xl font-extrabold text-navy md:text-4xl">
              MediLink Admin
              Dashboard
            </h1>

            <p className="mt-3 max-w-2xl text-[#647583]">
              Manage doctors,
              clinical accounts and
              core MediLink
              operations from one
              secure workspace.
            </p>
          </div>

          <button
            type="button"
            onClick={
              openAddDoctor
            }
            className="btn-primary inline-flex shrink-0 items-center justify-center gap-2"
          >
            <UserPlus size={18} />

            Add doctor
          </button>
        </div>

        {successMessage && (
          <div className="mt-6 flex min-w-0 items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <Check
              size={18}
              className="mt-0.5 shrink-0"
            />

            <p className="min-w-0 break-words">
              {successMessage}
            </p>
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="mt-8 grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            label="Doctors"
            value={
              stats.doctors
            }
            icon={
              <Stethoscope
                size={22}
              />
            }
          />

          <StatCard
            label="Patients"
            value={
              stats.patients
            }
            icon={
              <Users
                size={22}
              />
            }
          />

          <StatCard
            label="Appointments"
            value={
              stats.appointments
            }
            icon={
              <CalendarDays
                size={22}
              />
            }
          />

          <StatCard
            label="Active doctors"
            value={
              stats.activeDoctors
            }
            icon={
              <Activity
                size={22}
              />
            }
          />

          <StatCard
            label="Verified"
            value={
              stats.verifiedDoctors
            }
            icon={
              <ShieldCheck
                size={22}
              />
            }
          />
        </div>

        <section className="card relative z-10 mt-8 min-w-0 overflow-visible">
          <div className="rounded-t-2xl border-b border-[#E3ECEE] bg-white px-6 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="font-display text-xl font-bold text-navy">
                  Doctor accounts
                </h2>

                <p className="mt-1 text-sm text-[#647583]">
                  {
                    filteredDoctors.length
                  }{" "}
                  of {
                    doctors.length
                  }{" "}
                  doctors shown.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  loadDashboard
                }
                className="inline-flex items-center gap-2 self-start text-sm font-semibold text-teal transition hover:text-navy"
              >
                <RefreshCw
                  size={16}
                />

                Refresh
              </button>
            </div>

            <div className="relative z-30 mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <label className="relative md:col-span-2 xl:col-span-1">
                <Search
                  size={17}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#81909A]"
                />

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
                  className="field w-full pl-10"
                  autoComplete="off"
                  placeholder="Search doctors"
                />
              </label>

              <FilterSelect
                value={
                  specialityFilter
                }
                onChange={
                  setSpecialityFilter
                }
                ariaLabel="Filter doctors by speciality"
                options={[
                  {
                    value:
                      "all",

                    label:
                      "All specialities",
                  },

                  ...specialities.map(
                    (
                      speciality
                    ) => ({
                      value:
                        speciality,

                      label:
                        speciality,
                    })
                  ),
                ]}
              />

              <FilterSelect
                value={
                  locationFilter
                }
                onChange={
                  setLocationFilter
                }
                ariaLabel="Filter doctors by location"
                options={[
                  {
                    value:
                      "all",

                    label:
                      "All locations",
                  },

                  ...locations.map(
                    (
                      location
                    ) => ({
                      value:
                        location,

                      label:
                        location,
                    })
                  ),
                ]}
              />

              <FilterSelect
                value={
                  verificationFilter
                }
                onChange={(
                  value
                ) =>
                  setVerificationFilter(
                    value as VerificationFilter
                  )
                }
                ariaLabel="Filter doctors by verification status"
                options={[
                  {
                    value:
                      "all",

                    label:
                      "All verification",
                  },

                  {
                    value:
                      "verified",

                    label:
                      "Verified",
                  },

                  {
                    value:
                      "pending",

                    label:
                      "Pending",
                  },
                ]}
              />

              <FilterSelect
                value={
                  accountFilter
                }
                onChange={(
                  value
                ) =>
                  setAccountFilter(
                    value as AccountFilter
                  )
                }
                ariaLabel="Filter doctors by account status"
                options={[
                  {
                    value:
                      "all",

                    label:
                      "All accounts",
                  },

                  {
                    value:
                      "active",

                    label:
                      "Active",
                  },

                  {
                    value:
                      "inactive",

                    label:
                      "Inactive",
                  },
                ]}
              />
            </div>

            {(search ||
              specialityFilter !==
                "all" ||
              locationFilter !==
                "all" ||
              verificationFilter !==
                "all" ||
              accountFilter !==
                "all") && (
              <button
                type="button"
                onClick={
                  clearFilters
                }
                className="mt-3 text-sm font-semibold text-[#647583] transition hover:text-navy"
              >
                Clear filters
              </button>
            )}
          </div>

          <div className="relative z-0 overflow-hidden rounded-b-2xl bg-white">
            {loading ? (
              <div className="px-6 py-10 text-sm text-[#647583]">
                Loading doctor
                accounts...
              </div>
            ) : filteredDoctors.length ===
              0 ? (
              <div className="px-6 py-12 text-center">
                <p className="font-semibold text-navy">
                  No matching
                  doctors
                </p>

                <p className="mt-2 text-sm text-[#647583]">
                  Change your
                  search or filters
                  and try again.
                </p>
              </div>
            ) : (
              <div className="w-full max-w-full overflow-x-auto">
                <table className="w-full min-w-[1180px] border-collapse text-left">
                  <thead className="bg-[#F7FAFB] text-xs uppercase tracking-wide text-[#71808C]">
                    <tr>
                      <th className="px-6 py-4 font-semibold">
                        Doctor
                      </th>

                      <th className="px-6 py-4 font-semibold">
                        Speciality
                      </th>

                      <th className="px-6 py-4 font-semibold">
                        Facility
                      </th>

                      <th className="px-6 py-4 font-semibold">
                        Location
                      </th>

                      <th className="px-6 py-4 font-semibold">
                        Verification
                      </th>

                      <th className="px-6 py-4 font-semibold">
                        Account
                      </th>

                      <th className="px-6 py-4 text-right font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#E8EFF1]">
                    {filteredDoctors.map(
                      (
                        doctor
                      ) => {
                        const isActive =
                          doctor
                            .userId
                            ?.isActive !==
                          false;

                        return (
                          <tr
                            key={
                              doctor._id
                            }
                            className="bg-white transition hover:bg-[#FAFCFC]"
                          >
                            <td className="px-6 py-5">
                              <div className="min-w-0">
                                <p className="font-semibold text-navy">
                                  {doctor
                                    .userId
                                    ?.name ||
                                    "Doctor"}
                                </p>

                                <p className="mt-1 break-all text-sm text-[#70808C]">
                                  {doctor
                                    .userId
                                    ?.email ||
                                    "No email"}
                                </p>
                              </div>
                            </td>

                            <td className="px-6 py-5 text-sm text-[#43515C]">
                              {doctor.speciality ||
                                "Not specified"}
                            </td>

                            <td className="px-6 py-5 text-sm text-[#43515C]">
                              {doctor.facility ||
                                "Not specified"}
                            </td>

                            <td className="px-6 py-5 text-sm text-[#43515C]">
                              {doctor.location ||
                                "Not specified"}
                            </td>

                            <td className="px-6 py-5">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                  doctor.isVerified
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-amber-50 text-amber-700"
                                }`}
                              >
                                {doctor.isVerified
                                  ? "Verified"
                                  : "Pending"}
                              </span>
                            </td>

                            <td className="px-6 py-5">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                  isActive
                                    ? "bg-sky-50 text-sky-700"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {isActive
                                  ? "Active"
                                  : "Inactive"}
                              </span>
                            </td>

                            <td className="px-6 py-5">
                              <div className="flex items-center justify-end gap-2">
                                <Link
                                  to={`/doctors/${doctor._id}`}
                                  className="grid h-9 w-9 place-items-center rounded-lg border border-[#DDE7E9] text-[#526571] transition hover:border-teal hover:bg-[#F2FBFB] hover:text-teal"
                                  title="View public profile"
                                >
                                  <Eye
                                    size={
                                      16
                                    }
                                  />
                                </Link>

                                <button
                                  type="button"
                                  onClick={() =>
                                    openEditDoctor(
                                      doctor
                                    )
                                  }
                                  className="grid h-9 w-9 place-items-center rounded-lg border border-[#DDE7E9] text-[#526571] transition hover:border-teal hover:bg-[#F2FBFB] hover:text-teal"
                                  title="Edit doctor"
                                >
                                  <Pencil
                                    size={
                                      16
                                    }
                                  />
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    openResetPassword(
                                      doctor
                                    )
                                  }
                                  className="grid h-9 w-9 place-items-center rounded-lg border border-[#DDE7E9] text-[#526571] transition hover:border-teal hover:bg-[#F2FBFB] hover:text-teal"
                                  title="Reset password"
                                >
                                  <KeyRound
                                    size={
                                      16
                                    }
                                  />
                                </button>

                                <button
                                  type="button"
                                  disabled={
                                    statusDoctorId ===
                                    doctor._id
                                  }
                                  onClick={() =>
                                    toggleDoctorStatus(
                                      doctor
                                    )
                                  }
                                  className={`grid h-9 w-9 place-items-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                    isActive
                                      ? "border-[#F0D8D8] text-red-500 hover:bg-red-50"
                                      : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                                  }`}
                                  title={
                                    isActive
                                      ? "Deactivate doctor"
                                      : "Reactivate doctor"
                                  }
                                >
                                  <Power
                                    size={
                                      16
                                    }
                                  />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </section>

      {showAddDoctor && (
        <DoctorModal
          title="Add a new doctor"
          eyebrow="Doctor account"
          description="Create a brand-new doctor profile or link login credentials to an existing doctor profile."
          form={doctorForm}
          onFieldChange={
            updateDoctorField
          }
          onSubmit={
            createDoctor
          }
          onClose={
            closeAddDoctor
          }
          submitting={
            savingDoctor
          }
          error={
            formError
          }
          submitLabel={
            addDoctorMode ===
            "existing"
              ? "Link doctor login"
              : "Create doctor"
          }
          includePassword
          addMode={
            addDoctorMode
          }
          onAddModeChange={
            changeAddDoctorMode
          }
          existingDoctors={
            doctors
          }
          selectedExistingDoctorId={
            selectedExistingDoctorId
          }
          onExistingDoctorChange={
            selectExistingDoctor
          }
        />
      )}

      {editingDoctor && (
        <DoctorModal
          title="Edit doctor"
          eyebrow="Doctor profile"
          description="Update the doctor's account details and public professional profile."
          form={editForm}
          onFieldChange={
            updateEditField
          }
          onSubmit={
            saveDoctorEdit
          }
          onClose={
            closeEditDoctor
          }
          submitting={
            savingEdit
          }
          error={
            editError
          }
          submitLabel="Save changes"
          includePassword={
            false
          }
        />
      )}

      {resetDoctor && (
        <div className="fixed inset-0 z-50 overflow-x-hidden overflow-y-auto bg-[#071C2C]/45">
          <div className="flex min-h-full w-full items-center justify-center px-4 py-8">
            <form
              onSubmit={
                submitPasswordReset
              }
              autoComplete="off"
              className="w-full max-w-md overflow-hidden rounded-2xl border border-[#DCE7E9] bg-white shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4 border-b border-[#E2EBED] px-6 py-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal">
                    Account security
                  </p>

                  <h2 className="mt-1 font-display text-2xl font-bold text-navy">
                    Reset password
                  </h2>

                  <p className="mt-2 text-sm text-[#647583]">
                    Set a new
                    temporary password
                    for{" "}
                    {resetDoctor
                      .userId
                      ?.name ||
                      "this doctor"}
                    .
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    closeResetPassword
                  }
                  disabled={
                    resettingPassword
                  }
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[#DDE7E9] text-[#526571]"
                  aria-label="Close password reset"
                >
                  <X
                    size={18}
                  />
                </button>
              </div>

              <div className="px-6 py-6">
                <FormField
                  label="New temporary password"
                  required
                  hint="Minimum 8 characters."
                >
                  <input
                    className="field w-full"
                    type="password"
                    name="medilink-admin-reset-password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    value={
                      resetPassword
                    }
                    onChange={(
                      event
                    ) =>
                      setResetPassword(
                        event.target
                          .value
                      )
                    }
                    placeholder="Enter new temporary password"
                  />
                </FormField>

                {resetError && (
                  <div className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-600">
                    {
                      resetError
                    }
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 border-t border-[#E2EBED] bg-[#FBFCFC] px-6 py-5">
                <button
                  type="button"
                  onClick={
                    closeResetPassword
                  }
                  disabled={
                    resettingPassword
                  }
                  className="rounded-lg border border-[#D8E3E5] bg-white px-5 py-3 text-sm font-semibold text-navy"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    resettingPassword
                  }
                  className="btn-primary"
                >
                  {resettingPassword
                    ? "Resetting..."
                    : "Reset password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: string;

  onChange: (
    value: string
  ) => void;

  options: FilterOption[];

  ariaLabel: string;
}) {
  const [open, setOpen] =
    useState(false);

  const containerRef =
    useRef<HTMLDivElement>(
      null
    );

  const selectedOption =
    options.find(
      (option) =>
        option.value === value
    ) ?? options[0];

  useEffect(() => {
    function handleOutsideClick(
      event: MouseEvent
    ) {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target as Node
        )
      ) {
        setOpen(false);
      }
    }

    function handleEscape(
      event: KeyboardEvent
    ) {
      if (
        event.key === "Escape"
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );

      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);

  function selectOption(
    option: FilterOption
  ) {
    onChange(
      option.value
    );

    setOpen(false);
  }

  return (
    <div
      ref={
        containerRef
      }
      className="relative min-w-0"
    >
      <button
        type="button"
        aria-label={
          ariaLabel
        }
        aria-haspopup="listbox"
        aria-expanded={
          open
        }
        onClick={() =>
          setOpen(
            (current) =>
              !current
          )
        }
        className={`flex w-full items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3 text-left text-sm text-navy outline-none transition ${
          open
            ? "border-teal ring-2 ring-teal/10"
            : "border-[#E2EBEF] hover:border-[#BCDADD]"
        }`}
      >
        <span className="min-w-0 truncate">
          {
            selectedOption?.label
          }
        </span>

        <ChevronDown
          size={
            17
          }
          className={`shrink-0 text-[#637682] transition-transform duration-200 ${
            open
              ? "rotate-180 text-teal"
              : ""
          }`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={
            ariaLabel
          }
          className="scrollbar-hide absolute left-0 right-0 top-full z-[100] mt-2 max-h-64 overflow-y-auto rounded-xl border border-[#D9E7E9] bg-white p-1.5 shadow-[0_14px_35px_rgba(11,41,69,0.14)]"
        >
          {options.map(
            (
              option
            ) => {
              const selected =
                option.value ===
                value;

              return (
                <button
                  key={
                    option.value
                  }
                  type="button"
                  role="option"
                  aria-selected={
                    selected
                  }
                  onClick={() =>
                    selectOption(
                      option
                    )
                  }
                  className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                    selected
                      ? "bg-[#EAF7F7] font-semibold text-teal"
                      : "text-navy hover:bg-[#F3F8F9]"
                  }`}
                >
                  <span className="min-w-0 truncate">
                    {
                      option.label
                    }
                  </span>

                  {selected && (
                    <Check
                      size={
                        16
                      }
                      className="shrink-0 text-teal"
                    />
                  )}
                </button>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}

function DoctorModal({
  title,
  eyebrow,
  description,
  form,
  onFieldChange,
  onSubmit,
  onClose,
  submitting,
  error,
  submitLabel,
  includePassword,
  addMode,
  onAddModeChange,
  existingDoctors = [],
  selectedExistingDoctorId = "",
  onExistingDoctorChange,
}: {
  title: string;

  eyebrow: string;

  description: string;

  form: DoctorForm;

  onFieldChange: <
    K extends keyof DoctorForm
  >(
    field: K,
    value: DoctorForm[K]
  ) => void;

  onSubmit: (
    event: FormEvent<HTMLFormElement>
  ) => void;

  onClose: () => void;

  submitting: boolean;

  error: string;

  submitLabel: string;

  includePassword: boolean;

  addMode?: AddDoctorMode;

  onAddModeChange?: (
    mode: AddDoctorMode
  ) => void;

  existingDoctors?: AdminDoctor[];

  selectedExistingDoctorId?: string;

  onExistingDoctorChange?: (
    doctorId: string
  ) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 overflow-x-hidden overflow-y-auto bg-[#071C2C]/45">
      <div className="flex min-h-full w-full items-start justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-4xl min-w-0">
          <form
            onSubmit={
              onSubmit
            }
            autoComplete="off"
            className="w-full min-w-0 overflow-hidden rounded-2xl border border-[#DCE7E9] bg-white shadow-2xl"
          >
            <div className="flex min-w-0 items-start justify-between gap-4 border-b border-[#E2EBED] px-6 py-5">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal">
                  {
                    eyebrow
                  }
                </p>

                <h2 className="mt-1 break-words font-display text-2xl font-bold text-navy">
                  {
                    title
                  }
                </h2>

                <p className="mt-2 text-sm text-[#647583]">
                  {
                    description
                  }
                </p>
              </div>

              <button
                type="button"
                onClick={
                  onClose
                }
                disabled={
                  submitting
                }
                className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[#DDE7E9] text-[#526571] transition hover:bg-[#F5F8F9] disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close form"
              >
                <X
                  size={
                    19
                  }
                />
              </button>
            </div>

            {addMode &&
              onAddModeChange &&
              onExistingDoctorChange && (
                <div className="border-b border-[#E2EBED] bg-[#FBFCFC] px-6 py-5">
                  <p className="text-sm font-semibold text-navy">
                    What would you like to do?
                  </p>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      disabled={
                        submitting
                      }
                      onClick={() =>
                        onAddModeChange(
                          "new"
                        )
                      }
                      className={`rounded-xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        addMode ===
                        "new"
                          ? "border-teal bg-[#F2FBFB] ring-2 ring-teal/10"
                          : "border-[#DDE7E9] bg-white hover:border-[#BCDADD]"
                      }`}
                    >
                      <span className="block text-sm font-semibold text-navy">
                        Brand-new doctor
                      </span>

                      <span className="mt-1 block text-xs leading-5 text-[#6C7D88]">
                        Create a new login account and a new public doctor profile.
                      </span>
                    </button>

                    <button
                      type="button"
                      disabled={
                        submitting
                      }
                      onClick={() =>
                        onAddModeChange(
                          "existing"
                        )
                      }
                      className={`rounded-xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        addMode ===
                        "existing"
                          ? "border-teal bg-[#F2FBFB] ring-2 ring-teal/10"
                          : "border-[#DDE7E9] bg-white hover:border-[#BCDADD]"
                      }`}
                    >
                      <span className="block text-sm font-semibold text-navy">
                        Existing doctor profile
                      </span>

                      <span className="mt-1 block text-xs leading-5 text-[#6C7D88]">
                        Link login credentials without creating another doctor profile.
                      </span>
                    </button>
                  </div>

                  {addMode ===
                    "existing" && (
                    <div className="mt-4">
                      <p className="mb-2 text-sm font-semibold text-navy">
                        Select existing doctor
                      </p>

                      <FilterSelect
                        value={
                          selectedExistingDoctorId
                        }
                        onChange={
                          onExistingDoctorChange
                        }
                        ariaLabel="Select an existing doctor profile"
                        options={[
                          {
                            value:
                              "",

                            label:
                              "Select a doctor profile",
                          },

                          ...existingDoctors.map(
                            (
                              doctor
                            ) => {
                              const name =
                                doctor
                                  .userId
                                  ?.name ||
                                "Doctor";

                              const speciality =
                                doctor.speciality ||
                                "Speciality not set";

                              const location =
                                doctor.location ||
                                "Location not set";

                              return {
                                value:
                                  doctor._id,

                                label:
                                  `${name} — ${speciality} — ${location}`,
                              };
                            }
                          ),
                        ]}
                      />

                      <p className="mt-2 text-xs leading-5 text-[#6C7D88]">
                        Selecting an existing profile keeps the same Doctor ID, appointments and history. The profile details below are loaded from that doctor.
                      </p>
                    </div>
                  )}
                </div>
              )}

            <div className="grid min-w-0 gap-5 px-6 py-6 md:grid-cols-2">
              <FormField
                label="Full name"
                required
              >
                <input
                  className="field w-full min-w-0"
                  type="text"
                  name="medilink-doctor-full-name"
                  autoComplete="off"
                  required
                  value={
                    form.name
                  }
                  onChange={(
                    event
                  ) =>
                    onFieldChange(
                      "name",
                      event.target
                        .value
                    )
                  }
                  placeholder="Dr. Firstname Surname"
                />
              </FormField>

              <FormField label="Phone number">
                <input
                  className="field w-full min-w-0"
                  type="tel"
                  name="medilink-doctor-phone"
                  autoComplete="off"
                  value={
                    form.phone
                  }
                  onChange={(
                    event
                  ) =>
                    onFieldChange(
                      "phone",
                      event.target
                        .value
                    )
                  }
                  placeholder="+263..."
                />
              </FormField>

              <FormField
                label="Email"
                required
              >
                <input
                  className="field w-full min-w-0"
                  type="email"
                  name="medilink-doctor-email"
                  autoComplete="off"
                  required
                  value={
                    form.email
                  }
                  onChange={(
                    event
                  ) =>
                    onFieldChange(
                      "email",
                      event.target
                        .value
                    )
                  }
                  placeholder="doctor@medilink.co.zw"
                />
              </FormField>

              {includePassword ? (
                <FormField
                  label="Temporary password"
                  required
                  hint="Minimum 8 characters."
                >
                  <input
                    className="field w-full min-w-0"
                    type="password"
                    name="medilink-doctor-temporary-password"
                    autoComplete="new-password"
                    minLength={
                      8
                    }
                    required
                    value={
                      form.password
                    }
                    onChange={(
                      event
                    ) =>
                      onFieldChange(
                        "password",
                        event.target
                          .value
                      )
                    }
                    placeholder="Create a temporary password"
                  />
                </FormField>
              ) : (
                <FormField
                  label="Account password"
                  hint="Use Reset Password from the Actions column to change this doctor's password."
                >
                  <input
                    className="field w-full min-w-0 bg-[#F5F7F8]"
                    type="text"
                    name="medilink-managed-password"
                    autoComplete="off"
                    value="Password managed separately"
                    readOnly
                  />
                </FormField>
              )}

              <FormField
                label="Speciality"
                required
              >
                <input
                  className="field w-full min-w-0"
                  type="text"
                  name="medilink-doctor-speciality"
                  autoComplete="off"
                  required
                  value={
                    form.speciality
                  }
                  onChange={(
                    event
                  ) =>
                    onFieldChange(
                      "speciality",
                      event.target
                        .value
                    )
                  }
                  placeholder="General Practice"
                />
              </FormField>

              <FormField label="Years of experience">
                <input
                  className="field w-full min-w-0"
                  type="number"
                  name="medilink-doctor-years-experience"
                  autoComplete="off"
                  min="0"
                  step="1"
                  value={
                    form.yearsOfExperience
                  }
                  onChange={(
                    event
                  ) =>
                    onFieldChange(
                      "yearsOfExperience",
                      event.target
                        .value
                    )
                  }
                />
              </FormField>

              <FormField label="Facility">
                <input
                  className="field w-full min-w-0"
                  type="text"
                  name="medilink-doctor-facility"
                  autoComplete="off"
                  value={
                    form.facility
                  }
                  onChange={(
                    event
                  ) =>
                    onFieldChange(
                      "facility",
                      event.target
                        .value
                    )
                  }
                  placeholder="MediLink Medical Centre"
                />
              </FormField>

              <FormField label="Location">
                <input
                  className="field w-full min-w-0"
                  type="text"
                  name="medilink-doctor-location"
                  autoComplete="off"
                  value={
                    form.location
                  }
                  onChange={(
                    event
                  ) =>
                    onFieldChange(
                      "location",
                      event.target
                        .value
                    )
                  }
                  placeholder="Harare, Zimbabwe"
                />
              </FormField>

              <FormField
                label="Registration information"
                hint="Professional registration number or relevant registration details."
              >
                <input
                  className="field w-full min-w-0"
                  type="text"
                  name="medilink-doctor-registration"
                  autoComplete="off"
                  value={
                    form.registrationInfo
                  }
                  onChange={(
                    event
                  ) =>
                    onFieldChange(
                      "registrationInfo",
                      event.target
                        .value
                    )
                  }
                  placeholder="Registration details"
                />
              </FormField>

              <FormField
                label="Qualifications"
                hint="Separate multiple qualifications with commas."
              >
                <input
                  className="field w-full min-w-0"
                  type="text"
                  name="medilink-doctor-qualifications"
                  autoComplete="off"
                  value={
                    form.qualifications
                  }
                  onChange={(
                    event
                  ) =>
                    onFieldChange(
                      "qualifications",
                      event.target
                        .value
                    )
                  }
                  placeholder="MBChB, MMed"
                />
              </FormField>

              <FormField
                label="Languages"
                hint="Separate multiple languages with commas."
              >
                <input
                  className="field w-full min-w-0"
                  type="text"
                  name="medilink-doctor-languages"
                  autoComplete="off"
                  value={
                    form.languages
                  }
                  onChange={(
                    event
                  ) =>
                    onFieldChange(
                      "languages",
                      event.target
                        .value
                    )
                  }
                  placeholder="English, Shona"
                />
              </FormField>

              <FormField
                label="Consultation types"
                hint="Separate multiple consultation types with commas."
              >
                <input
                  className="field w-full min-w-0"
                  type="text"
                  name="medilink-doctor-consultation-types"
                  autoComplete="off"
                  value={
                    form.consultationTypes
                  }
                  onChange={(
                    event
                  ) =>
                    onFieldChange(
                      "consultationTypes",
                      event.target
                        .value
                    )
                  }
                  placeholder="In-person, Virtual"
                />
              </FormField>

              <div className="min-w-0 md:col-span-2">
                <FormField label="Biography">
                  <textarea
                    className="field min-h-28 w-full min-w-0 resize-y"
                    name="medilink-doctor-biography"
                    autoComplete="off"
                    value={
                      form.biography
                    }
                    onChange={(
                      event
                    ) =>
                      onFieldChange(
                        "biography",
                        event.target
                          .value
                      )
                    }
                    placeholder="Short professional biography shown to patients."
                  />
                </FormField>
              </div>

              <div className="min-w-0 md:col-span-2">
                <FormField
                  label="Areas of care"
                  hint="Separate multiple areas of care with commas."
                >
                  <input
                    className="field w-full min-w-0"
                    type="text"
                    name="medilink-doctor-areas-of-care"
                    autoComplete="off"
                    value={
                      form.areasOfCare
                    }
                    onChange={(
                      event
                    ) =>
                      onFieldChange(
                        "areasOfCare",
                        event.target
                          .value
                      )
                    }
                    placeholder="General consultations, Hypertension monitoring, Preventive care"
                  />
                </FormField>
              </div>

              <div className="min-w-0 md:col-span-2">
                <FormField
                  label="Profile photo URL"
                  hint="Images in client/public are referenced from /, for example /images/doctors/melody-tom.png."
                >
                  <input
                    className="field w-full min-w-0"
                    type="text"
                    name="medilink-doctor-photo-url"
                    autoComplete="off"
                    value={
                      form.photoUrl
                    }
                    onChange={(
                      event
                    ) =>
                      onFieldChange(
                        "photoUrl",
                        event.target
                          .value
                      )
                    }
                    placeholder="/images/doctors/melody-tom.png"
                  />
                </FormField>
              </div>

              <div className="min-w-0 md:col-span-2">
                <label className="flex min-w-0 cursor-pointer items-start gap-3 rounded-xl border border-[#DDE7E9] bg-[#F8FBFB] p-4">
                  <input
                    type="checkbox"
                    checked={
                      form.isVerified
                    }
                    onChange={(
                      event
                    ) =>
                      onFieldChange(
                        "isVerified",
                        event.target
                          .checked
                      )
                    }
                    className="mt-1 h-4 w-4 shrink-0 accent-[#0FA8B8]"
                  />

                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-navy">
                      Verified doctor
                    </span>

                    <span className="mt-1 block text-sm text-[#6C7D88]">
                      Mark this
                      profile as
                      verified only
                      after the
                      doctor's details
                      have been
                      reviewed.
                    </span>
                  </span>
                </label>
              </div>
            </div>

            {error && (
              <div className="mx-6 mb-5 break-words rounded-lg bg-red-50 p-4 text-sm text-red-600">
                {
                  error
                }
              </div>
            )}

            <div className="flex flex-col-reverse gap-3 border-t border-[#E2EBED] bg-[#FBFCFC] px-6 py-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={
                  onClose
                }
                disabled={
                  submitting
                }
                className="rounded-lg border border-[#D8E3E5] bg-white px-5 py-3 text-sm font-semibold text-navy transition hover:bg-[#F4F7F8] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  submitting
                }
                className="btn-primary min-w-36"
              >
                {submitting
                  ? "Saving..."
                  : submitLabel}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;

  value:
    | string
    | number;

  icon: ReactNode;
}) {
  return (
    <div className="card min-w-0 p-5">
      <div className="flex min-w-0 items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#6B7C87]">
            {
              label
            }
          </p>

          <p className="mt-2 break-words font-display text-2xl font-bold text-navy">
            {
              value
            }
          </p>
        </div>

        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#EAF7F7] text-teal">
          {
            icon
          }
        </div>
      </div>
    </div>
  );
}

function FormField({
  label,
  required = false,
  hint,
  children,
}: {
  label: string;

  required?: boolean;

  hint?: string;

  children: ReactNode;
}) {
  return (
    <label className="block min-w-0">
      <span className="text-sm font-semibold text-navy">
        {
          label
        }

        {required && (
          <span className="ml-1 text-teal">
            *
          </span>
        )}
      </span>

      <div className="mt-2 min-w-0">
        {
          children
        }
      </div>

      {hint && (
        <span className="mt-1.5 block break-words text-xs leading-5 text-[#87949D]">
          {
            hint
          }
        </span>
      )}
    </label>
  );
}