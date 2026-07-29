import { useState, useEffect } from 'react';
import { getCategories } from '../../../services/paymentService';
import { getMembers, createPendingPayment } from '../../../services/memberService';
import { matchesIdOrText, sortByMemberId } from '../../../utils/memberSearch';
import { showToast } from '../../../components/Toast/toastBus';
import './AssignDue.css';

// Local calendar date, not UTC — toISOString() converts to UTC first, so
// for IST (UTC+5:30) it still shows "yesterday" for the first 5.5 hours
// after local midnight.
const today = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

function AssignDue() {
  const [categories, setCategories] = useState([]);
  const [members, setMembers] = useState([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  const [form, setForm] = useState({
    category_id: '',
    title: '',
    amount: '',
    due_date: '',
    notes: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
    getMembers().then((res) => setMembers(res.data?.data ?? [])).catch(() => {});
  }, []);

  const filteredMembers = sortByMemberId(
    members.filter((m) => matchesIdOrText(m.member_id, [m.name], memberSearch))
  );

  const handleCategoryChange = (e) => {
    const cat = categories.find((c) => String(c.id) === e.target.value);
    setForm((f) => ({
      ...f,
      category_id: e.target.value,
      title: f.title || cat?.name || '',
      amount: f.amount || (cat?.default_amount ? String(cat.default_amount) : ''),
    }));
  };

  const toggleMember = (id) =>
    setSelectedIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  const allFilteredSelected = filteredMembers.length > 0 &&
    filteredMembers.every((m) => selectedIds.includes(m.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds((ids) => ids.filter((id) => !filteredMembers.some((m) => m.id === id)));
    } else {
      setSelectedIds((ids) => [...new Set([...ids, ...filteredMembers.map((m) => m.id)])]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!form.category_id) return setError('Please select a payment category.');
    if (!form.title.trim()) return setError('Please enter a due title.');
    if (!form.amount || Number(form.amount) <= 0) return setError('Enter a valid amount.');
    if (selectedIds.length === 0) return setError('Select at least one member.');

    setSubmitting(true);
    let succeeded = 0;
    try {
      for (const memberId of selectedIds) {
        await createPendingPayment({
          member_id: memberId,
          category_id: Number(form.category_id),
          title: form.title.trim(),
          amount: Number(form.amount),
          due_date: form.due_date || null,
          notes: form.notes || null,
        });
        succeeded += 1;
      }
      setResult({ count: succeeded, amount: Number(form.amount) });
      showToast(`Due assigned to ${succeeded} member${succeeded !== 1 ? 's' : ''} successfully.`, 'success');
      setForm({ category_id: '', title: '', amount: '', due_date: '', notes: '' });
      setSelectedIds([]);
    } catch (err) {
      const msg = `${err.response?.data?.message ?? 'Failed to assign due.'} (${succeeded} of ${selectedIds.length} members were assigned before this failed.)`;
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-content">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Assign Due</h1>
        <p className="admin-page-subtitle">Assign a due to one, several, or all members at once</p>
      </div>

      <div className="ad-layout">
        <div className="ad-card">
          {result && (
            <div className="ad-success">
              Assigned ₹{result.amount.toLocaleString('en-IN')} due to {result.count} member{result.count !== 1 ? 's' : ''}.
              <button className="ad-success-close" onClick={() => setResult(null)}>×</button>
            </div>
          )}
          {error && <div className="ad-error">{error}</div>}

          <form className="ad-form" onSubmit={handleSubmit}>
            <div className="ad-row">
              <div className="ad-field">
                <label className="ad-label">Payment Category *</label>
                <select className="ad-input" value={form.category_id} onChange={handleCategoryChange}>
                  <option value="">Select category…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="ad-field">
                <label className="ad-label">Amount (₹) *</label>
                <input
                  type="number"
                  className="ad-input"
                  min="1"
                  step="0.01"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                />
              </div>
            </div>

            <div className="ad-field">
              <label className="ad-label">Due Title *</label>
              <input
                className="ad-input"
                placeholder="e.g. Annual Fee 2026"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>

            <div className="ad-field ad-field--half">
              <label className="ad-label">Due Date</label>
              <input
                type="date"
                className="ad-input"
                min={today()}
                value={form.due_date}
                onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
              />
            </div>

            <div className="ad-field">
              <label className="ad-label">Notes</label>
              <textarea
                className="ad-input ad-textarea"
                placeholder="Optional remarks…"
                rows={2}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>

            <button type="submit" className="ad-submit" disabled={submitting}>
              {submitting ? 'Assigning…' : `Assign Due${selectedIds.length ? ` to ${selectedIds.length} Member${selectedIds.length !== 1 ? 's' : ''}` : ''}`}
            </button>
          </form>
        </div>

        <div className="ad-card ad-card--members">
          <div className="ad-members-header">
            <label className="ad-label">Members ({selectedIds.length} selected)</label>
            <button type="button" className="ad-select-all" onClick={toggleSelectAll}>
              {allFilteredSelected ? 'Clear All' : 'Select All'}
            </button>
          </div>
          <input
            className="ad-input"
            placeholder="Search by name or member ID…"
            value={memberSearch}
            onChange={(e) => setMemberSearch(e.target.value)}
          />
          <div className="ad-member-list">
            {filteredMembers.length === 0 ? (
              <p className="ad-empty">No members found.</p>
            ) : (
              filteredMembers.map((m) => (
                <label className="ad-member-row" key={m.id}>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(m.id)}
                    onChange={() => toggleMember(m.id)}
                  />
                  <span className="ad-member-name">{m.name}</span>
                  <span className="ad-member-id">{m.member_id}</span>
                </label>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AssignDue;
