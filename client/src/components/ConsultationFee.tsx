import type { Doctor } from "../types";
export default function ConsultationFee({ doctor }: { doctor: Doctor }) {
  return <p className="my-3 text-sm font-semibold text-navy">{Number(doctor.consultationFee) > 0 ? "Consultation fee: " + (doctor.currency || "USD") + " " + Number(doctor.consultationFee).toFixed(2) : "Consultation fee not yet configured"}</p>;
}
