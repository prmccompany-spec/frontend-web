import { useState, useEffect } from 'react';
import { getCategories, createPayment } from '../../../services/paymentService';
import { getMembers } from '../../../services/memberService';
import './PaymentEntry.css';

const today = () => new Date().toISOString().slice(0, 10);

function PaymentEntry() {
  const [categories, setCategories] = useState([]);
  const [members, setMembers] = useState([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [form, setForm] = useState({
    member_id: '',
    memberDisplay: '',
    category_id: '',
    amount: '',
    payment_date: today(),
    collected_by: '',
    collectorDisplay: '',
    notes: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
    getMembers().then((res) => setMembers(res.data?.data ?? [])).catch(() => {});
  }, []);

  const filteredMembers = members.filter((m) => {
    const q = memberSearch.toLowerCase();
    return (
      m.name?.toLowerCase().includes(q) ||
      m.member_id?.toLowerCase().includes(q)
    );
  }).slice(0, 8);

  const selectMember = (m, field) => {
    if (field === 'member_id') {
      setForm((f) => ({ ...f, member_id: m.id, memberDisplay: `${m.name} (${m.member_id})` }));
      setMemberSearch('');
    } else {
      setForm((f) => ({ ...f, collected_by: m.id, collectorDisplay: `${m.name} (${m.member_id})` }));
    }
    setShowSuggestions(false);
  };

  const handleCategoryChange = (e) => {
    const cat = categories.find((c) => String(c.id) === e.target.value);
    setForm((f) => ({
      ...f,
      category_id: e.target.value,
      amount: cat?.default_amount ? String(cat.default_amount) : f.amount,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!form.member_id) return setError('Please select a member.');
    if (!form.collected_by) return setError('Please select who collected the payment.');
    if (!form.category_id) return setError('Please select a payment category.');
    if (!form.amount || Number(form.amount) <= 0) return setError('Enter a valid amount.');

    setSubmitting(true);
    try {
      const res = await createPayment({
        member_id: form.member_id,
        category_id: Number(form.category_id),
        amount: Number(form.amount),
        payment_date: form.payment_date,
        collected_by: form.collected_by,
        notes: form.notes || null,
      });
      setResult(res);
      setForm({
        member_id: '',
        memberDisplay: '',
        category_id: '',
        amount: '',
        payment_date: today(),
        collected_by: '',
        collectorDisplay: '',
        notes: '',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record payment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-content">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Record Cash Payment</h1>
        <p className="admin-page-subtitle">Enter details to record a cash payment collected from a member</p>
      </div>

      <div className="pe-card">
        {result && (
          <div className="pe-success">
            Payment recorded successfully! Reference: <strong>{result.payment_ref}</strong>
            <button className="pe-success-close" onClick={() => setResult(null)}>×</button>
          </div>
        )}
        {error && <div className="pe-error">{error}</div>}

        <form className="pe-form" onSubmit={handleSubmit}>
          {/* Member */}
          <div className="pe-field">
            <label className="pe-label">Member *</label>
            {form.memberDisplay ? (
              <div className="pe-selected-pill">
                {form.memberDisplay}
                <button type="button" className="pe-pill-clear" onClick={() => setForm((f) => ({ ...f, member_id: '', memberDisplay: '' }))}>×</button>
              </div>
            ) : (
              <div className="pe-search-wrap">
                <input
                  className="pe-input"
                  placeholder="Search by name or member ID…"
                  value={memberSearch}
                  onChange={(e) => { setMemberSearch(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  autoComplete="off"
                />
                {showSuggestions && memberSearch && filteredMembers.length > 0 && (
                  <ul className="pe-suggestions">
                    {filteredMembers.map((m) => (
                      <li key={m.id} onMouseDown={() => selectMember(m, 'member_id')}>
                        <span className="pe-sug-name">{m.name}</span>
                        <span className="pe-sug-id">{m.member_id}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Collected By */}
          <div className="pe-field">
            <label className="pe-label">Collected By *</label>
            {form.collectorDisplay ? (
              <div className="pe-selected-pill">
                {form.collectorDisplay}
                <button type="button" className="pe-pill-clear" onClick={() => setForm((f) => ({ ...f, collected_by: '', collectorDisplay: '' }))}>×</button>
              </div>
            ) : (
              <select
                className="pe-input"
                value={form.collected_by}
                onChange={(e) => {
                  const m = members.find((x) => String(x.id) === e.target.value);
                  setForm((f) => ({ ...f, collected_by: e.target.value, collectorDisplay: m ? `${m.name} (${m.member_id})` : '' }));
                }}
              >
                <option value="">Select collector…</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} ({m.member_id})</option>
                ))}
              </select>
            )}
          </div>

          <div className="pe-row">
            {/* Category */}
            <div className="pe-field">
              <label className="pe-label">Payment Category *</label>
              <select className="pe-input" value={form.category_id} onChange={handleCategoryChange}>
                <option value="">Select category…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div className="pe-field">
              <label className="pe-label">Amount (₹) *</label>
              <input
                type="number"
                className="pe-input"
                min="1"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              />
            </div>
          </div>

          {/* Date */}
          <div className="pe-field pe-field--half">
            <label className="pe-label">Payment Date *</label>
            <input
              type="date"
              className="pe-input"
              value={form.payment_date}
              onChange={(e) => setForm((f) => ({ ...f, payment_date: e.target.value }))}
            />
          </div>

          {/* Notes */}
          <div className="pe-field">
            <label className="pe-label">Notes</label>
            <textarea
              className="pe-input pe-textarea"
              placeholder="Optional remarks…"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
            />
          </div>

          <button type="submit" className="pe-submit" disabled={submitting}>
            {submitting ? 'Recording…' : 'Record Payment'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default PaymentEntry;
