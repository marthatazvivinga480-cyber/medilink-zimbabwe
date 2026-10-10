import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  Pill,
  ShieldCheck,
} from "lucide-react";

import { api } from "../services/api";

type VerifiedMedicine = {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
};

type VerificationResponse = {
  valid: boolean;
  detailsAvailable: boolean;
  prescription: {
    prescriptionCode: string;
    doctor?: string;
    medicines: VerifiedMedicine[];
    instructions?: string;
    issuedAt?: string;
    expiresAt?: string;
    status: string;
  };
};

export default function Verification() {
  const [params] = useSearchParams();

  const [code, setCode] = useState(
    params.get("code") || ""
  );

  const [data, setData] =
    useState<VerificationResponse | null>(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function verifyPrescription() {
    const cleanedCode = code.trim();

    setError("");
    setData(null);

    if (!cleanedCode) {
      setError(
        "Enter a prescription code before verifying."
      );
      return;
    }

    try {
      setLoading(true);

      const response =
        await api.get<VerificationResponse>(
          `/verification/${encodeURIComponent(
            cleanedCode
          )}`
        );

      setData(response.data);
    } catch (error: any) {
      setError(
        error.response?.data?.message ||
          "Prescription could not be verified."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (event.key === "Enter") {
      verifyPrescription();
    }
  }

  function formatDate(value?: string) {
    if (!value) return "Not provided";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <main>
      <section className="border-b border-[#E2EBEF] bg-[#F5FAFB]">
        <div className="mx-auto max-w-3xl px-5 py-14 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#EAF8FA] text-teal">
            <ShieldCheck className="h-6 w-6" />
          </div>

          <p className="mt-5 text-sm font-semibold uppercase tracking-[0.14em] text-teal">
            Pharmacy verification
          </p>

          <h1 className="mt-3 font-display text-4xl font-extrabold text-navy md:text-5xl">
            Verify a prescription.
          </h1>

          <p className="mx-auto mt-4 max-w-xl leading-7 text-[#647583]">
            Enter the prescription code to confirm
            whether it is valid. Only
            authorized pharmacy staff and the treating doctor or patient can view medicine details.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-12">
        <div className="card p-6 md:p-8">
          <label htmlFor="prescription-code" className="block text-sm font-semibold text-navy">
            Prescription code
          </label>

          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input
              id="prescription-code"
              className="field min-w-0 flex-1"
              placeholder="RX-MZ-2026-009812"
              value={code}
              onChange={(event) =>
                setCode(event.target.value)
              }
              onKeyDown={handleKeyDown}
            />

            <button
              type="button"
              className="btn-primary min-w-28"
              onClick={verifyPrescription}
              disabled={loading}
            >
              {loading ? "Checking..." : "Verify"}
            </button>
          </div>

          {error && (
            <div className="mt-6 flex gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

              <p>{error}</p>
            </div>
          )}

          {data && (
            <div className="mt-8 border-t border-[#E2EBEF] pt-7">
              <div
                className={`flex items-start gap-3 rounded-xl border p-4 ${
                  data.valid
                    ? "border-[#BFE6DD] bg-[#F0FBF8]"
                    : "border-red-100 bg-red-50"
                }`}
              >
                {data.valid ? (
                  <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-teal" />
                ) : (
                  <AlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-red-600" />
                )}

                <div>
                  <p
                    className={`font-semibold ${
                      data.valid
                        ? "text-[#176B58]"
                        : "text-red-700"
                    }`}
                  >
                    {data.valid
                      ? "Prescription valid"
                      : "Prescription not valid"}
                  </p>

                  <p className="mt-1 text-sm text-[#647583]">
                    Status:{" "}
                    <span className="font-medium text-navy">
                      {data.prescription.status}
                    </span>
                  </p>
                </div>
              </div>

              <div className="mt-7 grid gap-5 rounded-2xl border border-[#E2EBEF] bg-white p-5 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#8A99A5]">
                    Prescription
                  </p>

                  <p className="mt-1 font-semibold text-navy">
                    {
                      data.prescription
                        .prescriptionCode
                    }
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#8A99A5]">
                    Prescribing doctor
                  </p>

                  <p className="mt-1 font-semibold text-navy">
                    {data.prescription.doctor}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#8A99A5]">
                    Issued
                  </p>

                  <p className="mt-1 text-sm font-medium text-navy">
                    {formatDate(
                      data.prescription.issuedAt
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#8A99A5]">
                    Expires
                  </p>

                  <p className="mt-1 text-sm font-medium text-navy">
                    {formatDate(
                      data.prescription.expiresAt
                    )}
                  </p>
                </div>
              </div>

              {!data.detailsAvailable && <p role="status" className="mt-6 rounded-xl bg-slate-50 p-4 text-sm">
                Medicine details are private. <Link className="font-semibold text-teal-dark underline" to="/login">Sign in</Link> with an authorized account, then verify again.
              </p>}
              {data.detailsAvailable && <div className="mt-8">
                <h2 className="font-display text-xl font-bold text-navy">
                  Medicines
                </h2>

                <div className="mt-4 grid gap-3">
                  {data.prescription.medicines.map(
                    (medicine, index) => (
                      <div
                        key={`${medicine.name}-${index}`}
                        className="flex gap-4 rounded-xl border border-[#E2EBEF] bg-[#F8FBFC] p-4"
                      >
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#EAF8FA] text-teal">
                          <Pill className="h-5 w-5" />
                        </div>

                        <div>
                          <p className="font-semibold text-navy">
                            {medicine.name}
                          </p>

                          <p className="mt-1 text-sm leading-6 text-[#647583]">
                            {medicine.dosage} ·{" "}
                            {medicine.frequency} ·{" "}
                            {medicine.duration}
                          </p>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>}

              {data.prescription.instructions && (
                <div className="mt-8 rounded-xl bg-[#F5FAFB] p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#8A99A5]">
                    Dispensing instructions
                  </p>

                  <p className="mt-2 text-sm leading-6 text-[#647583]">
                    {
                      data.prescription
                        .instructions
                    }
                  </p>
                </div>
              )}

              <p className="mt-6 text-xs leading-5 text-[#8A99A5]">
                Prescription verification does not
                expose the patient's full medical
                history.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}