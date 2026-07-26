import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRentalProducts, createRental } from '../../../services/rentalService';
import { getMembers } from '../../../services/memberService';
import { matchesIdOrText, sortByMemberId } from '../../../utils/memberSearch';
import './RentalEntry.css';

const nowLocal = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

function RentalEntry() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [members, setMembers] = useState([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [form, setForm] = useState({
    product_id: '',
    member_id: '',
    memberDisplay: '',
    rate_type: 'day',
    start_date: nowLocal(),
    end_date: '',
    amount: '',
    payment_type: 'cash',
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
    return form.rate_type === 'day' ? selectedProduct.per_day_rate : selectedProduct.per_hour_rate;
  }, [selectedProduct, form.rate_type]);

  // Auto-compute suggested amount from rate x duration, unless the admin has manually edited it.
  useEffect(() => {
    if (amountTouched) return;
    if (!rate || !form.start_date || !form.end_date) return;

    const start = new Date(form.start_date);
    const end = new Date(form.end_date);
    if (end <= start) return;

    const ms = end - start;
    const units = form.rate_type === 'day'
      ? Math.ceil(ms / (1000 * 60 * 60 * 24))
      : Math.ceil(ms / (1000 * 60 * 60));

    setForm((f) => ({ ...f, amount: (Math.max(units, 1) * Number(rate)).toFixed(2) }));
  }, [rate, form.start_date, form.end_date, form.rate_type, amountTouched]);

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
    if (!form.member_id) return setError('Please select a member.');
    if (!form.end_date) return setError('Please set an end date/time.');
    if (new Date(form.end_date) <= new Date(form.start_date)) return setError('End date must be after start date.');
    if (!form.amount || Number(form.amount) <= 0) return setError('Enter a valid amount.');

    setSubmitting(true);
    try {
      await createRental({
        product_id: Number(form.product_id),
        member_id: form.member_id,
        rate_type: form.rate_type,
        start_date: form.start_date,
        end_date: form.end_date,
        amount: Number(form.amount),
        payment_type: form.payment_type,
        collected_by: form.collected_by || null,
        notes: form.notes || null,
      });
      navigate('/admin/rentals/history');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record rental.');
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-content">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Record Rental</h1>
        <p className="admin-page-subtitle">Book a product for a member and collect the rental amount</p>
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

          {/* Member */}
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

          {/* Rate Type */}
          <div className="re-field">
            <label className="re-label">Rate Type *</label>
            <div className="re-type-toggle">
              <button
                type="button"
                className={`re-type-btn${form.rate_type === 'day' ? ' re-type-btn--active' : ''}`}
                onClick={() => { setForm((f) => ({ ...f, rate_type: 'day' })); setAmountTouched(false); }}
                disabled={selectedProduct && !selectedProduct.per_day_rate}
              >
                Per Day{selectedProduct?.per_day_rate ? ` (₹${selectedProduct.per_day_rate})` : ''}
              </button>
              <button
                type="button"
                className={`re-type-btn${form.rate_type === 'hour' ? ' re-type-btn--active' : ''}`}
                onClick={() => { setForm((f) => ({ ...f, rate_type: 'hour' })); setAmountTouched(false); }}
                disabled={selectedProduct && !selectedProduct.per_hour_rate}
              >
                Per Hour{selectedProduct?.per_hour_rate ? ` (₹${selectedProduct.per_hour_rate})` : ''}
              </button>
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

          {/* Payment Type */}
          <div className="re-field">
            <label className="re-label">Payment Type *</label>
            <div className="re-type-toggle">
              <button
                type="button"
                className={`re-type-btn${form.payment_type === 'cash' ? ' re-type-btn--active' : ''}`}
                onClick={() => setForm((f) => ({ ...f, payment_type: 'cash' }))}
              >
                Cash
              </button>
              <button
                type="button"
                className={`re-type-btn${form.payment_type === 'qr' ? ' re-type-btn--active' : ''}`}
                onClick={() => setForm((f) => ({ ...f, payment_type: 'qr' }))}
              >
                QR Code
              </button>
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
              <span className="re-hint">Auto-calculated from rate × duration — you can edit it.</span>
            </div>
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
