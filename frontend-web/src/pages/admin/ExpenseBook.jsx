import { useState, useEffect, useCallback } from 'react';
import {
  getCategories,
  getExpenses,
  createExpense,
  updateExpense,
  getExpenseSummary,
} from '../../services/expenseService';
import { showToast } from '../../components/Toast/toastBus';
import { exportTableToPdf } from '../../utils/pdfExport';
import ExportPdfButton from '../../components/ExportPdfButton/ExportPdfButton';
import './ExpenseBook.css';

const fmt = (val) =>
  Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

function StatCard({ label, value, sub, accent }) {
  return (
    <div className={`eb-stat-card${accent ? ' eb-stat-card--accent' : ''}`}>
      <div className="eb-stat-value">{value}</div>
      <div className="eb-stat-label">{label}</div>
      {sub && <div className="eb-stat-sub">{sub}</div>}
    </div>
  );
}

function ExpenseModal({ categories, expense, onClose, onSaved }) {
  const isEdit = !!expense;
  const [form, setForm] = useState({
    category_id: expense?.category_id ?? '',
    amount: expense?.amount ?? '',
    reason: expense?.reason ?? '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.category_id) return setError('Please select a category.');
    if (!form.amount || Number(form.amount) <= 0) return setError('Enter a valid amount.');
    if (!form.reason.trim()) return setError('Please enter a reason.');

    setSubmitting(true);
    try {
      const payload = {
        category_id: Number(form.category_id),
        amount: Number(form.amount),
        reason: form.reason.trim(),
      };
      if (isEdit) {
        await updateExpense(expense.id, payload);
      } else {
        await createExpense(payload);
      }
      showToast(`Expense ${isEdit ? 'updated' : 'recorded'} successfully.`, 'success');
      onSaved();
    } catch (err) {
      const msg = err.response?.data?.message ?? `Failed to ${isEdit ? 'update' : 'record'} expense.`;
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="eb-overlay" onClick={onClose}>
      <div className="eb-modal" onClick={(e) => e.stopPropagation()}>
        <div className="eb-modal-header">
          <div>
            <h2 className="eb-modal-title">{isEdit ? 'Edit Expense' : 'Add Expense'}</h2>
            {isEdit && <p className="eb-modal-subtitle">Recorded {fmtDateTime(expense.created_at)} by {expense.created_by_name}</p>}
          </div>
          <button className="eb-modal-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form className="eb-modal-body" onSubmit={handleSubmit}>
          {error && <div className="eb-error">{error}</div>}

          <div className="eb-field">
            <label className="eb-label">Category *</label>
            <select className="eb-input" value={form.category_id}
              onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}>
              <option value="">Select category…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="eb-field">
            <label className="eb-label">Amount (₹) *</label>
            <input type="number" className="eb-input" min="1" step="0.01" placeholder="0.00"
              value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
          </div>

          <div className="eb-field">
            <label className="eb-label">Reason *</label>
            <textarea className="eb-input eb-textarea" rows={3} placeholder="What was this expense for?"
              value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} />
          </div>

          <div className="eb-modal-footer">
            <button type="button" className="eb-btn eb-btn--ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="eb-btn eb-btn--primary" disabled={submitting}>
              {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ExpenseBook() {
  const [categories, setCategories] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

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
      const res = await getExpenses(params);
      setExpenses(res.data ?? []);
    } catch {
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [filters.category_id, filters.date_from, filters.date_to]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { getCategories().then(setCategories).catch(() => {}); }, []);
  useEffect(() => { getExpenseSummary().then(setSummary).catch(() => setSummary(null)); }, []);

  const handleSaved = () => {
    setShowAdd(false);
    setEditingExpense(null);
    load();
    getExpenseSummary().then(setSummary).catch(() => {});
  };

  const displayed = expenses.filter((e) => {
    const q = filters.search.toLowerCase();
    return (
      !q ||
      e.reason?.toLowerCase().includes(q) ||
      e.category_name?.toLowerCase().includes(q) ||
      e.created_by_name?.toLowerCase().includes(q)
    );
  });

  const displayedTotal = displayed.reduce((s, e) => s + Number(e.amount), 0);
  const hasActiveFilters = !!(filters.category_id || filters.date_from || filters.date_to || filters.search);

  const clearFilters = () => setFilters({ category_id: '', date_from: '', date_to: '', search: '' });

  const activeFilterParts = [];
  if (filters.category_id) activeFilterParts.push(categories.find((c) => String(c.id) === filters.category_id)?.name || 'Category');
  if (filters.date_from) activeFilterParts.push(`From ${filters.date_from}`);
  if (filters.date_to) activeFilterParts.push(`To ${filters.date_to}`);
  if (filters.search) activeFilterParts.push(`Search "${filters.search}"`);

  const handleExport = () => exportTableToPdf({
    title: 'Expense Book',
    subtitle: activeFilterParts.length ? activeFilterParts.join(' · ') : 'All records',
    summary: [
      { label: 'Expenses', value: displayed.length },
      { label: 'Total', value: `Rs. ${fmt(displayedTotal)}` },
    ],
    columns: [
      { header: 'Date & Time', key: 'date' },
      { header: 'Category', key: 'category' },
      { header: 'Reason', key: 'reason' },
      { header: 'Amount', key: 'amount', align: 'right' },
      { header: 'Recorded By', key: 'recordedBy' },
    ],
    rows: displayed.map((e) => ({
      date: fmtDateTime(e.created_at),
      category: e.category_name,
      reason: e.reason,
      amount: `Rs. ${fmt(e.amount)}`,
      recordedBy: e.created_by_name,
    })),
    filename: 'expense-book',
  });

  return (
    <div className="admin-content eb-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Expense Book</h1>
          <p className="admin-page-subtitle">Track association expenses by category</p>
        </div>
        <button className="eb-add-btn" onClick={() => setShowAdd(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Expense
        </button>
      </div>

      {summary && (
        <div className="eb-stats-row">
          <StatCard accent label="Total Spent" value={`₹${fmt(summary.total_spent)}`} sub="All time" />
          <StatCard label="This Month" value={`₹${fmt(summary.this_month)}`} sub={new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} />
          <StatCard label="This Year" value={`₹${fmt(summary.this_year)}`} sub={new Date().getFullYear()} />
          <StatCard label="Total Entries" value={summary.total_transactions} sub="Expenses recorded" />
        </div>
      )}

      <div className="eb-filters">
        <input
          className="eb-filter-input"
          placeholder="Search reason / category / recorded by…"
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
        />
        <select
          className="eb-filter-input"
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
          className="eb-filter-input"
          value={filters.date_from}
          onChange={(e) => setFilters((f) => ({ ...f, date_from: e.target.value }))}
          title="From date"
        />
        <input
          type="date"
          className="eb-filter-input"
          value={filters.date_to}
          onChange={(e) => setFilters((f) => ({ ...f, date_to: e.target.value }))}
          title="To date"
        />
        {hasActiveFilters && (
          <button className="eb-filter-clear" onClick={clearFilters}>Clear</button>
        )}
        <ExportPdfButton onExport={handleExport} disabled={displayed.length === 0} />
      </div>

      {loading ? (
        <div className="eb-loading">Loading expenses…</div>
      ) : displayed.length === 0 ? (
        <div className="eb-empty">
          {hasActiveFilters ? 'No expenses match your search or filters.' : 'No expenses recorded yet.'}
        </div>
      ) : (
        <>
          <div className="eb-summary-bar">
            <span>{displayed.length} expense{displayed.length !== 1 ? 's' : ''}</span>
            <span className="eb-summary-total">Total: <strong>₹{fmt(displayedTotal)}</strong></span>
          </div>

          <div className="eb-table-wrap">
            <table className="eb-table">
              <thead>
                <tr>
                  <th>Date &amp; Time</th>
                  <th>Category</th>
                  <th>Reason</th>
                  <th>Amount</th>
                  <th>Recorded By</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((e) => (
                  <tr key={e.id}>
                    <td className="eb-td-meta">{fmtDateTime(e.created_at)}</td>
                    <td><span className="eb-cat-pill">{e.category_name}</span></td>
                    <td className="eb-reason">{e.reason}</td>
                    <td className="eb-amount">₹{fmt(e.amount)}</td>
                    <td className="eb-td-meta">{e.created_by_name}</td>
                    <td>
                      <button className="eb-row-btn" onClick={() => setEditingExpense(e)}>Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showAdd && (
        <ExpenseModal categories={categories} onClose={() => setShowAdd(false)} onSaved={handleSaved} />
      )}
      {editingExpense && (
        <ExpenseModal
          categories={categories}
          expense={editingExpense}
          onClose={() => setEditingExpense(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

export default ExpenseBook;
