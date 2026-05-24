import { useState, useEffect } from 'react';
import { getPaymentSummary } from '../../../services/paymentService';
import './PaymentReports.css';

const fmt = (val) =>
  Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtMonth = (ym) => {
  if (!ym) return ym;
  const [y, m] = ym.split('-');
  return new Date(y, m - 1).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
};

function StatCard({ label, value, sub, accent }) {
  return (
    <div className={`pr-stat-card${accent ? ' pr-stat-card--accent' : ''}`}>
      <div className="pr-stat-value">{value}</div>
      <div className="pr-stat-label">{label}</div>
      {sub && <div className="pr-stat-sub">{sub}</div>}
    </div>
  );
}

function ProgressBar({ percent, color }) {
  return (
    <div className="pr-bar-track">
      <div className="pr-bar-fill" style={{ width: `${Math.min(percent, 100)}%`, background: color }} />
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
        <div className="admin-page-header"><h1 className="admin-page-title">Payment Reports</h1></div>
        <div className="pr-loading">Loading summary…</div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="admin-content">
        <div className="admin-page-header"><h1 className="admin-page-title">Payment Reports</h1></div>
        <div className="pr-loading">Failed to load summary.</div>
      </div>
    );
  }

  const { totals, byCategory, byPaymentType, byCollector, topPayers, monthly } = summary;

  const catMax = byCategory.length > 0 ? Math.max(...byCategory.map((r) => Number(r.total))) : 1;
  const catColors = ['#dc3545', '#3b6fd4', '#059669', '#d97706', '#7c3aed'];

  const cash = byPaymentType.find((r) => r.payment_type === 'cash');
  const qr = byPaymentType.find((r) => r.payment_type === 'qr');
  const typeTotal = Number(totals.total_collected) || 1;
  const cashPct = Math.round((Number(cash?.total ?? 0) / typeTotal) * 100);
  const qrPct = Math.round((Number(qr?.total ?? 0) / typeTotal) * 100);

  return (
    <div className="admin-content pr-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Payment Reports</h1>
        <p className="admin-page-subtitle">Complete financial overview of all recorded payments</p>
      </div>

      {/* ── Stat cards ── */}
      <div className="pr-stats-row">
        <StatCard accent label="Total Collected" value={`₹${fmt(totals.total_collected)}`} sub="All time" />
        <StatCard label="This Month" value={`₹${fmt(totals.this_month)}`} sub={new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} />
        <StatCard label="This Year" value={`₹${fmt(totals.this_year)}`} sub={new Date().getFullYear()} />
        <StatCard label="Total Transactions" value={totals.total_transactions} sub="Payments recorded" />
      </div>

      {/* ── Cash vs QR split ── */}
      <div className="pr-section pr-section--full pr-section--type">
        <h2 className="pr-section-title">Payment Mode Breakdown</h2>
        <div className="pr-type-row">
          <div className="pr-type-block">
            <div className="pr-type-header">
              <span className="pr-type-dot pr-type-dot--cash" />
              <span className="pr-type-name">Cash</span>
              <span className="pr-type-pct">{cashPct}%</span>
            </div>
            <ProgressBar percent={cashPct} color="#059669" />
            <div className="pr-type-meta">
              <span>₹{fmt(cash?.total ?? 0)}</span>
              <span>{cash?.count ?? 0} payment{Number(cash?.count ?? 0) !== 1 ? 's' : ''}</span>
            </div>
          </div>
          <div className="pr-type-block">
            <div className="pr-type-header">
              <span className="pr-type-dot pr-type-dot--qr" />
              <span className="pr-type-name">QR Code</span>
              <span className="pr-type-pct">{qrPct}%</span>
            </div>
            <ProgressBar percent={qrPct} color="#1d4ed8" />
            <div className="pr-type-meta">
              <span>₹{fmt(qr?.total ?? 0)}</span>
              <span>{qr?.count ?? 0} payment{Number(qr?.count ?? 0) !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pr-two-col">
        {/* ── Category breakdown ── */}
        <div className="pr-section">
          <h2 className="pr-section-title">By Category</h2>
          {byCategory.length === 0 ? (
            <p className="pr-empty">No data yet.</p>
          ) : (
            <div className="pr-cat-list">
              {byCategory.map((row, i) => (
                <div key={row.category} className="pr-cat-row">
                  <div className="pr-cat-top">
                    <span className="pr-cat-name">{row.category}</span>
                    <span className="pr-cat-amount">₹{fmt(row.total)}</span>
                  </div>
                  <ProgressBar percent={(Number(row.total) / catMax) * 100} color={catColors[i % catColors.length]} />
                  <div className="pr-cat-count">{row.count} transaction{row.count !== 1 ? 's' : ''}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Monthly ── */}
        <div className="pr-section">
          <h2 className="pr-section-title">Monthly Collections</h2>
          {monthly.length === 0 ? (
            <p className="pr-empty">No data yet.</p>
          ) : (
            <table className="pr-table">
              <thead>
                <tr><th>Month</th><th>Txns</th><th>Total</th></tr>
              </thead>
              <tbody>
                {monthly.map((row) => (
                  <tr key={row.month}>
                    <td>{fmtMonth(row.month)}</td>
                    <td className="pr-td-meta">{row.count}</td>
                    <td className="pr-amount">₹{fmt(row.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── By Collector ── */}
      <div className="pr-section pr-section--full">
        <h2 className="pr-section-title">Collections by Staff</h2>
        {byCollector.length === 0 ? (
          <p className="pr-empty">No data yet.</p>
        ) : (
          <table className="pr-table">
            <thead>
              <tr><th>Collector</th><th>Member ID</th><th>Payments Collected</th><th>Amount Collected</th></tr>
            </thead>
            <tbody>
              {byCollector.map((r) => (
                <tr key={r.member_code}>
                  <td className="pr-bold">{r.name}</td>
                  <td className="pr-td-meta">{r.member_code}</td>
                  <td>{r.count}</td>
                  <td className="pr-amount">₹{fmt(r.total_collected)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Top Contributors ── */}
      <div className="pr-section pr-section--full">
        <h2 className="pr-section-title">Top Contributors</h2>
        {topPayers.length === 0 ? (
          <p className="pr-empty">No data yet.</p>
        ) : (
          <table className="pr-table">
            <thead>
              <tr><th>#</th><th>Member</th><th>Member ID</th><th>Payments</th><th>Total Paid</th></tr>
            </thead>
            <tbody>
              {topPayers.map((p, i) => (
                <tr key={p.member_code}>
                  <td className="pr-rank">{i + 1}</td>
                  <td className="pr-bold">{p.name}</td>
                  <td className="pr-td-meta">{p.member_code}</td>
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
