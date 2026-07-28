import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRentalProducts, createRental } from '../../../services/rentalService';
import { getMembers } from '../../../services/memberService';
import { matchesIdOrText, sortByMemberId } from '../../../utils/memberSearch';
import { showToast } from '../../../components/Toast/toastBus';
import './RentalEntry.css';

const nowLocal = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

const RATE_TYPES = [
  { key: 'day', label: 'Per Day' },
  { key: 'month', label: 'Per Month' },
  { key: 'year', label: 'Per Year' },
];

const MS_PER_UNIT = {
  day: 1000 * 60 * 60 * 24,
  month: 1000 * 60 * 60 * 24 * 30,
  year: 1000 * 60 * 60 * 24 * 365,
};

function RentalEntry() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [members, setMembers] = useState([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [form, setForm] = useState({
    product_id: '',
    renterType: 'member', // 'member' | 'guest'
    member_id: '',
    memberDisplay: '',
    renter_name: '',
    rate_type: 'day',
    start_date: nowLocal(),
    end_date: '',
    amount: '',
    advance_amount: '',
    advance_payment_type: 'cash',
    collected_by: '',
    collectorDisplay: '',
    notes: '',
  });

  const [amountTouched, setAmountTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getRentalProducts({ active: true }).then(setProducts).catch(() => {});
    getMembers().then((res) => setMembers(res.data?.data ?? [])).catch(() => {});
  }, []);

  const selectedProduct = useMemo(
    () => products.find((p) => String(p.id) === String(form.product_id)),
    [products, form.product_id]
  );

  const rate = useMemo(() => {
    if (!selectedProduct) return null;
    return selectedProduct[`${form.rate_type}_rate`];
  }, [selectedProduct, form.rate_type]);

  // Auto-compute suggested amount from rate x duration, with the day rate
  // as an absolute floor, unless the admin has manually edited it.
  useEffect(() => {
    if (amountTouched) return;
    if (!rate || !selectedProduct?.day_rate || !form.start_date || !form.end_date) return;

    const start = new Date(form.start_date);
    const end = new Date(form.end_date);
    if (end <= start) return;

    const ms = end - start;
    const units = Math.max(Math.ceil(ms / MS_PER_UNIT[form.rate_type]), 1);
    const computed = Math.max(units * Number(rate), Number(selectedProduct.day_rate));

    setForm((f) => ({ ...f, amount: computed.toFixed(2) }));
  }, [rate, form.start_date, form.end_date, form.rate_type, amountTouched, selectedProduct]);

  const filteredMembers = sortByMemberId(
    members.filter((m) => matchesIdOrText(m.member_id, [m.name], memberSearch))
  ).slice(0, 8);

  const selectMember = (m, field) => {
    if (field === 'member_id') {
      setForm((f) => ({ ...f, member_id: m.id, memberDisplay: `${m.name} (${m.member_id})` }));
      setMemberSearch('');
    } else {
      setForm((f) => ({ ...f, collected_by: m.id, collectorDisplay: `${m.name} (${m.member_id})` }));
    }
    setShowSuggestions(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.product_id) return setError('Please select a product.');
    if (form.renterType === 'member' && !form.member_id) return setError('Please select a member.');
    if (form.renterType === 'guest' && !form.renter_name.trim()) return setError("Please enter the renter's name.");
    if (!form.end_date) return setError('Please set an end date/time.');
    if (new Date(form.end_date) <= new Date(form.start_date)) return setError('End date must be after start date.');
    if (!form.amount || Number(form.amount) <= 0) return setError('Enter a valid amount.');

    const advanceNum = form.advance_amount ? Number(form.advance_amount) : 0;
    if (advanceNum < 0) return setError('Advance amount cannot be negative.');
    if (advanceNum > Number(form.amount)) return setError('Advance amount cannot exceed the total amount.');

    setSubmitting(true);
    try {
      const result = await createRental({
        product_id: Number(form.product_id),
        member_id: form.renterType === 'member' ? form.member_id : null,
        renter_name: form.renterType === 'guest' ? form.renter_name.trim() : null,
        rate_type: form.rate_type,
        start_date: form.start_date,
        end_date: form.end_date,
        amount: Number(form.amount),
        advance_amount: advanceNum,
        advance_payment_type: advanceNum > 0 ? form.advance_payment_type : null,
        collected_by: form.collected_by || null,
        notes: form.notes || null,
      });
      showToast(`Rental recorded successfully. Reference: ${result.rental_ref}`, 'success');
      navigate('/admin/rentals/history');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to record rental.';
      setError(msg);
      showToast(msg, 'error');
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-content">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Record Rental</h1>
        <p className="admin-page-subtitle">Book a product for a member or a non-member, and collect an advance if needed</p>
      </div>

      <div className="re-card">
        {error && <div className="re-error">{error}</div>}

        <form className="re-form" onSubmit={handleSubmit}>
          {/* Product */}
          <div className="re-field">
            <label className="re-label">Product *</label>
            <select
              className="re-input"
              value={form.product_id}
              onChange={(e) => setForm((f) => ({ ...f, product_id: e.target.value }))}
            >
              <option value="">Select product…</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Renter type */}
          <div className="re-field">
            <label className="re-label">Renter *</label>
            <div className="re-type-toggle">
              <button
                type="button"
                className={`re-type-btn${form.renterType === 'member' ? ' re-type-btn--active' : ''}`}
                onClick={() => setForm((f) => ({ ...f, renterType: 'member', renter_name: '' }))}
              >
                Member
              </button>
              <button
                type="button"
                className={`re-type-btn${form.renterType === 'guest' ? ' re-type-btn--active' : ''}`}
                onClick={() => setForm((f) => ({ ...f, renterType: 'guest', member_id: '', memberDisplay: '' }))}
              >
                Non-Member
              </button>
            </div>
          </div>

          {/* Member / Renter name */}
          {form.renterType === 'member' ? (
            <div className="re-field">
              <label className="re-label">Member *</label>
              {form.memberDisplay ? (
                <div className="re-selected-pill">
                  {form.memberDisplay}
                  <button type="button" className="re-pill-clear" onClick={() => setForm((f) => ({ ...f, member_id: '', memberDisplay: '' }))}>×</button>
                </div>
              ) : (
                <div className="re-search-wrap">
                  <input
                    className="re-input"
                    placeholder="Search by name or member ID…"
                    value={memberSearch}
                    onChange={(e) => { setMemberSearch(e.target.value); setShowSuggestions(true); }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                    autoComplete="off"
                  />
                  {showSuggestions && memberSearch && filteredMembers.length > 0 && (
                    <ul className="re-suggestions">
                      {filteredMembers.map((m) => (
                        <li key={m.id} onMouseDown={() => selectMember(m, 'member_id')}>
                          <span className="re-sug-name">{m.name}</span>
                          <span className="re-sug-id">{m.member_id}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="re-field">
              <label className="re-label">Renter Name *</label>
              <input
                className="re-input"
                placeholder="Full name"
                value={form.renter_name}
                onChange={(e) => setForm((f) => ({ ...f, renter_name: e.target.value }))}
              />
              <span className="re-hint">Not a registered member — only their name is recorded.</span>
            </div>
          )}

          {/* Rate Type */}
          <div className="re-field">
            <label className="re-label">Rate Type *</label>
            <div className="re-type-toggle">
              {RATE_TYPES.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  className={`re-type-btn${form.rate_type === key ? ' re-type-btn--active' : ''}`}
                  onClick={() => { setForm((f) => ({ ...f, rate_type: key })); setAmountTouched(false); }}
                  disabled={selectedProduct && !selectedProduct[`${key}_rate`]}
                >
                  {label}{selectedProduct?.[`${key}_rate`] ? ` (₹${selectedProduct[`${key}_rate`]})` : ''}
                </button>
              ))}
            </div>
          </div>

          <div className="re-row">
            {/* Start Date */}
            <div className="re-field">
              <label className="re-label">Start Date *</label>
              <input
                type="datetime-local"
                className="re-input"
                value={form.start_date}
                onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
              />
            </div>

            {/* End Date */}
            <div className="re-field">
              <label className="re-label">End Date *</label>
              <input
                type="datetime-local"
                className="re-input"
                value={form.end_date}
                onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
              />
            </div>
          </div>

          <div className="re-row">
            {/* Collected By */}
            <div className="re-field">
              <label className="re-label">Collected By</label>
              {form.collectorDisplay ? (
                <div className="re-selected-pill">
                  {form.collectorDisplay}
                  <button type="button" className="re-pill-clear" onClick={() => setForm((f) => ({ ...f, collected_by: '', collectorDisplay: '' }))}>×</button>
                </div>
              ) : (
                <select
                  className="re-input"
                  value={form.collected_by}
                  onChange={(e) => {
                    const m = members.find((x) => String(x.id) === e.target.value);
                    setForm((f) => ({ ...f, collected_by: e.target.value, collectorDisplay: m ? `${m.name} (${m.member_id})` : '' }));
                  }}
                >
                  <option value="">Select collector…</option>
                  {sortByMemberId(members).map((m) => (
                    <option key={m.id} value={m.id}>{m.name} ({m.member_id})</option>
                  ))}
                </select>
              )}
            </div>

            {/* Amount */}
            <div className="re-field">
              <label className="re-label">Amount (₹) *</label>
              <input
                type="number"
                className="re-input"
                min="1"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => { setAmountTouched(true); setForm((f) => ({ ...f, amount: e.target.value })); }}
              />
              <span className="re-hint">Auto-calculated from rate × duration (minimum: one day's rate) — you can edit it.</span>
            </div>
          </div>

          <div className="re-row">
            {/* Advance Amount */}
            <div className="re-field">
              <label className="re-label">Advance Amount (₹)</label>
              <input
                type="number"
                className="re-input"
                min="0"
                step="0.01"
                placeholder="0.00 (optional)"
                value={form.advance_amount}
                onChange={(e) => setForm((f) => ({ ...f, advance_amount: e.target.value }))}
              />
              <span className="re-hint">Optional — collected now; the balance is settled when the item is returned.</span>
            </div>

            {/* Advance Payment Type */}
            {Number(form.advance_amount) > 0 && (
              <div className="re-field">
                <label className="re-label">Advance Payment Type *</label>
                <div className="re-type-toggle">
                  <button
                    type="button"
                    className={`re-type-btn${form.advance_payment_type === 'cash' ? ' re-type-btn--active' : ''}`}
                    onClick={() => setForm((f) => ({ ...f, advance_payment_type: 'cash' }))}
                  >
                    Cash
                  </button>
                  <button
                    type="button"
                    className={`re-type-btn${form.advance_payment_type === 'qr' ? ' re-type-btn--active' : ''}`}
                    onClick={() => setForm((f) => ({ ...f, advance_payment_type: 'qr' }))}
                  >
                    QR Code
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="re-field">
            <label className="re-label">Notes</label>
            <textarea
              className="re-input re-textarea"
              placeholder="Optional remarks…"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
            />
          </div>

          <button type="submit" className="re-submit" disabled={submitting}>
            {submitting ? 'Recording…' : 'Record Rental'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default RentalEntry;
