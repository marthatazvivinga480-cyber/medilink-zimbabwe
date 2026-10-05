import {
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  HeartPulse,
  Languages,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

type EmergencyContact = {
  name: string;
  phone: string;
  relationship: string;
};

type PatientProfileForm = {
  name: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  preferredLanguage: string;
  emergencyContact: EmergencyContact;
};

type PatientClinicalInfo = {
  bloodGroup: string;
  allergies: string[];
  existingConditions: string[];
};

const emptyForm: PatientProfileForm = {
  name: "",
  phone: "",
  dateOfBirth: "",
  address: "",
  preferredLanguage: "",
  emergencyContact: {
    name: "",
    phone: "",
    relationship: "",
  },
};

const emptyClinicalInfo: PatientClinicalInfo = {
  bloodGroup: "",
  allergies: [],
  existingConditions: [],
};

const relationshipOptions = [
  "Spouse",
  "Parent",
  "Sibling",
  "Child",
  "Guardian",
  "Friend",
  "Other",
];

function formatDateInput(
  value?: string | Date | null
) {
  if (!value) {
    return "";
  }

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date
    .toISOString()
    .slice(0, 10);
}

function RelationshipDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] =
    useState(false);

  const containerRef =
    useRef<HTMLDivElement | null>(
      null
    );

  useEffect(() => {
    function handleClickOutside(
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
      handleClickOutside
    );

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );

      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative"
    >
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() =>
          setOpen(
            (current) =>
              !current
          )
        }
        className={`flex w-full items-center justify-between rounded-xl border bg-white px-4 py-3 text-left text-sm outline-none transition ${
          open
            ? "border-teal ring-2 ring-teal/10"
            : "border-[#E2EBEF] hover:border-[#BFDDE1]"
        }`}
      >
        <span
          className={
            value
              ? "text-navy"
              : "text-[#8A99A5]"
          }
        >
          {value ||
            "Select relationship"}
        </span>

        <ChevronDown
          size={17}
          className={`shrink-0 text-[#647583] transition-transform duration-200 ${
            open
              ? "rotate-180 text-teal"
              : ""
          }`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-[#D9E7E9] bg-white p-1.5 shadow-[0_14px_35px_rgba(11,41,69,0.14)]"
        >
          <button
            type="button"
            role="option"
            aria-selected={
              value === ""
            }
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition ${
              value === ""
                ? "bg-[#EAF8FA] font-semibold text-teal"
                : "text-[#647583] hover:bg-[#F5FAFB] hover:text-navy"
            }`}
          >
            <span>
              Select relationship
            </span>

            {value === "" && (
              <Check
                size={16}
                className="text-teal"
              />
            )}
          </button>

          <div className="my-1 h-px bg-[#EDF3F4]" />

          {relationshipOptions.map(
            (option) => (
              <button
                type="button"
                role="option"
                aria-selected={
                  value ===
                  option
                }
                key={option}
                onClick={() => {
                  onChange(
                    option
                  );
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition ${
                  value ===
                  option
                    ? "bg-[#EAF8FA] font-semibold text-teal"
                    : "text-navy hover:bg-[#F5FAFB]"
                }`}
              >
                <span>
                  {option}
                </span>

                {value ===
                  option && (
                  <Check
                    size={16}
                    className="text-teal"
                  />
                )}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

export default function PatientProfile() {
  const { user } =
    useAuth();

  const [form, setForm] =
    useState<PatientProfileForm>(
      emptyForm
    );

  const [
    clinicalInfo,
    setClinicalInfo,
  ] =
    useState<PatientClinicalInfo>(
      emptyClinicalInfo
    );

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        setLoading(true);
        setError("");

        const { data } =
          await api.get(
            "/patients/me"
          );

        if (!mounted) {
          return;
        }

        setForm({
          name:
            data.user?.name ??
            "",

          phone:
            data.user?.phone ??
            "",

          dateOfBirth:
            formatDateInput(
              data.patient
                ?.dateOfBirth
            ),

          address:
            data.patient
              ?.address ?? "",

          preferredLanguage:
            data.patient
              ?.preferredLanguage ??
            "",

          emergencyContact: {
            name:
              data.patient
                ?.emergencyContact
                ?.name ?? "",

            phone:
              data.patient
                ?.emergencyContact
                ?.phone ?? "",

            relationship:
              data.patient
                ?.emergencyContact
                ?.relationship ?? "",
          },
        });

        setClinicalInfo({
          bloodGroup:
            data.patient
              ?.bloodGroup ?? "",

          allergies:
            data.patient
              ?.allergies ?? [],

          existingConditions:
            data.patient
              ?.existingConditions ??
            [],
        });
      } catch (error: any) {
        if (!mounted) {
          return;
        }

        setError(
          error.response?.data
            ?.message ||
            "Unable to load your profile."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  function updateField<
    K extends keyof PatientProfileForm
  >(
    field: K,
    value: PatientProfileForm[K]
  ) {
    setForm(
      (current) => ({
        ...current,
        [field]: value,
      })
    );
  }

  function updateEmergencyContact(
    field: keyof EmergencyContact,
    value: string
  ) {
    setForm(
      (current) => ({
        ...current,

        emergencyContact: {
          ...current.emergencyContact,
          [field]: value,
        },
      })
    );
  }

  async function saveProfile(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccessMessage("");

    if (
      form.name.trim().length <
      2
    ) {
      setError(
        "Please enter your full name."
      );

      return;
    }

    const emergencyName =
      form.emergencyContact.name.trim();

    const emergencyPhone =
      form.emergencyContact.phone.trim();

    const emergencyRelationship =
      form.emergencyContact.relationship.trim();

    if (
      emergencyPhone &&
      !emergencyName
    ) {
      setError(
        "Please enter the emergency contact's name when adding an emergency phone number."
      );

      return;
    }

    if (
      emergencyRelationship &&
      !emergencyName
    ) {
      setError(
        "Please enter the emergency contact's name before selecting their relationship."
      );

      return;
    }

    if (
      emergencyName &&
      !emergencyPhone
    ) {
      setError(
        "Please enter a phone number for your emergency contact."
      );

      return;
    }

    try {
      setSaving(true);

      const { data } =
        await api.put(
          "/patients/me",
          {
            name:
              form.name.trim(),

            phone:
              form.phone.trim(),

            dateOfBirth:
              form.dateOfBirth ||
              null,

            address:
              form.address.trim(),

            preferredLanguage:
              form.preferredLanguage.trim(),

            emergencyContact: {
              name:
                emergencyName,

              phone:
                emergencyPhone,

              relationship:
                emergencyRelationship,
            },
          }
        );

      setSuccessMessage(
        data.message ||
          "Profile updated successfully."
      );
    } catch (error: any) {
      setError(
        error.response?.data
          ?.message ||
          "Unable to update your profile."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl px-5 py-14 text-sm text-[#647583] lg:px-8">
        Loading your profile...
      </section>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5FAFB]">
      <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <div className="border-b border-[#DDE8EA] pb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-teal">
            Patient profile
          </p>

          <h1 className="mt-2 font-display text-3xl font-extrabold text-navy md:text-4xl">
            Manage your profile
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#647583]">
            Keep your personal and emergency contact details up to date.
            Clinical information shown below is protected and cannot be changed from this page.
          </p>
        </div>

        {successMessage && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2
              size={18}
              className="mt-0.5 shrink-0"
            />

            <p>
              {successMessage}
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

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <form
            onSubmit={saveProfile}
            className="card p-6 md:p-7"
          >
            <div className="flex items-center gap-3 border-b border-[#E2EBEF] pb-5">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#EAF8FA] text-teal">
                <UserRound
                  size={21}
                />
              </div>

              <div>
                <h2 className="font-display text-xl font-bold text-navy">
                  Personal information
                </h2>

                <p className="mt-1 text-sm text-[#647583]">
                  Details linked to your MediLink patient account.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <FormField
                label="Full name"
                required
              >
                <input
                  type="text"
                  className="field"
                  value={
                    form.name
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "name",
                      event.target
                        .value
                    )
                  }
                  placeholder="Your full name"
                  required
                />
              </FormField>

              <FormField
                label="Email address"
                hint="Your email is managed through your account login."
              >
                <input
                  type="email"
                  className="field bg-[#F5F7F8]"
                  value={
                    user?.email ??
                    ""
                  }
                  readOnly
                />
              </FormField>

              <FormField label="Phone number">
                <div className="relative">
                  <Phone
                    size={17}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#81909A]"
                  />

                  <input
                    type="tel"
                    className="field pl-10"
                    value={
                      form.phone
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "phone",
                        event.target
                          .value
                      )
                    }
                    placeholder="+263..."
                  />
                </div>
              </FormField>

              <FormField label="Date of birth">
                <input
                  type="date"
                  className="field"
                  value={
                    form.dateOfBirth
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "dateOfBirth",
                      event.target
                        .value
                    )
                  }
                />
              </FormField>

              <FormField label="Address">
                <div className="relative">
                  <MapPin
                    size={17}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#81909A]"
                  />

                  <input
                    type="text"
                    className="field pl-10"
                    value={
                      form.address
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "address",
                        event.target
                          .value
                      )
                    }
                    placeholder="Harare, Zimbabwe"
                  />
                </div>
              </FormField>

              <FormField label="Preferred language">
                <div className="relative">
                  <Languages
                    size={17}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#81909A]"
                  />

                  <input
                    type="text"
                    className="field pl-10"
                    value={
                      form.preferredLanguage
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "preferredLanguage",
                        event.target
                          .value
                      )
                    }
                    placeholder="English"
                  />
                </div>
              </FormField>
            </div>

            <div className="mt-8 border-t border-[#E2EBEF] pt-7">
              <h3 className="font-display text-lg font-bold text-navy">
                Emergency contact
              </h3>

              <p className="mt-1 text-sm text-[#647583]">
                Someone MediLink or a healthcare provider can contact in an emergency.
              </p>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <FormField label="Contact name">
                  <input
                    type="text"
                    className="field"
                    value={
                      form.emergencyContact
                        .name
                    }
                    onChange={(
                      event
                    ) =>
                      updateEmergencyContact(
                        "name",
                        event.target
                          .value
                      )
                    }
                    placeholder="Emergency contact name"
                  />
                </FormField>

                <FormField label="Relationship">
                  <RelationshipDropdown
                    value={
                      form.emergencyContact
                        .relationship
                    }
                    onChange={(
                      value
                    ) =>
                      updateEmergencyContact(
                        "relationship",
                        value
                      )
                    }
                  />
                </FormField>

                <div className="md:col-span-2">
                  <FormField
                    label="Emergency phone number"
                    hint="Add the contact name and phone number together."
                  >
                    <input
                      type="tel"
                      className="field"
                      value={
                        form.emergencyContact
                          .phone
                      }
                      onChange={(
                        event
                      ) =>
                        updateEmergencyContact(
                          "phone",
                          event.target
                            .value
                        )
                      }
                      placeholder="+263..."
                    />
                  </FormField>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end border-t border-[#E2EBEF] pt-6">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary min-w-36"
              >
                {saving
                  ? "Saving..."
                  : "Save profile"}
              </button>
            </div>
          </form>

          <aside>
            <section className="card overflow-hidden">
              <div className="p-6">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#EAF8FA] text-teal">
                    <HeartPulse
                      size={20}
                    />
                  </div>

                  <div>
                    <h2 className="font-display text-lg font-bold text-navy">
                      Clinical information
                    </h2>

                    <p className="mt-1 text-xs text-[#647583]">
                      View-only on this page
                    </p>
                  </div>
                </div>

                <div className="mt-7 space-y-6">
                  <ClinicalField
                    label="Blood group"
                    value={
                      clinicalInfo.bloodGroup ||
                      "Not recorded"
                    }
                  />

                  <ClinicalList
                    label="Allergies"
                    items={
                      clinicalInfo.allergies
                    }
                    emptyText="No allergies recorded"
                  />

                  <ClinicalList
                    label="Existing conditions"
                    items={
                      clinicalInfo.existingConditions
                    }
                    emptyText="No existing conditions recorded"
                  />
                </div>
              </div>

              <div className="border-t border-[#E2EBEF] bg-[#F5FAFB] p-6">
                <div className="flex items-start gap-3">
                  <ShieldCheck
                    size={20}
                    className="mt-0.5 shrink-0 text-teal"
                  />

                  <div>
                    <h3 className="font-display text-sm font-bold text-navy">
                      Protected health data
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-[#647583]">
                      These details are read-only because they can affect clinical decisions. Updates should be confirmed by an authorised healthcare professional.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </section>
    </main>
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
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-navy">
        {label}

        {required && (
          <span className="ml-1 text-teal">
            *
          </span>
        )}
      </span>

      <div className="mt-2">
        {children}
      </div>

      {hint && (
        <span className="mt-1.5 block text-xs leading-5 text-[#87949D]">
          {hint}
        </span>
      )}
    </label>
  );
}

function ClinicalField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-[#8A99A5]">
        {label}
      </p>

      <p className="mt-1 font-medium text-navy">
        {value}
      </p>
    </div>
  );
}

function ClinicalList({
  label,
  items,
  emptyText,
}: {
  label: string;
  items: string[];
  emptyText: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-[#8A99A5]">
        {label}
      </p>

      {items.length ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {items.map(
            (item) => (
              <span
                key={item}
                className="rounded-full bg-[#EAF8FA] px-3 py-1.5 text-xs font-medium text-navy"
              >
                {item}
              </span>
            )
          )}
        </div>
      ) : (
        <p className="mt-1 text-sm text-[#647583]">
          {emptyText}
        </p>
      )}
    </div>
  );
}