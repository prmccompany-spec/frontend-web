import { useState, useEffect, useCallback } from 'react';
import { getRentals, getRentalProducts, updateRentalStatus, returnRental } from '../../../services/rentalService';
import { matchesIdOrText } from '../../../utils/memberSearch';
import { exportTableToPdf } from '../../../utils/pdfExport';
import { exportTableToExcel } from '../../../utils/excelExport';
import ExportPdfButton from '../../../components/ExportPdfButton/ExportPdfButton';
import ExportExcelButton from '../../../components/ExportExcelButton/ExportExcelButton';
import ReceiptModal from '../../../components/ReceiptModal/ReceiptModal';
import RentalProductsBadge from '../../../components/RentalProductsBadge/RentalProductsBadge';
import { showToast } from '../../../components/Toast/toastBus';
import './RentalHistory.css';

const fmt = (val) =>
  Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const nowLocal = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

const toLocalInput = (d) => {
  const dt = new Date(d);
  dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset());
  return dt.toISOString().slice(0, 16);
};

const MS_PER_UNIT = {
  day: 1000 * 60 * 60 * 24,
  month: 1000 * 60 * 60 * 24 * 30,
  year: 1000 * 60 * 60 * 24 * 365,
};

const enrichRentalWithItems = (r) => {
  let items = Array.isArray(r.items) && r.items.length > 1 ? r.items : [];
  if (items.length <= 1 && r.notes && r.notes.includes('[[ITEMS:')) {
    try {
      const match = r.notes.match(/\[\[ITEMS:(.*?)\]\]/);
      if (match && match[1]) {
        const parsed = JSON.parse(match[1]);
        if (Array.isArray(parsed) && parsed.length > 0) {
          items = parsed;
        }
      }
    } catch {}
  }

  if (items.length === 0 && Array.isArray(r.items) && r.items.length > 0) {
    items = r.items;
  } else if (items.length === 0 && r.product_name) {
    items = [{
      product_name: r.product_name,
      quantity: r.quantity || 1,
      rate_type: r.rate_type,
      rate_amount: r.rate_amount,
      amount: r.amount,
    }];
  }

  const cleanNotes = r.notes ? r.notes.replace(/\[\[ITEMS:.*?\]\]/g, '').trim() : r.notes;
  const itemsSummary = items.length > 0
    ? items.map((i) => `${i.quantity}x ${i.product_name || 'Product'}`).join(', ')
    : r.items_summary || r.product_name || '—';
  const totalQuantity = items.reduce((sum, i) => sum + (Number(i.quantity) || 1), 0);

  return {
    ...r,
    items,
    items_summary: itemsSummary,
    total_quantity: totalQuantity,
    notes: cleanNotes,
  };
};

// Mirrors the backend's day-rate floor (rentalService.js computeAmount) so
// the modal can show a live preview as the return date changes. The server
// still recomputes authoritatively from the submitted end_date, so any
// client-side drift here can't actually under/overcharge.
const previewAmount = (rateType, rateAmount, dayRate, startDate, endDate, quantity = 1) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (!rateAmount || !dayRate || Number.isNaN(end.getTime()) || end <= start) return null;
  const ms = end - start;
  const units = Math.max(Math.ceil(ms / MS_PER_UNIT[rateType]), 1);
  const qty = Math.max(1, Number(quantity) || 1);
  return Math.max(units * Number(rateAmount) * qty, Number(dayRate) * qty);
};

