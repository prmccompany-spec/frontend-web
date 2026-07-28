// A rental's advance is real income the moment it's collected. The
// remaining balance only becomes income once the rental is actually
// returned and settled — it must not be counted while still active (the
// money hasn't come in yet), and never for a cancelled rental (nothing was
// ultimately earned there, regardless of any advance taken).
export function getRealizedRentalIncome(rentals) {
  const entries = [];

  for (const r of rentals) {
    if (r.status === 'cancelled') continue;

    const advance = Number(r.advance_amount) || 0;
    const total = Number(r.amount) || 0;
    const balance = total - advance;

    if (advance > 0) {
      entries.push({
        rentalId: r.id,
        stage: 'advance',
        date: r.created_at,
        amount: advance,
        mode: r.advance_payment_type,
      });
    }

    if (r.status === 'returned' && balance > 0) {
      entries.push({
        rentalId: r.id,
        stage: 'balance',
        date: r.returned_at,
        amount: balance,
        mode: r.settlement_payment_type,
      });
    }
  }

  return entries;
}
