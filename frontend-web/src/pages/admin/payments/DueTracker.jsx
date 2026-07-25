import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPendingPayments, getMembers } from '../../../services/memberService';
import './DueTracker.css';

const fmt = (val) =>
  Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const asDate = (d) => (d instanceof Date ? d : new Date(d));

const fmtDate = (d) =>
  d ? asDate(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const midnight = (d) => {
  const dt = asDate(d);
  dt.setHours(0, 0, 0, 0);
  return dt;
};

const dateKey = (d) => {
  const dt = midnight(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
};

const TABS = [
  { key: 'overdue', label: 'Overdue' },
  { key: 'today', label: 'Due Today' },
  { key: 'member', label: 'Member-wise' },
  { key: 'date', label: 'Date-wise' },
];

function StatCard({ label, value, sub, accent }) {
  return (
    <div className={`dt-stat-card${accent ? ' dt-stat-card--accent' : ''}`}>
      <div className="dt-stat-value">{value}</div>
      <div className="dt-stat-label">{label}</div>
      {sub && <div className="dt-stat-sub">{sub}</div>}
    </div>
  );
}

function DaysBadge({ due }) {
  if (due.isOverdue) {
    return <span className="dt-badge dt-badge--overdue">{due.daysOverdue}d overdue</span>;
  }
  if (due.isToday) {
    return <span className="dt-badge dt-badge--today">Due today</span>;
  }
  if (due.daysOverdue === null) {
    return <span className="dt-badge dt-badge--neutral">No due date</span>;
  }
  return <span className="dt-badge dt-badge--upcoming">In {Math.abs(due.daysOverdue)}d</span>;
}

function DueRow({ due, showMember }) {
  return (
    <tr>
      {showMember && (
        <td>
          <div className="dt-bold">{due.member_name}</div>
          <div className="dt-td-meta">{due.member_code}</div>
        </td>
      )}
      <td>
        <div className="dt-bold">{due.title}</div>
        <div className="dt-td-meta">{due.category_name}</div>
      </td>
      <td className="dt-amount">₹{fmt(due.amount)}</td>
      <td>{fmtDate(due.due_date)}</td>
      <td><DaysBadge due={due} /></td>
      <td className="dt-td-meta">{due.phone || '—'}</td>
    </tr>
  );
}

function DueTable({ dues, showMember = true, emptyText }) {
  if (dues.length === 0) {
    return <p className="dt-empty">{emptyText}</p>;
  }
  return (
    <div className="dt-table-wrap">
      <table className="dt-table">
        <thead>
          <tr>
            {showMember && <th>Member</th>}
            <th>Due</th>
            <th>Amount</th>
            <th>Due Date</th>
            <th>Status</th>
            <th>Contact</th>
          </tr>
        </thead>
        <tbody>
          {dues.map((d) => (
            <DueRow key={d.id} due={d} showMember={showMember} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DueTracker() {
  const navigate = useNavigate();
  const [dues, setDues] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overdue');
  const [search, setSearch] = useState('');
  const [expandedMember, setExpandedMember] = useState(null);

  useEffect(() => {
    Promise.all([
      getPendingPayments().then((res) => res.data?.data ?? []).catch(() => []),
      getMembers().then((res) => res.data?.data ?? []).catch(() => []),
    ])
      .then(([d, m]) => {
        setDues(d);
        setMembers(m);
      })
      .finally(() => setLoading(false));
  }, []);

  const phoneByMember = useMemo(() => {
    const map = new Map();
    members.forEach((m) => map.set(m.id, m.phone));
    return map;
  }, [members]);

  const withMeta = useMemo(() => {
    const today = midnight(new Date());
    return dues
      .filter((d) => d.status === 'pending')
      .map((d) => {
        const daysOverdue = d.due_date ? Math.round((today - midnight(d.due_date)) / 86400000) : null;
        return {
          ...d,
          phone: phoneByMember.get(d.member_id),
          daysOverdue,
          isOverdue: daysOverdue !== null && daysOverdue > 0,
          isToday: daysOverdue === 0,
        };
      });
  }, [dues, phoneByMember]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return withMeta;
    return withMeta.filter(
      (d) =>
        d.member_name?.toLowerCase().includes(q) ||
        d.member_code?.toLowerCase().includes(q) ||
        d.title?.toLowerCase().includes(q)
    );
  }, [withMeta, search]);

  const overdueDues = useMemo(
    () => filtered.filter((d) => d.isOverdue).sort((a, b) => b.daysOverdue - a.daysOverdue),
    [filtered]
  );
  const todayDues = useMemo(() => filtered.filter((d) => d.isToday), [filtered]);

  const memberGroups = useMemo(() => {
    const map = new Map();
    filtered.forEach((d) => {
      if (!map.has(d.member_id)) {
        map.set(d.member_id, {
          member_id: d.member_id,
          member_name: d.member_name,
          member_code: d.member_code,
          phone: d.phone,
          dues: [],
          total: 0,
          overdueCount: 0,
          oldestDue: null,
        });
      }
      const g = map.get(d.member_id);
      g.dues.push(d);
      g.total += Number(d.amount);
      if (d.isOverdue) g.overdueCount += 1;
      if (d.due_date && (!g.oldestDue || asDate(d.due_date) < asDate(g.oldestDue))) {
        g.oldestDue = d.due_date;
      }
    });
    return [...map.values()].sort((a, b) => b.overdueCount - a.overdueCount || b.total - a.total);
  }, [filtered]);

  const dateGroups = useMemo(() => {
    const map = new Map();
    filtered.forEach((d) => {
      const key = d.due_date ? dateKey(d.due_date) : 'no-date';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(d);
    });
    return [...map.entries()].sort(([a], [b]) => {
      if (a === 'no-date') return 1;
      if (b === 'no-date') return -1;
      return a.localeCompare(b);
    });
  }, [filtered]);

  const outstandingTotal = withMeta.reduce((s, d) => s + Number(d.amount), 0);
  const overdueTotal = overdueDues.reduce((s, d) => s + Number(d.amount), 0);
  const overdueMemberCount = new Set(overdueDues.map((d) => d.member_id)).size;
  const todayTotal = todayDues.reduce((s, d) => s + Number(d.amount), 0);

  if (loading) {
    return (
      <div className="admin-content">
        <div className="admin-page-header"><h1 className="admin-page-title">Due Tracker</h1></div>
        <div className="dt-loading">Loading dues…</div>
      </div>
    );
  }

  return (
    <div className="admin-content dt-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Due Tracker</h1>
        <p className="admin-page-subtitle">Track outstanding dues by member, due date, and overdue status</p>
      </div>

      <div className="dt-stats-row">
        <StatCard accent label="Total Outstanding" value={`₹${fmt(outstandingTotal)}`} sub={`${withMeta.length} pending due${withMeta.length !== 1 ? 's' : ''}`} />
        <StatCard label="Overdue" value={`₹${fmt(overdueTotal)}`} sub={`${overdueDues.length} due${overdueDues.length !== 1 ? 's' : ''} · ${overdueMemberCount} member${overdueMemberCount !== 1 ? 's' : ''}`} />
        <StatCard label="Due Today" value={`₹${fmt(todayTotal)}`} sub={`${todayDues.length} due${todayDues.length !== 1 ? 's' : ''}`} />
        <StatCard label="Members with Dues" value={memberGroups.length} sub="Across all pending dues" />
      </div>

      <div className="dt-toolbar">
        <div className="dt-tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`dt-tab-btn${activeTab === t.key ? ' dt-tab-btn--active' : ''}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <input
          className="dt-search"
          type="text"
          placeholder="Search by member, ID, or due title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {activeTab === 'overdue' && (
        <div className="dt-section">
          <DueTable dues={overdueDues} emptyText="No overdue dues right now — everything is on track." />
        </div>
      )}

      {activeTab === 'today' && (
        <div className="dt-section">
          <DueTable dues={todayDues} emptyText="No dues fall due today." />
        </div>
      )}

      {activeTab === 'member' && (
        <div className="dt-section">
          {memberGroups.length === 0 ? (
            <p className="dt-empty">No members have pending dues.</p>
          ) : (
            <div className="dt-member-list">
              {memberGroups.map((g) => {
                const isOpen = expandedMember === g.member_id;
                return (
                  <div className="dt-member-group" key={g.member_id}>
                    <button
                      className="dt-member-header"
                      onClick={() => setExpandedMember(isOpen ? null : g.member_id)}
                    >
                      <span className={`dt-chevron${isOpen ? ' dt-chevron--open' : ''}`}>▸</span>
                      <div className="dt-member-info">
                        <span className="dt-bold">{g.member_name}</span>
                        <span className="dt-td-meta">{g.member_code} · {g.phone || 'No phone'}</span>
                      </div>
                      <span className="dt-member-meta">
                        {g.overdueCount > 0 && (
                          <span className="dt-badge dt-badge--overdue">{g.overdueCount} overdue</span>
                        )}
                        <span className="dt-td-meta">Oldest: {fmtDate(g.oldestDue)}</span>
                        <span className="dt-amount">₹{fmt(g.total)}</span>
                      </span>
                    </button>
                    {isOpen && (
                      <div className="dt-member-body">
                        <DueTable dues={g.dues} showMember={false} emptyText="No dues." />
                        <button
                          className="dt-record-btn"
                          onClick={() => navigate('/admin/payments/entry')}
                        >
                          Record Payment
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'date' && (
        <div className="dt-section">
          {dateGroups.length === 0 ? (
            <p className="dt-empty">No pending dues.</p>
          ) : (
            <div className="dt-date-list">
              {dateGroups.map(([key, groupDues]) => {
                const groupTotal = groupDues.reduce((s, d) => s + Number(d.amount), 0);
                const label = key === 'no-date' ? 'No due date set' : fmtDate(groupDues[0].due_date);
                const anyOverdue = groupDues.some((d) => d.isOverdue);
                const anyToday = groupDues.some((d) => d.isToday);
                return (
                  <div className="dt-date-group" key={key}>
                    <div className="dt-date-header">
                      <span className="dt-bold">{label}</span>
                      {anyOverdue && <span className="dt-badge dt-badge--overdue">Overdue</span>}
                      {!anyOverdue && anyToday && <span className="dt-badge dt-badge--today">Today</span>}
                      <span className="dt-td-meta">{groupDues.length} due{groupDues.length !== 1 ? 's' : ''}</span>
                      <span className="dt-amount">₹{fmt(groupTotal)}</span>
                    </div>
                    <DueTable dues={groupDues} emptyText="No dues." />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DueTracker;
