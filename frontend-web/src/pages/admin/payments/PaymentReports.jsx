import { useState, useEffect } from 'react';
import { getPaymentSummary } from '../../../services/paymentService';
import './PaymentReports.css';

const fmt = (val) =>
  Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function StatCard({ label, value, sub }) {
  return (
    <div className="pr-stat-card">
      <div className="pr-stat-value">{value}</div>
      <div className="pr-stat-label">{label}</div>
      {sub && <div className="pr-stat-sub">{sub}</div>}
    </div>
  );
}

function PaymentReports() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPaymentSummary()
      .then(setSummary)
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="admin-content">
        <div className="admin-page-header">
          <h1 className="admin-page-title">Payment Reports</h1>
        </div>
        <div className="pr-loading">Loading summary…</div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="admin-content">
        <div className="admin-page-header">
          <h1 className="admin-page-title">Payment Reports</h1>
        </div>
        <div className="pr-loading">Failed to load summary.</div>
      </div>
    );
  }

  const { totals, byCategory, topPayers, monthly } = summary;

  return (
    <div className="admin-content pr-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Payment Reports</h1>
        <p className="admin-page-subtitle">Balance overview, category breakdown and top contributors</p>
      </div>

      {/* Top stats */}
      <div className="pr-stats-row">
        <StatCard
          label="Total Collected"
          value={`₹${fmt(totals.total_collected)}`}
          sub="All time"
        />
        <StatCard
          label="Total Transactions"
          value={totals.total_transactions}
          sub="Cash payments recorded"
        />
        <StatCard
          label="Contributors"
          value={topPayers.length}
          sub="Unique members who paid"
        />
      </div>

      <div className="pr-two-col">
        {/* Category breakdown */}
        <div className="pr-section">
          <h2 className="pr-section-title">By Category</h2>
          {byCategory.length === 0 ? (
            <p className="pr-empty">No data yet.</p>
          ) : (
            <table className="pr-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Count</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {byCategory.map((row) => (
                  <tr key={row.category}>
                    <td>{row.category}</td>
                    <td>{row.count}</td>
                    <td className="pr-amount">₹{fmt(row.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Monthly */}
        <div className="pr-section">
          <h2 className="pr-section-title">Monthly Collections</h2>
          {monthly.length === 0 ? (
            <p className="pr-empty">No data yet.</p>
          ) : (
            <table className="pr-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {monthly.map((row) => (
                  <tr key={row.month}>
                    <td>{row.month}</td>
                    <td className="pr-amount">₹{fmt(row.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Top payers */}
      <div className="pr-section pr-section--full">
        <h2 className="pr-section-title">Top Contributors</h2>
        {topPayers.length === 0 ? (
          <p className="pr-empty">No data yet.</p>
        ) : (
          <table className="pr-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Member</th>
                <th>Member ID</th>
                <th>Payments</th>
                <th>Total Paid</th>
              </tr>
            </thead>
            <tbody>
              {topPayers.map((p, i) => (
                <tr key={p.member_code}>
                  <td className="pr-rank">{i + 1}</td>
                  <td className="pr-bold">{p.name}</td>
                  <td>{p.member_code}</td>
                  <td>{p.count}</td>
                  <td className="pr-amount">₹{fmt(p.total_paid)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default PaymentReports;
