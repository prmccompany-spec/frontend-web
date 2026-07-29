import { useState, useEffect, useCallback } from 'react';
import { getCategories, createPayment, collectDues, getPayments } from '../../../services/paymentService';
import { getMembers, getPendingPayments } from '../../../services/memberService';
import { matchesIdOrText, sortByMemberId } from '../../../utils/memberSearch';
import { showToast } from '../../../components/Toast/toastBus';
import './PaymentEntry.css';

// Local calendar date, not UTC — toISOString() converts to UTC first, so
// for IST (UTC+5:30) it still shows "yesterday" for the first 5.5 hours
// after local midnight.
const today = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const fmt = (val) =>
  Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

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
    payment_type: 'cash',
    collected_by: '',
    collectorDisplay: '',
    notes: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // ── Selected member's dues + payment history panel ──
  const [memberDues, setMemberDues] = useState([]);
  const [memberHistory, setMemberHistory] = useState([]);
  const [panelLoading, setPanelLoading] = useState(false);
  const [selectedDueIds, setSelectedDueIds] = useState([]);
  const [collecting, setCollecting] = useState(false);
  const [collectError, setCollectError] = useState('');

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
    getMembers().then((res) => setMembers(res.data?.data ?? [])).catch(() => {});
  }, []);

  const loadMemberPanel = useCallback((memberId) => {
    if (!memberId) {
      setMemberDues([]);
      setMemberHistory([]);
      return;
    }
    setPanelLoading(true);
    Promise.all([
      getPendingPayments(memberId, 'pending'),
      getPayments({ member_id: memberId }),
    ])
      .then(([duesRes, historyRes]) => {
        setMemberDues(duesRes.data.data ?? []);
        setMemberHistory(historyRes.data ?? []);
      })
      .catch(() => {
        setMemberDues([]);
        setMemberHistory([]);
      })
      .finally(() => setPanelLoading(false));
  }, []);

  useEffect(() => {
    loadMemberPanel(form.member_id);
    setSelectedDueIds([]);
    setCollectError('');
  }, [form.member_id, loadMemberPanel]);

  const toggleDue = (id) =>
    setSelectedDueIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  const dueTotal = (ids) =>
    memberDues.filter((d) => ids.includes(d.id)).reduce((s, d) => s + Number(d.amount), 0);

  const handleCollectDues = async (ids) => {
    setCollectError('');
    if (!form.member_id) return setCollectError('Select a member first.');
    if (!form.collected_by) return setCollectError('Select who is collecting before clearing dues.');
    if (ids.length === 0) return;

    setCollecting(true);
    try {
      await collectDues({
        member_id: form.member_id,
        pending_payment_ids: ids,
        collected_by: form.collected_by,
        payment_date: form.payment_date,
        payment_type: form.payment_type,
        notes: form.notes || null,
      });
      showToast(`Cleared ${ids.length} due${ids.length !== 1 ? 's' : ''} successfully.`, 'success');
      setSelectedDueIds([]);
      loadMemberPanel(form.member_id);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to clear due(s).';
      setCollectError(msg);
      showToast(msg, 'error');
    } finally {
      setCollecting(false);
    }
  };

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
        payment_type: form.payment_type,
        collected_by: form.collected_by,
        notes: form.notes || null,
      });
      setResult(res);
      showToast('Payment recorded successfully.', 'success');
      setForm({
        member_id: '',
        memberDisplay: '',
        category_id: '',
        amount: '',
        payment_date: today(),
        payment_type: 'cash',
        collected_by: '',
        collectorDisplay: '',
        notes: '',
      });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to record payment.';
      setError(msg);
      showToast(msg, 'error');
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

      <div className="pe-layout">
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
                {sortByMemberId(members).map((m) => (
                  <option key={m.id} value={m.id}>{m.name} ({m.member_id})</option>
                ))}
              </select>
            )}
          </div>

          {/* Payment Type */}
          <div className="pe-field">
            <label className="pe-label">Payment Type *</label>
            <div className="pe-type-toggle">
              <button
                type="button"
                className={`pe-type-btn${form.payment_type === 'cash' ? ' pe-type-btn--active' : ''}`}
                onClick={() => setForm((f) => ({ ...f, payment_type: 'cash' }))}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="6" width="20" height="12" rx="2" />
                  <circle cx="12" cy="12" r="2" />
                  <path d="M6 12h.01M18 12h.01" />
                </svg>
                Cash
              </button>
              <button
                type="button"
                className={`pe-type-btn${form.payment_type === 'qr' ? ' pe-type-btn--active' : ''}`}
                onClick={() => setForm((f) => ({ ...f, payment_type: 'qr' }))}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                  <rect x="14" y="14" width="3" height="3" />
                  <line x1="19" y1="14" x2="19" y2="14" strokeWidth="3" strokeLinecap="round" />
                  <line x1="19" y1="19" x2="19" y2="19" strokeWidth="3" strokeLinecap="round" />
                </svg>
                QR Code
              </button>
            </div>
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

      {form.member_id && (
        <div className="pe-card pe-panel">
          <h3 className="pe-panel-title">{form.memberDisplay || 'Member'}</h3>

          {panelLoading ? (
            <div className="pe-panel-loading">Loading…</div>
          ) : (
            <>
              <div className="pe-panel-section">
                <div className="pe-panel-section-head">
                  <span>Pending Dues</span>
                  {memberDues.length > 0 && (
                    <span className="pe-panel-total">Total: ₹{fmt(memberDues.reduce((s, d) => s + Number(d.amount), 0))}</span>
                  )}
                </div>

                {collectError && <div className="pe-error">{collectError}</div>}

                {memberDues.length === 0 ? (
                  <p className="pe-panel-empty">No pending dues. Fully settled!</p>
                ) : (
                  <>
                    <ul className="pe-due-list">
                      {memberDues.map((d) => (
                        <li key={d.id} className="pe-due-item">
                          <label className="pe-due-check">
                            <input
                              type="checkbox"
                              checked={selectedDueIds.includes(d.id)}
                              onChange={() => toggleDue(d.id)}
                            />
                          </label>
                          <div className="pe-due-info">
                            <span className="pe-due-title">{d.title}</span>
                            <span className="pe-due-meta">
                              {d.category_name}{d.due_date && ` · due ${fmtDate(d.due_date)}`}
                            </span>
                          </div>
                          <div className="pe-due-actions">
                            <span className="pe-due-amount">₹{fmt(d.amount)}</span>
                            <button
                              type="button"
                              className="pe-due-clear"
                              disabled={collecting}
                              onClick={() => handleCollectDues([d.id])}
                            >
                              Clear
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>

                    <div className="pe-panel-footer">
                      <button
                        type="button"
                        className="pe-due-clear-selected"
                        disabled={collecting || selectedDueIds.length === 0}
                        onClick={() => handleCollectDues(selectedDueIds)}
                      >
                        {collecting ? 'Clearing…' : `Clear Selected (₹${fmt(dueTotal(selectedDueIds))})`}
                      </button>
                      <button
                        type="button"
                        className="pe-collect-all"
                        disabled={collecting}
                        onClick={() => handleCollectDues(memberDues.map((d) => d.id))}
                      >
                        {collecting ? 'Collecting…' : `Collect All Due (₹${fmt(memberDues.reduce((s, d) => s + Number(d.amount), 0))})`}
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className="pe-panel-section">
                <div className="pe-panel-section-head"><span>Payment History</span></div>
                {memberHistory.length === 0 ? (
                  <p className="pe-panel-empty">No payments recorded yet.</p>
                ) : (
                  <ul className="pe-history-list">
                    {memberHistory.map((p) => (
                      <li key={p.id} className="pe-history-item">
                        <div className="pe-due-info">
                          <span className="pe-due-title">{p.category_name}</span>
                          <span className="pe-due-meta">
                            {fmtDate(p.payment_date)} · {p.payment_type === 'qr' ? 'QR' : 'Cash'} · {p.payment_ref}
                          </span>
                        </div>
                        <span className="pe-due-amount">₹{fmt(p.amount)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      )}
      </div>
    </div>
  );
}

export default PaymentEntry;
