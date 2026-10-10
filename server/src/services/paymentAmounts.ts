type Amounts = { amount: number; amountPaid: number; amountCovered: number };
type Update = { status: string; amountPaid?: number; amountCovered?: number };

export function resolvePaymentAmounts(current: Amounts, update: Update) {
  const covered = update.amountCovered ?? current.amountCovered;
  // Preserve the existing direct-payment shortcut while retaining insurer coverage.
  const paid = update.amountPaid ?? (update.status === "paid"
    ? Math.max(0, current.amount - covered)
    : current.amountPaid);
  const totalCents = Math.round(current.amount * 100);
  const settledCents = Math.round(paid * 100) + Math.round(covered * 100);
  if (![paid, covered].every(value => Number.isFinite(value) && value >= 0)) {
    return { error: "Payment and coverage must be non-negative amounts." } as const;
  }
  if (settledCents > totalCents) {
    return { error: "Combined patient payment and medical aid coverage cannot exceed the consultation fee." } as const;
  }
  if (update.status === "paid" && settledCents !== totalCents) {
    return { error: "A paid consultation must be fully settled by patient payment and medical aid coverage." } as const;
  }
  return { paid, covered, balance: Math.max(0, totalCents - settledCents) / 100 } as const;
}
