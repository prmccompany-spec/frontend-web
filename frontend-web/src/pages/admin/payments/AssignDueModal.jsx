import { useState, useEffect, useCallback } from 'react';
import { getCategories } from '../../../services/paymentService';
import { getPendingPayments, createPendingPayment, deletePendingPayment } from '../../../services/memberService';
import './AssignDueModal.css';

// Local calendar date, not UTC — toISOString() converts to UTC first, so
// for IST (UTC+5:30) it still shows "yesterday" for the first 5.5 hours
// after local midnight.
const today = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

function AssignDueModal({ member, onClose }) {
  const [pendings, setPendings] = useState([]);
  const [pendingsLoading, setPendingsLoading] = useState(true);
  const [pendingBusy, setPendingBusy] = useState(false);
  const [listError, setListError] = useState('');

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ category_id: '', title: '', amount: '', due_date: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [assignedMsg, setAssignedMsg] = useState('');

  const loadPendings = useCallback(() => {
    setPendingsLoading(true);
    getPendingPayments(member.id)
      .then((res) => setPendings(res.data?.data ?? []))
      .catch(() => setPendings([]))
      .finally(() => setPendingsLoading(false));
  }, [member.id]);

  useEffect(() => { loadPendings(); }, [loadPendings]);
  useEffect(() => { getCategories().then(setCategories).catch(() => {}); }, []);

  const handleDeletePending = async (id) => {
    setListError('');
    setPendingBusy(true);
    try {
      await deletePendingPayment(id);
      loadPendings();
    } catch (err) {
      setListError(err.response?.data?.message ?? 'Failed to delete pending payment.');
    } finally {
      setPendingBusy(false);
    }
  };

  const handleCategoryChange = (e) => {
    const cat = categories.find((c) => String(c.id) === e.target.value);
    setForm((f) => ({
      ...f,
      category_id: e.target.value,
      title: f.title || cat?.name || '',
      amount: f.amount || (cat?.default_amount ? String(cat.default_amount) : ''),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setAssignedMsg('');

    if (!form.category_id) return setFormError('Please select a payment category.');
    if (!form.title.trim()) return setFormError('Please enter a due title.');
    if (!form.amount || Number(form.amount) <= 0) return setFormError('Enter a valid amount.');

    setSubmitting(true);
    try {
      await createPendingPayment({
        member_id: member.id,
        category_id: Number(form.category_id),
        title: form.title.trim(),
        amount: Number(form.amount),
        due_date: form.due_date || null,
        notes: form.notes || null,
      });
      setAssignedMsg(`Assigned ${form.title.trim()} — ₹${Number(form.amount).toLocaleString('en-IN')}.`);
      setForm({ category_id: '', title: '', amount: '', due_date: '', notes: '' });
      loadPendings();
    } catch (err) {
      setFormError(err.response?.data?.message ?? 'Failed to assign due.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalPending = pendings
    .filter((p) => p.status === 'pending')
    .reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="adm-overlay" onClick={onClose}>
      <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="adm-header">
          <div>
            <h2 className="adm-title">Manage Dues</h2>
            <p className="adm-subtitle">{member.name} · {member.member_id}</p>
          </div>
          <button className="adm-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="adm-body">
          <div className="adm-section-label">Current Dues</div>
          {listError && <div className="adm-error">{listError}</div>}
          {pendingsLoading ? (
            <p className="adm-empty">Loading…</p>
          ) : pendings.length === 0 ? (
            <p className="adm-empty">No dues recorded for this member.</p>
          ) : (
            <div className="adm-pp-list">
              {pendings.map((p) => (
                <div className={`adm-pp-item ${p.status === 'paid' ? 'adm-pp-item--paid' : ''}`} key={p.id}>
                  <div className="adm-pp-info">
                    <span className="adm-pp-title">{p.title}</span>
                    <span className="adm-pp-meta">
                      ₹{Number(p.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      {p.due_date && ` · due ${new Date(p.due_date).toLocaleDateString('en-IN')}`}
                    </span>
                  </div>
                  <span className={`adm-pp-badge adm-pp-badge--${p.status}`}>{p.status}</span>
                  {p.status === 'pending' && (
                    <button type="button" className="adm-pp-delete"
                      disabled={pendingBusy} onClick={() => handleDeletePending(p.id)} aria-label="Delete due">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              <div className="adm-pp-total">Total pending: ₹{totalPending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            </div>
          )}

          <div className="adm-divider" />

          <div className="adm-section-label">Assign New Due</div>
          {assignedMsg && <div className="adm-success-banner">{assignedMsg}</div>}
          {formError && <div className="adm-error">{formError}</div>}

          <form className="adm-form" onSubmit={handleSubmit}>
            <div className="adm-row">
              <div className="adm-field">
                <label className="adm-label">Payment Category *</label>
                <select className="adm-input" value={form.category_id} onChange={handleCategoryChange}>
                  <option value="">Select category…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="adm-field">
                <label className="adm-label">Amount (₹) *</label>
                <input
                  type="number"
                  className="adm-input"
                  min="1"
                  step="0.01"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                />
              </div>
            </div>

            <div className="adm-field">
              <label className="adm-label">Due Title *</label>
              <input
                className="adm-input"
                placeholder="e.g. Annual Fee 2026"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>

            <div className="adm-field">
              <label className="adm-label">Due Date</label>
              <input
                type="date"
                className="adm-input"
                min={today()}
                value={form.due_date}
                onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
              />
            </div>

            <div className="adm-field">
              <label className="adm-label">Notes</label>
              <textarea
                className="adm-input adm-textarea"
                placeholder="Optional remarks…"
                rows={2}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>

            <div className="adm-footer">
              <button type="button" className="adm-btn adm-btn--ghost" onClick={onClose}>
                Close
              </button>
              <button type="submit" className="adm-btn adm-btn--primary" disabled={submitting}>
                {submitting ? 'Assigning…' : 'Assign Due'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AssignDueModal;
