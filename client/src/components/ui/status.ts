export function statusClasses(status: string) {
  const value = status.toLowerCase();
  if (["confirmed", "valid", "active", "paid", "medical_aid_approved"].includes(value)) return "border border-emerald-100 bg-emerald-50 text-emerald-700";
  if (["pending", "unpaid", "medical_aid_pending", "awaiting-update"].includes(value)) return "border border-amber-100 bg-amber-50 text-amber-800";
  if (["completed", "dispensed", "partially_paid"].includes(value)) return "border border-sky-100 bg-sky-50 text-sky-700";
  if (["cancelled", "expired", "failed", "medical_aid_declined"].includes(value)) return "border border-red-100 bg-red-50 text-red-700";
  if (["rescheduled", "refunded"].includes(value)) return "border border-violet-100 bg-violet-50 text-violet-700";
  return "border border-slate-200 bg-slate-50 text-slate-600";
}
