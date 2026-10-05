import { useState, useEffect, useCallback } from 'react';
import { getPayments, getCategories, updatePayment } from '../../../services/paymentService';
import { matchesIdOrText } from '../../../utils/memberSearch';
import { exportTableToPdf } from '../../../utils/pdfExport';
import ExportPdfButton from '../../../components/ExportPdfButton/ExportPdfButton';
import { showToast } from '../../../components/Toast/toastBus';
import './PaymentHistory.css';

const fmt = (val) =>
  Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

function PaymentModal({ categories, payment, onClose, onSaved }) {
  const [form, setForm] = useState({
    category_id: String(payment.category_id),
    amount: String(payment.amount),
    payment_date: payment.payment_date?.slice(0, 10) ?? '',
    payment_type: payment.payment_type,
    notes: payment.notes ?? '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.category_id) return setError('Please select a payment category.');
    if (!form.amount || Number(form.amount) <= 0) return setError('Enter a valid amount.');
    if (!form.payment_date) return setError('Please select a payment date.');

    setSubmitting(true);
    try {
      await updatePayment(payment.id, {
        category_id: Number(form.category_id),
        amount: Number(form.amount),
        payment_date: form.payment_date,
        payment_type: form.payment_type,
        notes: form.notes,
      });
      showToast('Payment updated successfully.', 'success');
      onSaved();
    } catch (err) {
      const message = err.response?.data?.message ?? 'Failed to update payment.';
      setError(message);
      showToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ph-overlay" onClick={onClose}>
      <div className="ph-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ph-modal-header">
          <div>
            <h2 className="ph-modal-title">Edit Payment</h2>
            <p className="ph-modal-subtitle">{payment.payment_ref} · {payment.member_name}</p>
          </div>
          <button type="button" className="ph-modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <form className="ph-modal-body" onSubmit={handleSubmit}>
          {error && <div className="ph-error">{error}</div>}
          <div className="ph-field">
            <label className="ph-label">Payment Category *</label>
            <select className="ph-input" value={form.category_id} onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}>
              <option value="">Select category…</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </div>
          <div className="ph-field">
            <label className="ph-label">Amount (₹) *</label>
            <input type="number" min="1" step="0.01" className="ph-input" placeholder="0.00"
              value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
          </div>
          <div className="ph-field">
            <label className="ph-label">Payment Date *</label>
            <input type="date" className="ph-input" value={form.payment_date}
              onChange={(e) => setForm((f) => ({ ...f, payment_date: e.target.value }))} />
          </div>
          <div className="ph-field">
            <label className="ph-label">Payment Type *</label>
            <select className="ph-input" value={form.payment_type}
              onChange={(e) => setForm((f) => ({ ...f, payment_type: e.target.value }))}>
              <option value="cash">Cash</option>
              <option value="qr">QR Code</option>
            </select>
          </div>
          <div className="ph-field">
            <label className="ph-label">Notes</label>
            <textarea className="ph-input ph-textarea" rows={3} placeholder="Optional remarks…"
              value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </div>
          <div className="ph-modal-footer">
            <button type="button" className="ph-btn ph-btn--ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="ph-btn ph-btn--primary" disabled={submitting}>
              {submitting ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PaymentHistory() {
  const [payments, setPayments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPayment, setEditingPayment] = useState(null);

  const [filters, setFilters] = useState({
    category_id: '',
    date_from: '',
    date_to: '',
    search: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.category_id) params.category_id = filters.category_id;
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;
      const res = await getPayments(params);
      setPayments(res.data ?? []);
    } catch {
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [filters.category_id, filters.date_from, filters.date_to]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { getCategories().then(setCategories).catch(() => {}); }, []);

  const displayed = payments.filter((p) =>
    matchesIdOrText(p.member_code, [p.member_name, p.payment_ref], filters.search)
  );

  const total = displayed.reduce((s, p) => s + Number(p.amount), 0);

  const activeFilterParts = [];
  if (filters.category_id) activeFilterParts.push(categories.find((c) => String(c.id) === filters.category_id)?.name || 'Category');
  if (filters.date_from) activeFilterParts.push(`From ${filters.date_from}`);
  if (filters.date_to) activeFilterParts.push(`To ${filters.date_to}`);
  if (filters.search) activeFilterParts.push(`Search "${filters.search}"`);

  const handleExport = () => exportTableToPdf({
    title: 'Payment History',
    subtitle: activeFilterParts.length ? activeFilterParts.join(' · ') : 'All records',
    summary: [
      { label: 'Payments', value: displayed.length },
      { label: 'Total', value: `Rs. ${fmt(total)}` },
    ],
    columns: [
      { header: 'Ref', key: 'ref' },
      { header: 'Member', key: 'member' },
      { header: 'Category', key: 'category' },
      { header: 'Type', key: 'type' },
      { header: 'Amount', key: 'amount', align: 'right' },
      { header: 'Date', key: 'date' },
      { header: 'Collected By', key: 'collectedBy' },
      { header: 'Notes', key: 'notes' },
    ],
    rows: displayed.map((p) => ({
      ref: p.payment_ref,
      member: `${p.member_name}${p.member_code ? ` (${p.member_code})` : ''}`,
      category: p.category_name,
      type: p.payment_type === 'qr' ? 'QR' : 'Cash',
      amount: `Rs. ${fmt(p.amount)}`,
      date: fmtDate(p.payment_date),
      collectedBy: p.collected_by_name,
      notes: p.notes || '—',
    })),
    filename: 'payment-history',
  });

  const handleSaved = () => {
    setEditingPayment(null);
    load();
  };

  return (
    <div className="admin-content ph-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Payment History</h1>
        <p className="admin-page-subtitle">View and filter all recorded cash payments</p>
      </div>

      <div className="ph-filters">
        <input
          className="ph-input"
          placeholder="Search name / member ID / ref…"
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
        />
        <select
          className="ph-input"
          value={filters.category_id}
          onChange={(e) => setFilters((f) => ({ ...f, category_id: e.target.value }))}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <input
          type="date"
          className="ph-input"
          value={filters.date_from}
          onChange={(e) => setFilters((f) => ({ ...f, date_from: e.target.value }))}
          title="From date"
        />
        <input
          type="date"
          className="ph-input"
          value={filters.date_to}
          onChange={(e) => setFilters((f) => ({ ...f, date_to: e.target.value }))}
          title="To date"
        />
        {(filters.category_id || filters.date_from || filters.date_to || filters.search) && (
          <button
            className="ph-clear"
            onClick={() => setFilters({ category_id: '', date_from: '', date_to: '', search: '' })}
          >
            Clear
          </button>
        )}
        <ExportPdfButton onExport={handleExport} disabled={displayed.length === 0} />
      </div>

      {loading ? (
        <div className="ph-loading">Loading payments…</div>
      ) : displayed.length === 0 ? (
        <div className="ph-empty">No payments found.</div>
      ) : (
        <>
          <div className="ph-summary-bar">
            <span>{displayed.length} payment{displayed.length !== 1 ? 's' : ''}</span>
            <span className="ph-summary-total">Total: <strong>₹{fmt(total)}</strong></span>
          </div>

          <div className="ph-table-wrap">
            <table className="ph-table">
              <thead>
                <tr>
                  <th>Ref</th>
                  <th>Member</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Collected By</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((p) => (
                  <tr key={p.id}>
                    <td><span className="ph-ref">{p.payment_ref}</span></td>
                    <td>
                      <div className="ph-member-name">{p.member_name}</div>
                      <div className="ph-member-code">{p.member_code}</div>
                    </td>
                    <td>{p.category_name}</td>
                    <td>
                      <span className={`ph-type-badge ph-type-badge--${p.payment_type}`}>
                        {p.payment_type === 'qr' ? 'QR' : 'Cash'}
                      </span>
                    </td>
                    <td className="ph-amount">₹{fmt(p.amount)}</td>
                    <td>{fmtDate(p.payment_date)}</td>
                    <td>{p.collected_by_name}</td>
                    <td className="ph-notes">{p.notes || '—'}</td>
                    <td>
                      {p.pending_payment_id ? (
                        <span className="ph-locked">Due cleared</span>
                      ) : (
                        <button type="button" className="ph-row-btn" onClick={() => setEditingPayment(p)}>Edit</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {editingPayment && (
        <PaymentModal
          categories={categories}
          payment={editingPayment}
          onClose={() => setEditingPayment(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

export default PaymentHistory;