// ── Return & Settle modal ──────────────────────────────────────────────────
function ReturnModal({ rental, products = [], onClose, onSettled }) {
  const [endDate, setEndDate] = useState(nowLocal());
  const [amount, setAmount] = useState(rental.amount);
  const [amountTouched, setAmountTouched] = useState(false);
  const [settlementType, setSettlementType] = useState('cash');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Recompute the suggested amount across all items whenever the return date changes
  useEffect(() => {
    if (amountTouched) return;
    const start = new Date(rental.start_date);
    const end = new Date(endDate);
    if (isNaN(end.getTime()) || end <= start) return;

    if (rental.items && rental.items.length > 0) {
      let sum = 0;
      for (const item of rental.items) {
        const prod = products.find((p) => String(p.id) === String(item.product_id));
        const dayRate = prod ? Number(prod.day_rate) : (Number(item.rate_amount) || 0);
        const rateType = item.rate_type || 'day';
        const rateAmount = Number(item.rate_amount) || dayRate;
        const ms = end - start;
        const units = Math.max(Math.ceil(ms / MS_PER_UNIT[rateType]), 1);
        const qty = Math.max(1, Number(item.quantity) || 1);
        const itemCost = Math.max(units * rateAmount * qty, dayRate * qty);
        sum += itemCost;
      }
      setAmount(sum.toFixed(2));
    } else {
      const prod = products.find((p) => String(p.id) === String(rental.product_id));
      const dayRate = prod ? Number(prod.day_rate) : (Number(rental.rate_amount) || 0);
      const preview = previewAmount(rental.rate_type, rental.rate_amount, dayRate, rental.start_date, endDate, rental.quantity || 1);
      if (preview !== null) setAmount(preview.toFixed(2));
    }
  }, [endDate, amountTouched, rental, products]);

  const advance = Number(rental.advance_amount) || 0;
  const currentTotal = Number(amount || 0);
  const diff = currentTotal - advance; // > 0 balance due, < 0 refund to renter, == 0 exact
  const isRefund = diff < 0;
  const isBalance = diff > 0;
  const isExact = diff === 0;
  const refundAmount = Math.abs(diff);
  const balanceDue = diff;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!endDate) return setError('Select the actual return date.');
    if (new Date(endDate) <= new Date(rental.start_date)) return setError('Return date must be after the start date.');
    if (!amount || Number(amount) <= 0) return setError('Enter a valid amount.');

    setSubmitting(true);
    try {
      const res = await returnRental(rental.id, {
        end_date: endDate,
        amount: Number(amount),
        settlement_payment_type: (isBalance || isRefund) ? settlementType : undefined,
      });

      showToast(
        isRefund
          ? `Rental returned! Refunded ₹${fmt(refundAmount)} to renter.`
          : isBalance
          ? `Rental returned! Collected balance ₹${fmt(balanceDue)}.`
          : 'Rental returned and settled successfully!',
        'success'
      );

      onSettled(res?.data || {
        ...rental,
        status: 'returned',
        end_date: endDate,
        amount: Number(amount),
        settlement_payment_type: (isBalance || isRefund) ? settlementType : undefined,
        returned_at: new Date().toISOString(),
      });
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to record return.');
      setSubmitting(false);
    }
  };

  const bookedItems = rental.items && rental.items.length > 0
    ? rental.items
    : [{ product_name: rental.product_name, quantity: rental.quantity || 1 }];

  return (
    <div className="rh-overlay" onClick={onClose}>
      <div className="rh-modal" onClick={(e) => e.stopPropagation()}>
        <div className="rh-modal-header">
          <h2 className="rh-modal-title">Return &amp; Settle</h2>
          <button className="rh-modal-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="rh-modal-body">
            {error && <div className="rh-modal-error">{error}</div>}

            <div className="rh-modal-renter-summary">
              <div className="rh-modal-renter-name">
                {rental.member_name || rental.renter_name}
                {rental.member_code && <span className="rh-modal-renter-code"> ({rental.member_code})</span>}
              </div>
              <div className="rh-modal-dates-meta">
                Booked: {fmtDateTime(rental.start_date)} → {fmtDateTime(rental.end_date)}
              </div>
            </div>

            {/* Assets Being Returned */}
            <div className="rh-modal-items-box">
              <div className="rh-modal-items-head">Assets Being Returned:</div>
              <div className="rh-modal-items-tags">
                {bookedItems.map((it, idx) => (
                  <span key={idx} className="rh-modal-item-chip">
                    <strong>{it.quantity}×</strong> {it.product_name || 'Product'}
                  </span>
                ))}
              </div>
            </div>

            <div className="rh-field">
              <label className="rh-modal-label">Actual Return Date &amp; Time *</label>
              <input
                type="datetime-local"
                className="rh-modal-input"
                value={endDate}
                min={toLocalInput(rental.start_date)}
                onChange={(e) => setEndDate(e.target.value)}
              />
              <p className="rh-modal-hint">
                Usage rate automatically recalculates to this return timestamp (minimum 1 day per asset).
              </p>
            </div>

            <div className="rh-field">
              <label className="rh-modal-label">Final Rent Charged (₹) *</label>
              <input
                type="number"
                className="rh-modal-input rh-modal-input--bold"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => { setAmountTouched(true); setAmount(e.target.value); }}
              />
              <p className="rh-modal-hint">
                Auto-computed from actual duration. You can adjust this for discounts or early return agreements.
              </p>
            </div>

            {/* Clear Financial Settlement Breakdown */}
            <div className={`rh-settle-box ${isRefund ? 'rh-settle-box--refund' : isBalance ? 'rh-settle-box--balance' : 'rh-settle-box--exact'}`}>
              <div className="rh-settle-line">
                <span>Final Rent for Usage:</span>
                <strong>₹{fmt(currentTotal)}</strong>
              </div>
              <div className="rh-settle-line">
                <span>Advance Paid at Booking:</span>
                <strong>- ₹{fmt(advance)}</strong>
              </div>
              <div className="rh-settle-line-divider" />

              {isRefund && (
                <div className="rh-settle-outcome">
                  <div>
                    <span className="rh-outcome-badge rh-outcome-badge--refund">REFUND DUE TO RENTER</span>
                    <div className="rh-outcome-sub">வாடகைதாரருக்கு திருப்பி வழங்க வேண்டிய தொகை</div>
                  </div>
                  <div className="rh-outcome-val rh-outcome-val--refund">
                    ₹{fmt(refundAmount)}
                  </div>
                </div>
              )}

              {isBalance && (
                <div className="rh-settle-outcome">
                  <div>
                    <span className="rh-outcome-badge rh-outcome-badge--balance">BALANCE DUE FROM RENTER</span>
                    <div className="rh-outcome-sub">வாடகைதாரரிடம் பெற வேண்டிய மீதித் தொகை</div>
                  </div>
                  <div className="rh-outcome-val rh-outcome-val--balance">
                    ₹{fmt(balanceDue)}
                  </div>
                </div>
              )}

              {isExact && (
                <div className="rh-settle-outcome">
                  <div>
                    <span className="rh-outcome-badge rh-outcome-badge--exact">FULLY SETTLED</span>
                    <div className="rh-outcome-sub">முன்பணத்தில் முழுமையாக நேர் செய்யப்பட்டது</div>
                  </div>
                  <div className="rh-outcome-val">
                    ₹0.00
                  </div>
                </div>
              )}
            </div>

            {(isBalance || isRefund) && (
              <div className="rh-field">
                <label className="rh-modal-label">
                  {isRefund ? 'Refund Payment Mode (திருப்பியளிக்கும் முறை) *' : 'Balance Payment Mode (பெறும் முறை) *'}
                </label>
                <div className="rh-type-toggle">
                  <button
                    type="button"
                    className={`rh-type-btn${settlementType === 'cash' ? ' rh-type-btn--active' : ''}`}
                    onClick={() => setSettlementType('cash')}
                  >
                    Cash (ரொக்கம்)
                  </button>
                  <button
                    type="button"
                    className={`rh-type-btn${settlementType === 'qr' ? ' rh-type-btn--active' : ''}`}
                    onClick={() => setSettlementType('qr')}
                  >
                    UPI / QR Code
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="rh-modal-footer">
            <button type="button" className="rh-row-btn" onClick={onClose} disabled={submitting}>Cancel</button>
            <button
              type="submit"
              className={`rh-row-btn ${isRefund ? 'rh-row-btn--refund' : 'rh-row-btn--success'}`}
              disabled={submitting}
            >
              {submitting ? 'Saving…' : (isRefund ? `Refund ₹${fmt(refundAmount)} & Settle` : isBalance ? `Collect ₹${fmt(balanceDue)} & Settle` : 'Confirm Return & Settle')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RentalHistory() {
  const [rentals, setRentals] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [returnTarget, setReturnTarget] = useState(null);
  const [receiptRental, setReceiptRental] = useState(null);

  const [filters, setFilters] = useState({
    status: '',
    product_id: '',
    search: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.product_id) params.product_id = filters.product_id;
      const res = await getRentals(params);
      const rawList = res.data ?? [];
      setRentals(rawList.map(enrichRentalWithItems));
    } catch {
      setRentals([]);
    } finally {
      setLoading(false);
    }
  }, [filters.status, filters.product_id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { getRentalProducts().then(setProducts).catch(() => {}); }, []);

  const handleCancel = async (rental) => {
    setUpdatingId(rental.id);
    try {
      await updateRentalStatus(rental.id, 'cancelled');
      await load();
    } catch (err) {
      alert(err.response?.data?.message ?? 'Failed to cancel rental.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleReturned = (settledData) => {
    setReturnTarget(null);
    load();
    if (settledData) {
      setReceiptRental(enrichRentalWithItems(settledData));
    }
  };

  const handleReceipt = (rental) => {
    setReceiptRental(enrichRentalWithItems(rental));
  };

  const displayed = rentals.filter((r) => {
    const itemNames = (r.items || []).map((i) => i.product_name);
    return matchesIdOrText(
      r.member_code,
      [r.member_name, r.renter_name, r.product_name, r.items_summary, r.rental_ref, ...itemNames],
      filters.search
    );
  });

  const total = displayed.reduce((s, r) => s + Number(r.amount), 0);
  const totalAdvance = displayed.reduce((s, r) => s + (Number(r.advance_amount) || 0), 0);
  const returnedRentals = displayed.filter((r) => r.status === 'returned');
  const balanceCollected = returnedRentals.reduce((s, r) => {
    const d = (Number(r.amount) || 0) - (Number(r.advance_amount) || 0);
    return d > 0 ? s + d : s;
  }, 0);
  const refundsIssued = returnedRentals.reduce((s, r) => {
    const d = (Number(r.amount) || 0) - (Number(r.advance_amount) || 0);
    return d < 0 ? s + Math.abs(d) : s;
  }, 0);
  const netRealized = totalAdvance + balanceCollected - refundsIssued;

  const fmtStatus = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const activeFilterParts = [];
  if (filters.status) activeFilterParts.push(`Status: ${fmtStatus(filters.status)}`);
  if (filters.product_id) activeFilterParts.push(products.find((p) => String(p.id) === filters.product_id)?.name || 'Product');
  if (filters.search) activeFilterParts.push(`Search "${filters.search}"`);

  const getSettlementLabel = (r) => {
    const advance = Number(r.advance_amount) || 0;
    const amount = Number(r.amount) || 0;
    const diff = amount - advance;

    if (r.status === 'returned') {
      if (diff > 0) return `+Rs. ${fmt(diff)} (Balance Collected)`;
      if (diff < 0) return `-Rs. ${fmt(Math.abs(diff))} (Refunded)`;
      return 'Rs. 0 (Even)';
    }
    if (r.status === 'active') {
      if (advance > 0) {
        if (diff > 0) return `Est. Due: +Rs. ${fmt(diff)}`;
        if (diff < 0) return `Est. Refund: -Rs. ${fmt(Math.abs(diff))}`;
        return 'Advance Covered';
      }
      return `Due on Return: Rs. ${fmt(amount)}`;
    }
    if (r.status === 'cancelled') {
      return advance > 0 ? `-Rs. ${fmt(advance)} (Adv Refunded)` : '—';
    }
    return '—';
  };

  const getSettlementExcelValue = (r) => {
    const advance = Number(r.advance_amount) || 0;
    const amount = Number(r.amount) || 0;
    const diff = amount - advance;

    if (r.status === 'returned') {
      if (diff > 0) return `+${diff.toFixed(2)} (Collected)`;
      if (diff < 0) return `-${Math.abs(diff).toFixed(2)} (Refunded)`;
      return '0.00 (Even)';
    }
    if (r.status === 'active') {
      if (advance > 0) {
        if (diff > 0) return `+${diff.toFixed(2)} (Est. Due)`;
        if (diff < 0) return `-${Math.abs(diff).toFixed(2)} (Est. Refund)`;
        return '0.00 (Adv Covered)';
      }
      return `${amount.toFixed(2)} (Due on Return)`;
    }
    if (r.status === 'cancelled') {
      return advance > 0 ? `-${advance.toFixed(2)} (Adv Refunded)` : '—';
    }
    return '—';
  };

  const renderCashFlow = (r) => {
    const advance = Number(r.advance_amount) || 0;
    const amount = Number(r.amount) || 0;
    const diff = amount - advance;

    if (r.status === 'returned') {
      if (diff > 0) {
        return (
          <div className="rh-flow-cell" title={`Total Rent: ₹${fmt(amount)} | Advance: ₹${fmt(advance)} | Balance Collected: ₹${fmt(diff)}`}>
            <span className="rh-flow-pill rh-flow-pill--collected">
              +₹{fmt(diff)} Collected
            </span>
            <div className="rh-flow-hint">Balance received</div>
          </div>
        );
      }
      if (diff < 0) {
        return (
          <div className="rh-flow-cell" title={`Total Rent: ₹${fmt(amount)} | Advance: ₹${fmt(advance)} | Refunded: ₹${fmt(Math.abs(diff))}`}>
            <span className="rh-flow-pill rh-flow-pill--refunded">
              -₹{fmt(Math.abs(diff))} Refunded
            </span>
            <div className="rh-flow-hint">Excess advance returned</div>
          </div>
        );
      }
      return (
        <div className="rh-flow-cell" title={`Total Rent: ₹${fmt(amount)} | Advance: ₹${fmt(advance)}`}>
          <span className="rh-flow-pill rh-flow-pill--even">
            ₹0 (Even)
          </span>
          <div className="rh-flow-hint">Exact advance</div>
        </div>
      );
    }

    if (r.status === 'active') {
      if (advance > 0) {
        if (diff > 0) {
          return (
            <div className="rh-flow-cell" title={`Advance Paid: ₹${fmt(advance)} | Est. Rent: ₹${fmt(amount)}`}>
              <span className="rh-flow-pill rh-flow-pill--pending-due">
                Est. Due +₹{fmt(diff)}
              </span>
              <div className="rh-flow-hint">₹{fmt(advance)} adv paid</div>
            </div>
          );
        }
        if (diff < 0) {
          return (
            <div className="rh-flow-cell" title={`Advance Paid: ₹${fmt(advance)} | Est. Rent: ₹${fmt(amount)}`}>
              <span className="rh-flow-pill rh-flow-pill--pending-refund">
                Est. Refund -₹{fmt(Math.abs(diff))}
              </span>
              <div className="rh-flow-hint">₹{fmt(advance)} adv paid</div>
            </div>
          );
        }
        return (
          <div className="rh-flow-cell">
            <span className="rh-flow-pill rh-flow-pill--even">
              Covered by Adv
            </span>
            <div className="rh-flow-hint">₹{fmt(advance)} adv paid</div>
          </div>
        );
      }
      return (
        <div className="rh-flow-cell">
          <span className="rh-flow-pill rh-flow-pill--pending-due">
            Due: ₹{fmt(amount)}
          </span>
          <div className="rh-flow-hint">No advance</div>
        </div>
      );
    }

    if (r.status === 'cancelled') {
      if (advance > 0) {
        return (
          <div className="rh-flow-cell">
            <span className="rh-flow-pill rh-flow-pill--cancelled">
              -₹{fmt(advance)} Adv Refunded
            </span>
            <div className="rh-flow-hint">Booking cancelled</div>
          </div>
        );
      }
    }

    return <span className="rh-flow-hint">—</span>;
  };

  const handleExport = () => exportTableToPdf({
    title: 'Rental History',
    subtitle: activeFilterParts.length ? activeFilterParts.join(' · ') : 'All records',
    summary: [
      { label: 'Rentals', value: displayed.length },
      { label: 'Total Rent', value: `Rs. ${fmt(total)}` },
      { label: 'Total Advance', value: `Rs. ${fmt(totalAdvance)}` },
      ...(balanceCollected > 0 ? [{ label: 'Balance Collected', value: `+Rs. ${fmt(balanceCollected)}` }] : []),
      ...(refundsIssued > 0 ? [{ label: 'Refunds Issued', value: `-Rs. ${fmt(refundsIssued)}` }] : []),
      { label: 'Net Realized', value: `Rs. ${fmt(netRealized)}` },
    ],
    columns: [
      { header: 'Ref', key: 'ref' },
      { header: 'Product', key: 'product' },
      { header: 'Qty', key: 'quantity', align: 'center' },
      { header: 'Renter', key: 'renter' },
      { header: 'Rate', key: 'rate' },
      { header: 'Start', key: 'start' },
      { header: 'End', key: 'end' },
      { header: 'Amount', key: 'amount', align: 'right' },
      { header: 'Advance', key: 'advance', align: 'right' },
      { header: 'Cash Flow', key: 'settlement' },
      { header: 'Status', key: 'status' },
    ],
    rows: displayed.map((r) => ({
      ref: r.rental_ref || '—',
      product: r.items && r.items.length > 0
        ? r.items.map((i) => `${i.product_name} (${i.quantity})`).join(', ')
        : (r.items_summary || r.product_name || '—'),
      quantity: r.total_quantity || r.quantity || 1,
      renter: r.member_name || r.renter_name,
      rate: `Rs. ${fmt(r.rate_amount)} / ${r.rate_type}`,
      start: fmtDateTime(r.start_date),
      end: fmtDateTime(r.end_date),
      amount: `Rs. ${fmt(r.amount)}`,
      advance: Number(r.advance_amount) > 0 ? `Rs. ${fmt(r.advance_amount)}` : '—',
      settlement: getSettlementLabel(r),
      status: fmtStatus(r.status),
    })),
    filename: 'rental-history',
    orientation: 'landscape',
  });

  const handleExportExcel = () => exportTableToExcel({
    title: 'Rental History',
    subtitle: activeFilterParts.length ? activeFilterParts.join(' · ') : 'All records',
    summary: [
      { label: 'Rentals', value: displayed.length },
      { label: 'Total Rent', value: total },
      { label: 'Total Advance', value: totalAdvance },
      ...(balanceCollected > 0 ? [{ label: 'Balance Collected', value: balanceCollected }] : []),
      ...(refundsIssued > 0 ? [{ label: 'Refunds Issued', value: -refundsIssued }] : []),
      { label: 'Net Realized', value: netRealized },
    ],
    columns: [
      { header: 'Ref', key: 'ref' },
      { header: 'Product', key: 'product' },
      { header: 'Qty', key: 'quantity' },
      { header: 'Renter', key: 'renter' },
      { header: 'Rate', key: 'rate' },
      { header: 'Start Date', key: 'start' },
      { header: 'End Date', key: 'end' },
      { header: 'Amount', key: 'amount' },
      { header: 'Advance', key: 'advance' },
      { header: 'Cash Flow', key: 'settlement' },
      { header: 'Status', key: 'status' },
    ],
    rows: displayed.map((r) => ({
      ref: r.rental_ref || '—',
      product: r.items && r.items.length > 0
        ? r.items.map((i) => `${i.product_name} (${i.quantity})`).join(', ')
        : (r.items_summary || r.product_name || '—'),
      quantity: r.total_quantity || r.quantity || 1,
      renter: `${r.member_name || r.renter_name || '—'}${r.member_code ? ` (${r.member_code})` : ''}`,
      rate: `${r.rate_amount} / ${r.rate_type}`,
      start: fmtDateTime(r.start_date),
      end: fmtDateTime(r.end_date),
      amount: r.amount,
      advance: Number(r.advance_amount) > 0 ? r.advance_amount : '',
      settlement: getSettlementExcelValue(r),
      status: fmtStatus(r.status),
    })),
    totalRow: {
      ref: 'Total',
      product: `${displayed.length} rentals`,
      quantity: displayed.reduce((s, r) => s + (Number(r.total_quantity || r.quantity) || 1), 0),
      renter: '',
      rate: '',
      start: '',
      end: '',
      amount: total,
      advance: displayed.reduce((s, r) => s + (Number(r.advance_amount) || 0), 0),
      settlement: `${balanceCollected > 0 ? `+${balanceCollected.toFixed(2)} ` : ''}${refundsIssued > 0 ? `-${refundsIssued.toFixed(2)}` : ''}`.trim() || '—',
      status: '',
    },
    filename: 'rental-history',
  });

  return (
    <div className="admin-content rh-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Rental History</h1>
        <p className="admin-page-subtitle">View and manage all recorded rentals</p>
      </div>

      <div className="rh-filters">
        <input
          className="rh-input"
          placeholder="Search renter / product / ref…"
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
        />
        <select
          className="rh-input"
          value={filters.product_id}
          onChange={(e) => setFilters((f) => ({ ...f, product_id: e.target.value }))}
        >
          <option value="">All products</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select
          className="rh-input"
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="returned">Returned</option>
          <option value="cancelled">Cancelled</option>
        </select>
        {(filters.status || filters.product_id || filters.search) && (
          <button
            className="rh-clear"
            onClick={() => setFilters({ status: '', product_id: '', search: '' })}
          >
            Clear
          </button>
        )}
        <ExportPdfButton onExport={handleExport} disabled={displayed.length === 0} />
        <ExportExcelButton onExport={handleExportExcel} disabled={displayed.length === 0} />
      </div>

      {loading ? (
        <div className="rh-loading">Loading rentals…</div>
      ) : displayed.length === 0 ? (
        <div className="rh-empty">No rentals found.</div>
      ) : (
        <>
          <div className="rh-summary-bar">
            <div className="rh-summary-metrics">
              <span><strong>{displayed.length}</strong> rental{displayed.length !== 1 ? 's' : ''}</span>
              <span className="rh-summary-chip">Rent: ₹{fmt(total)}</span>
              <span className="rh-summary-chip">Adv: ₹{fmt(totalAdvance)}</span>
              {balanceCollected > 0 && (
                <span className="rh-summary-chip rh-summary-chip--green" title="Extra cash collected at return">
                  +₹{fmt(balanceCollected)} Collected
                </span>
              )}
              {refundsIssued > 0 && (
                <span className="rh-summary-chip rh-summary-chip--amber" title="Excess advance refunded at return">
                  -₹{fmt(refundsIssued)} Refunded
                </span>
              )}
            </div>
            <div className="rh-summary-total">
              Net Realized Cash: <strong>₹{fmt(netRealized)}</strong>
            </div>
          </div>

          <div className="rh-table-wrap">
            <table className="rh-table">
              <thead>
                <tr>
                  <th>Ref</th>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Renter</th>
                  <th>Rate</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Total Rent</th>
                  <th>Advance</th>
                  <th>Cash Flow</th>
                  <th>Status</th>
                  <th className="rh-th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((r) => (
                  <tr key={r.id}>
                    <td><span className="rh-ref">{r.rental_ref || '—'}</span></td>
                    <td className="rh-td-name">
                      <RentalProductsBadge items={r.items} fallback={r.product_name} fallbackQty={r.quantity} />
                    </td>
                    <td><strong className="rh-qty">{r.total_quantity || r.quantity || 1}</strong></td>
                    <td>
                      <div className="rh-member-name">{r.member_name || r.renter_name}</div>
                      {r.member_code ? (
                        <div className="rh-member-code">{r.member_code}</div>
                      ) : (
                        <div className="rh-member-code">Non-member</div>
                      )}
                    </td>
                    <td>{r.items && r.items.length > 1 ? `${r.items.length} items` : `₹${fmt(r.rate_amount)} / ${r.rate_type}`}</td>
                    <td>{fmtDateTime(r.start_date)}</td>
                    <td>{fmtDateTime(r.end_date)}</td>
                    <td className="rh-amount">₹{fmt(r.amount)}</td>
                    <td>{Number(r.advance_amount) > 0 ? `₹${fmt(r.advance_amount)}` : '—'}</td>
                    <td>{renderCashFlow(r)}</td>
                    <td>
                      <span className={`rh-status-badge rh-status-badge--${r.status}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="rh-td-actions">
                      {r.status === 'active' ? (
                        <>
                          <button
                            className="rh-row-btn rh-row-btn--success"
                            disabled={updatingId === r.id}
                            onClick={() => setReturnTarget(r)}
                          >
                            Return &amp; Settle
                          </button>
                          <button
                            className="rh-row-btn rh-row-btn--receipt"
                            onClick={() => handleReceipt(r)}
                            title="View / Print Booking Receipt"
                          >
                            Receipt
                          </button>
                          <button
                            className="rh-row-btn rh-row-btn--danger"
                            disabled={updatingId === r.id}
                            onClick={() => handleCancel(r)}
                          >
                            {updatingId === r.id ? '…' : 'Cancel'}
                          </button>
                        </>
                      ) : r.status === 'returned' ? (
                        <button
                          className="rh-row-btn rh-row-btn--receipt"
                          onClick={() => handleReceipt(r)}
                        >
                          Receipt
                        </button>
                      ) : (
                        <span className="rh-no-actions">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {returnTarget && (
        <ReturnModal
          rental={returnTarget}
          products={products}
          onClose={() => setReturnTarget(null)}
          onSettled={handleReturned}
        />
      )}

      {receiptRental && (
        <ReceiptModal
          rental={receiptRental}
          onClose={() => setReceiptRental(null)}
        />
      )}
    </div>
  );
}

export default RentalHistory;
