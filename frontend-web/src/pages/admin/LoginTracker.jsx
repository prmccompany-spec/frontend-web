import { useState, useEffect, useCallback, useMemo } from 'react';
import { getLoginHistory } from '../../services/loginHistoryService';
import { exportTableToPdf } from '../../utils/pdfExport';
import ExportPdfButton from '../../components/ExportPdfButton/ExportPdfButton';
import './LoginTracker.css';

const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

// Local calendar date, not UTC — toISOString() converts to UTC first, so
// for IST (UTC+5:30) it still shows "yesterday" for the first 5.5 hours
// after local midnight.
const today = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// A rough, dependency-free UA -> device/browser label, just enough to be
// readable in a table cell — not meant to be a full UA parser.
function describeDevice(ua) {
  if (!ua) return '—';
  const isMobile = /Mobile|Android|iPhone/i.test(ua);
  let browser = 'Browser';
  if (/Edg\//.test(ua)) browser = 'Edge';
  else if (/Chrome\//.test(ua)) browser = 'Chrome';
  else if (/Firefox\//.test(ua)) browser = 'Firefox';
  else if (/Safari\//.test(ua)) browser = 'Safari';
  return `${browser}${isMobile ? ' · Mobile' : ''}`;
}

function StatCard({ label, value, color }) {
  return (
    <div className="lt-stat-card">
      <div className="lt-stat-value" style={color ? { color } : undefined}>{value}</div>
      <div className="lt-stat-label">{label}</div>
    </div>
  );
}

function LoginTracker() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    status: '',
    search: '',
    from: '',
    to: today(),
  });

  const load = useCallback(() => {
    setLoading(true);
    const params = { limit: 500 };
    if (filters.status) params.status = filters.status;
    if (filters.from) params.from = `${filters.from} 00:00:00`;
    if (filters.to) params.to = `${filters.to} 23:59:59`;

    getLoginHistory(params)
      .then((res) => setHistory(res.data.data ?? []))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, [filters.status, filters.from, filters.to]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    if (!q) return history;
    return history.filter((h) => {
      const hay = `${h.member_name ?? ''} ${h.member_code ?? ''} ${h.phone ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [history, filters.search]);

  const successCount = filtered.filter((h) => h.status === 'success').length;
  const failedCount = filtered.filter((h) => h.status === 'failed').length;
  const uniqueMembers = new Set(filtered.filter((h) => h.member_id).map((h) => h.member_id)).size;

  const hasFilters = !!(filters.status || filters.search || filters.from);

  const loginFilterParts = [];
  if (filters.status) loginFilterParts.push(filters.status === 'success' ? 'Successful' : 'Failed');
  if (filters.from) loginFilterParts.push(`From ${filters.from}`);
  if (filters.to) loginFilterParts.push(`To ${filters.to}`);
  if (filters.search) loginFilterParts.push(`Search "${filters.search}"`);

  const handleExport = () => exportTableToPdf({
    title: 'Login Tracker',
    subtitle: loginFilterParts.length ? loginFilterParts.join(' · ') : 'All login attempts',
    summary: [
      { label: 'Attempts', value: filtered.length },
      { label: 'Successful', value: successCount },
      { label: 'Failed', value: failedCount },
    ],
    columns: [
      { header: 'Date & Time', key: 'date' },
      { header: 'Member', key: 'member' },
      { header: 'Status', key: 'status' },
      { header: 'Reason', key: 'reason' },
      { header: 'IP Address', key: 'ip' },
      { header: 'Device', key: 'device' },
    ],
    rows: filtered.map((h) => ({
      date: fmtDateTime(h.created_at),
      member: h.member_name ? `${h.member_name} (${h.member_code})` : `Unknown (${h.phone || '—'})`,
      status: h.status === 'success' ? 'Success' : 'Failed',
      reason: h.failure_reason || '—',
      ip: h.ip_address || '—',
      device: describeDevice(h.user_agent),
    })),
    filename: 'login-tracker',
  });

  return (
    <div className="admin-content lt-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Login Tracker</h1>
        <p className="admin-page-subtitle">Every login attempt — successful and failed — with device and IP details</p>
      </div>

      <div className="lt-stats-row">
        <StatCard label="Total Attempts" value={filtered.length} />
        <StatCard label="Successful" value={successCount} color="#059669" />
        <StatCard label="Failed" value={failedCount} color="#dc2626" />
        <StatCard label="Unique Members" value={uniqueMembers} color="#2563eb" />
      </div>

      <div className="lt-filters">
        <input
          className="lt-input lt-input--grow"
          placeholder="Search by name, member ID or phone…"
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
        />
        <select
          className="lt-input"
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
        >
          <option value="">All Statuses</option>
          <option value="success">Successful</option>
          <option value="failed">Failed</option>
        </select>
        <input
          type="date"
          className="lt-input"
          value={filters.from}
          title="From date"
          onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
        />
        <input
          type="date"
          className="lt-input"
          value={filters.to}
          title="To date"
          onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
        />
        {hasFilters && (
          <button className="lt-clear" onClick={() => setFilters({ status: '', search: '', from: '', to: today() })}>
            Clear
          </button>
        )}
        <ExportPdfButton onExport={handleExport} disabled={filtered.length === 0} />
      </div>

      {loading ? (
        <div className="lt-loading">Loading login history…</div>
      ) : filtered.length === 0 ? (
        <div className="lt-empty">No login attempts found for this range.</div>
      ) : (
        <div className="lt-table-wrap">
          <table className="lt-table">
            <thead>
              <tr>
                <th>Date &amp; Time</th>
                <th>Member</th>
                <th>Status</th>
                <th>Reason</th>
                <th>IP Address</th>
                <th>Device</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((h) => (
                <tr key={h.id}>
                  <td className="lt-td-meta">{fmtDateTime(h.created_at)}</td>
                  <td>
                    {h.member_name ? (
                      <>
                        <div className="lt-member-name">{h.member_name}</div>
                        <div className="lt-member-code">{h.member_code}</div>
                      </>
                    ) : (
                      <>
                        <div className="lt-member-name">Unknown</div>
                        <div className="lt-member-code">{h.phone}</div>
                      </>
                    )}
                  </td>
                  <td>
                    <span className={`lt-status-badge lt-status-badge--${h.status}`}>
                      {h.status === 'success' ? 'Success' : 'Failed'}
                    </span>
                  </td>
                  <td className="lt-td-meta">{h.failure_reason || '—'}</td>
                  <td className="lt-td-meta">{h.ip_address || '—'}</td>
                  <td className="lt-td-meta">{describeDevice(h.user_agent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default LoginTracker;
