import { useState, useEffect, useCallback, Fragment } from 'react';
import { getAttendance } from '../../../services/attendanceService';
import { matchesIdOrText } from '../../../utils/memberSearch';
import './AttendanceReport.css';

const today = () => new Date().toISOString().slice(0, 10);

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const fmtTime = (d) =>
  d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';

const fmtDuration = (ms) => {
  if (ms <= 0) return '0m';
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

function groupByMemberDay(records) {
  const map = new Map();
  for (const r of records) {
    const key = `${r.member_id}_${r.attendance_date}`;
    if (!map.has(key)) {
      map.set(key, {
        key,
        memberName: r.member_name,
        memberCode: r.member_code,
        date: r.attendance_date,
        entries: [],
      });
    }
    map.get(key).entries.push(r);
  }

  return [...map.values()].map((g) => {
    const sorted = [...g.entries].sort((a, b) => new Date(a.check_in_time) - new Date(b.check_in_time));
    const firstCheckIn = sorted[0]?.check_in_time;
    const lastEntry = sorted[sorted.length - 1];
    const stillIn = !lastEntry.check_out_time;
    const totalDurationMs = sorted.reduce((s, e) => {
      if (!e.check_out_time) return s;
      return s + (new Date(e.check_out_time) - new Date(e.check_in_time));
    }, 0);

    return {
      ...g,
      entries: sorted,
      firstCheckIn,
      lastCheckOut: stillIn ? null : lastEntry.check_out_time,
      stillIn,
      sessions: sorted.length,
      totalDurationMs,
    };
  }).sort((a, b) => new Date(b.date) - new Date(a.date) || a.memberName.localeCompare(b.memberName));
}

function AttendanceReport() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(new Set());

  const [filters, setFilters] = useState({
    mode: 'day', // 'day' | 'range'
    date: today(),
    from: '',
    to: '',
    search: '',
  });

  const load = useCallback(() => {
    setLoading(true);
    const params = filters.mode === 'day'
      ? { date: filters.date }
      : { from: filters.from || undefined, to: filters.to || undefined };

    getAttendance(params)
      .then((res) => setRecords(res.data ?? []))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, [filters.mode, filters.date, filters.from, filters.to]);

  useEffect(() => { load(); }, [load]);

  const filteredRecords = records.filter((r) =>
    matchesIdOrText(r.member_code, [r.member_name], filters.search)
  );

  const groups = groupByMemberDay(filteredRecords);
  const presentCount = new Set(groups.map((g) => g.memberCode)).size;

  const toggleExpand = (key) =>
    setExpanded((s) => {
      const next = new Set(s);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  return (
    <div className="admin-content">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Attendance Report</h1>
        <p className="admin-page-subtitle">Daily presence summary, with individual check-in/check-out entries</p>
      </div>

      <div className="ar-filters">
        <div className="ar-mode-toggle">
          <button
            className={`ar-mode-btn${filters.mode === 'day' ? ' ar-mode-btn--active' : ''}`}
            onClick={() => setFilters((f) => ({ ...f, mode: 'day' }))}
          >
            Single Day
          </button>
          <button
            className={`ar-mode-btn${filters.mode === 'range' ? ' ar-mode-btn--active' : ''}`}
            onClick={() => setFilters((f) => ({ ...f, mode: 'range' }))}
          >
            Date Range
          </button>
        </div>

        {filters.mode === 'day' ? (
          <input
            type="date"
            className="ar-input"
            value={filters.date}
            onChange={(e) => setFilters((f) => ({ ...f, date: e.target.value }))}
          />
        ) : (
          <>
            <input
              type="date"
              className="ar-input"
              value={filters.from}
              onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
              title="From date"
            />
            <input
              type="date"
              className="ar-input"
              value={filters.to}
              onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
              title="To date"
            />
          </>
        )}

        <input
          className="ar-input"
          placeholder="Search by name or member ID…"
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
        />
      </div>

      {loading ? (
        <div className="ar-loading">Loading attendance…</div>
      ) : groups.length === 0 ? (
        <div className="ar-empty">No attendance records found.</div>
      ) : (
        <>
          <div className="ar-summary-bar">
            <span>{presentCount} member{presentCount !== 1 ? 's' : ''} present</span>
            <span>{filteredRecords.length} total entries</span>
          </div>

          <div className="ar-table-wrap">
            <table className="ar-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Member</th>
                  <th>Date</th>
                  <th>First Check-in</th>
                  <th>Last Check-out</th>
                  <th>Sessions</th>
                  <th>Total Duration</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((g) => (
                  <Fragment key={g.key}>
                    <tr
                      className="ar-row ar-row--summary"
                      onClick={() => toggleExpand(g.key)}
                    >
                      <td className="ar-expand-cell">
                        <svg
                          className={`ar-expand-icon ${expanded.has(g.key) ? 'ar-expand-icon--open' : ''}`}
                          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                          strokeLinecap="round" strokeLinejoin="round"
                        >
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </td>
                      <td>
                        <div className="ar-member-name">{g.memberName}</div>
                        <div className="ar-member-code">{g.memberCode}</div>
                      </td>
                      <td>{fmtDate(g.date)}</td>
                      <td>{fmtTime(g.firstCheckIn)}</td>
                      <td>
                        {g.stillIn
                          ? <span className="ar-status-badge ar-status-badge--in">Still In</span>
                          : fmtTime(g.lastCheckOut)}
                      </td>
                      <td>{g.sessions}</td>
                      <td>{fmtDuration(g.totalDurationMs)}</td>
                    </tr>
                    {expanded.has(g.key) && (
                      <tr className="ar-row ar-row--detail">
                        <td colSpan={7}>
                          <table className="ar-entries-table">
                            <thead>
                              <tr>
                                <th>Check-in</th>
                                <th>Check-out</th>
                                <th>Duration</th>
                              </tr>
                            </thead>
                            <tbody>
                              {g.entries.map((e) => (
                                <tr key={e.id}>
                                  <td>{fmtTime(e.check_in_time)}</td>
                                  <td>
                                    {e.check_out_time
                                      ? fmtTime(e.check_out_time)
                                      : <span className="ar-status-badge ar-status-badge--in">Still In</span>}
                                  </td>
                                  <td>
                                    {e.check_out_time
                                      ? fmtDuration(new Date(e.check_out_time) - new Date(e.check_in_time))
                                      : '—'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default AttendanceReport;
