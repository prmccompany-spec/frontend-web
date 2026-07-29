import { useState, useEffect, useCallback } from 'react';
import { getRentals, getRentalProducts, updateRentalStatus, returnRental } from '../../../services/rentalService';
import { matchesIdOrText } from '../../../utils/memberSearch';
import { exportTableToPdf } from '../../../utils/pdfExport';
import { downloadRentalReceipt } from '../../../utils/rentalReceipt';
import ExportPdfButton from '../../../components/ExportPdfButton/ExportPdfButton';
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

// Mirrors the backend's day-rate floor (rentalService.js computeAmount) so
// the modal can show a live preview as the return date changes. The server
// still recomputes authoritatively from the submitted end_date, so any
// client-side drift here can't actually under/overcharge.
const previewAmount = (rateType, rateAmount, dayRate, startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (!rateAmount || !dayRate || Number.isNaN(end.getTime()) || end <= start) return null;
  const ms = end - start;
  const units = Math.max(Math.ceil(ms / MS_PER_UNIT[rateType]), 1);
  return Math.max(units * Number(rateAmount), Number(dayRate));
};

// ── Return & Settle modal ──────────────────────────────────────────────────
function ReturnModal({ rental, dayRate, onClose, onSettled }) {
  const [endDate, setEndDate] = useState(nowLocal());
  const [amount, setAmount] = useState(rental.amount);
  const [amountTouched, setAmountTouched] = useState(false);
  const [settlementType, setSettlementType] = useState('cash');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Recompute the suggested amount whenever the actual return date changes,
  // unless the admin has manually edited the amount themselves.
  useEffect(() => {
    if (amountTouched) return;
    const preview = previewAmount(rental.rate_type, rental.rate_amount, dayRate, rental.start_date, endDate);
    if (preview !== null) setAmount(preview.toFixed(2));
  }, [endDate, amountTouched, rental.rate_type, rental.rate_amount, rental.start_date, dayRate]);

  const advance = Number(rental.advance_amount) || 0;
  const balance = Math.max(Number(amount || 0) - advance, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!endDate) return setError('Select the actual return date.');
    if (new Date(endDate) <= new Date(rental.start_date)) return setError('Return date must be after the start date.');
    if (!amount || Number(amount) <= 0) return setError('Enter a valid amount.');

    setSubmitting(true);
    try {
      await returnRental(rental.id, {
        end_date: endDate,
        amount: Number(amount),
        settlement_payment_type: balance > 0 ? settlementType : undefined,
      });
      onSettled();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to record return.');
      setSubmitting(false);
    }
  };

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

            <p className="rh-modal-sub">
              {rental.product_name} — {rental.member_name || rental.renter_name}
            </p>

            <div className="rh-field">
              <label className="rh-modal-label">Actual Return Date *</label>
              <input
                type="datetime-local"
                className="rh-modal-input"
                value={endDate}
                min={toLocalInput(rental.start_date)}
                onChange={(e) => setEndDate(e.target.value)}
              />
              <p className="rh-modal-hint">
                Originally booked until {fmtDateTime(rental.end_date)} — change this if it was actually returned earlier or later.
              </p>
            </div>

            <div className="rh-field">
              <label className="rh-modal-label">Final Amount (₹) *</label>
              <input
                type="number"
                className="rh-modal-input"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => { setAmountTouched(true); setAmount(e.target.value); }}
              />
              <p className="rh-modal-hint">Recalculated from the actual return date above (minimum: one day's rate) — you can still adjust it.</p>
            </div>

            <div className="rh-settle-summary">
              <div className="rh-settle-row">
                <span>Advance already paid</span>
                <strong>₹{fmt(advance)}</strong>
              </div>
              <div className="rh-settle-row rh-settle-row--balance">
                <span>Balance due now</span>
                <strong>₹{fmt(balance)}</strong>
              </div>
            </div>

            {balance > 0 && (
              <div className="rh-field">
                <label className="rh-modal-label">Balance Payment Type *</label>
                <div className="rh-type-toggle">
                  <button
                    type="button"
                    className={`rh-type-btn${settlementType === 'cash' ? ' rh-type-btn--active' : ''}`}
                    onClick={() => setSettlementType('cash')}
                  >
                    Cash
                  </button>
                  <button
                    type="button"
                    className={`rh-type-btn${settlementType === 'qr' ? ' rh-type-btn--active' : ''}`}
                    onClick={() => setSettlementType('qr')}
                  >
                    QR Code
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="rh-modal-footer">
            <button type="button" className="rh-row-btn" onClick={onClose} disabled={submitting}>Cancel</button>
            <button type="submit" className="rh-row-btn rh-row-btn--success" disabled={submitting}>
              {submitting ? 'Saving…' : 'Confirm Return'}
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
  const [receiptId, setReceiptId] = useState(null);

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
      setRentals(res.data ?? []);
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

  const handleReturned = () => {
    setReturnTarget(null);
    load();
  };

  const handleReceipt = async (rental) => {
    setReceiptId(rental.id);
    try {
      await downloadRentalReceipt(rental);
    } catch (err) {
      showToast(err.message || 'Failed to generate receipt.', 'error');
    } finally {
      setReceiptId(null);
    }
  };

  const displayed = rentals.filter((r) =>
    matchesIdOrText(r.member_code, [r.member_name, r.renter_name, r.product_name, r.rental_ref], filters.search)
  );

  const total = displayed.reduce((s, r) => s + Number(r.amount), 0);

  const fmtStatus = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const activeFilterParts = [];
  if (filters.status) activeFilterParts.push(`Status: ${fmtStatus(filters.status)}`);
  if (filters.product_id) activeFilterParts.push(products.find((p) => String(p.id) === filters.product_id)?.name || 'Product');
  if (filters.search) activeFilterParts.push(`Search "${filters.search}"`);

  const handleExport = () => exportTableToPdf({
    title: 'Rental History',
    subtitle: activeFilterParts.length ? activeFilterParts.join(' · ') : 'All records',
    summary: [
      { label: 'Rentals', value: displayed.length },
      { label: 'Total', value: `Rs. ${fmt(total)}` },
    ],
    columns: [
      { header: 'Ref', key: 'ref' },
      { header: 'Product', key: 'product' },
      { header: 'Renter', key: 'renter' },
      { header: 'Rate', key: 'rate' },
      { header: 'Start', key: 'start' },
      { header: 'End', key: 'end' },
      { header: 'Amount', key: 'amount', align: 'right' },
      { header: 'Advance', key: 'advance', align: 'right' },
      { header: 'Status', key: 'status' },
    ],
    rows: displayed.map((r) => ({
      ref: r.rental_ref || '—',
      product: r.product_name,
      renter: r.member_name || r.renter_name,
      rate: `Rs. ${fmt(r.rate_amount)} / ${r.rate_type}`,
      start: fmtDateTime(r.start_date),
      end: fmtDateTime(r.end_date),
      amount: `Rs. ${fmt(r.amount)}`,
      advance: Number(r.advance_amount) > 0 ? `Rs. ${fmt(r.advance_amount)}` : '—',
      status: fmtStatus(r.status),
    })),
    filename: 'rental-history',
    orientation: 'landscape',
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
      </div>

      {loading ? (
        <div className="rh-loading">Loading rentals…</div>
      ) : displayed.length === 0 ? (
        <div className="rh-empty">No rentals found.</div>
      ) : (
        <>
          <div className="rh-summary-bar">
            <span>{displayed.length} rental{displayed.length !== 1 ? 's' : ''}</span>
            <span className="rh-summary-total">Total: <strong>₹{fmt(total)}</strong></span>
          </div>

          <div className="rh-table-wrap">
            <table className="rh-table">
              <thead>
                <tr>
                  <th>Ref</th>
                  <th>Product</th>
                  <th>Renter</th>
                  <th>Rate</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Amount</th>
                  <th>Advance</th>
                  <th>Status</th>
                  <th className="rh-th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((r) => (
                  <tr key={r.id}>
                    <td><span className="rh-ref">{r.rental_ref || '—'}</span></td>
                    <td className="rh-td-name">{r.product_name}</td>
                    <td>
                      <div className="rh-member-name">{r.member_name || r.renter_name}</div>
                      {r.member_code ? (
                        <div className="rh-member-code">{r.member_code}</div>
                      ) : (
                        <div className="rh-member-code">Non-member</div>
                      )}
                    </td>
                    <td>₹{fmt(r.rate_amount)} / {r.rate_type}</td>
                    <td>{fmtDateTime(r.start_date)}</td>
                    <td>{fmtDateTime(r.end_date)}</td>
                    <td className="rh-amount">₹{fmt(r.amount)}</td>
                    <td>{Number(r.advance_amount) > 0 ? `₹${fmt(r.advance_amount)}` : '—'}</td>
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
                            className="rh-row-btn rh-row-btn--danger"
                            disabled={updatingId === r.id}
                            onClick={() => handleCancel(r)}
                          >
                            {updatingId === r.id ? '…' : 'Cancel'}
                          </button>
                        </>
                      ) : r.status === 'returned' ? (
                        <button
                          className="rh-row-btn"
                          disabled={receiptId === r.id}
                          onClick={() => handleReceipt(r)}
                        >
                          {receiptId === r.id ? 'Generating…' : 'Receipt'}
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
          dayRate={products.find((p) => p.id === returnTarget.product_id)?.day_rate}
          onClose={() => setReturnTarget(null)}
          onSettled={handleReturned}
        />
      )}
    </div>
  );
}

export default RentalHistory;
