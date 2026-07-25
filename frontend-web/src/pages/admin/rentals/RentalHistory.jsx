import { useState, useEffect, useCallback } from 'react';
import { getRentals, getRentalProducts, updateRentalStatus } from '../../../services/rentalService';
import './RentalHistory.css';

const fmt = (val) =>
  Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

function RentalHistory() {
  const [rentals, setRentals] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

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

  const handleStatusChange = async (rental, status) => {
    setUpdatingId(rental.id);
    try {
      await updateRentalStatus(rental.id, status);
      await load();
    } catch (err) {
      alert(err.response?.data?.message ?? 'Failed to update rental status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const displayed = rentals.filter((r) => {
    const q = filters.search.toLowerCase();
    return (
      !q ||
      r.member_name?.toLowerCase().includes(q) ||
      r.member_code?.toLowerCase().includes(q) ||
      r.product_name?.toLowerCase().includes(q)
    );
  });

  const total = displayed.reduce((s, r) => s + Number(r.amount), 0);

  return (
    <div className="admin-content rh-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Rental History</h1>
        <p className="admin-page-subtitle">View and manage all recorded rentals</p>
      </div>

      <div className="rh-filters">
        <input
          className="rh-input"
          placeholder="Search member / product…"
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
                  <th>Product</th>
                  <th>Member</th>
                  <th>Rate</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th className="rh-th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((r) => (
                  <tr key={r.id}>
                    <td className="rh-td-name">{r.product_name}</td>
                    <td>
                      <div className="rh-member-name">{r.member_name}</div>
                      <div className="rh-member-code">{r.member_code}</div>
                    </td>
                    <td>₹{fmt(r.rate_amount)} / {r.rate_type}</td>
                    <td>{fmtDateTime(r.start_date)}</td>
                    <td>{fmtDateTime(r.end_date)}</td>
                    <td className="rh-amount">₹{fmt(r.amount)}</td>
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
                            onClick={() => handleStatusChange(r, 'returned')}
                          >
                            {updatingId === r.id ? '…' : 'Mark Returned'}
                          </button>
                          <button
                            className="rh-row-btn rh-row-btn--danger"
                            disabled={updatingId === r.id}
                            onClick={() => handleStatusChange(r, 'cancelled')}
                          >
                            Cancel
                          </button>
                        </>
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
    </div>
  );
}

export default RentalHistory;
