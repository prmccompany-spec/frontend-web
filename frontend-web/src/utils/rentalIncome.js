// A rental's advance is real income the moment it's collected. When
// returned, if the final usage charge exceeds the advance, the remaining
// balance is additional incoming money.
// If the rental was returned early and the final charge is less than the advance,
// the difference is an outgoing REFUND returned to the renter (tracked as 'out' in Tally Book).
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
        kind: 'in',
      });
    }

    if (r.status === 'returned') {
      if (balance > 0) {
        entries.push({
          rentalId: r.id,
          stage: 'balance',
          date: r.returned_at || r.end_date,
          amount: balance,
          mode: r.settlement_payment_type,
          kind: 'in',
        });
      } else if (balance < 0) {
        entries.push({
          rentalId: r.id,
          stage: 'refund',
          date: r.returned_at || r.end_date,
          amount: Math.abs(balance),
          mode: r.settlement_payment_type,
          kind: 'out',
        });
      }
    }
  }

  return entries;
}
