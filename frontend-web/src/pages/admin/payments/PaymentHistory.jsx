import { useState, useEffect, useCallback } from 'react';
import { getPayments, getCategories } from '../../../services/paymentService';
import './PaymentHistory.css';

const fmt = (val) =>
  Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

function PaymentHistory() {
  const [payments, setPayments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const displayed = payments.filter((p) => {
    const q = filters.search.toLowerCase();
    return (
      !q ||
      p.member_name?.toLowerCase().includes(q) ||
      p.member_code?.toLowerCase().includes(q) ||
      p.payment_ref?.toLowerCase().includes(q)
    );
  });

  const total = displayed.reduce((s, p) => s + Number(p.amount), 0);

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
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Collected By</th>
                  <th>Notes</th>
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
                    <td className="ph-amount">₹{fmt(p.amount)}</td>
                    <td>{fmtDate(p.payment_date)}</td>
                    <td>{p.collected_by_name}</td>
                    <td className="ph-notes">{p.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default PaymentHistory;
