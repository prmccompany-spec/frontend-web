import { useState, useEffect, useMemo } from 'react';
import { getAllRequests, getRequestDetail } from '../../services/serviceRequestService';
import { getWorkflowSteps } from '../../services/serviceService';
import { resolveFileUrl } from '../../utils/fileUrl';
import './ServiceRequestTracker.css';

const STATUS_LABEL = {
  SUBMITTED: 'Submitted',
  IN_PROGRESS: 'In Progress',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  COMPLETED: 'Completed',
};

const ACTIVE_STATUSES = ['SUBMITTED', 'IN_PROGRESS'];

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const fmtDateTime = (d) => (d ? new Date(d).toLocaleString('en-IN') : '—');

const TABS = [
  { key: 'awaiting', label: 'Awaiting Action' },
  { key: 'completed', label: 'Completed' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'all', label: 'All Requests' },
];

function StatCard({ label, value, sub, accent }) {
  return (
    <div className={`rt-stat-card${accent ? ' rt-stat-card--accent' : ''}`}>
      <div className="rt-stat-value">{value}</div>
      <div className="rt-stat-label">{label}</div>
      {sub && <div className="rt-stat-sub">{sub}</div>}
    </div>
  );
}

function StatusBadge({ status }) {
  return <span className={`rt-status rt-status--${status.toLowerCase()}`}>{STATUS_LABEL[status] ?? status}</span>;
}

function PendingSteps({ req, steps }) {
  if (!ACTIVE_STATUSES.includes(req.status)) return <span className="rt-td-meta">—</span>;
  if (!steps) return <span className="rt-td-meta">Loading…</span>;

  const remaining = steps.filter((s) => s.step_no >= req.current_step);
  if (remaining.length === 0) return <span className="rt-td-meta">—</span>;

  return (
    <div className="rt-steps-list">
      {remaining.map((s) => (
        <span
          key={s.id}
          className={`rt-step-chip${s.step_no === req.current_step ? ' rt-step-chip--current' : ''}`}
        >
          {s.step_label || `Step ${s.step_no}`} <span className="rt-step-role">({s.type_name})</span>
        </span>
      ))}
    </div>
  );
}

function Timeline({ requestId }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRequestDetail(requestId)
      .then(setDetail)
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [requestId]);

  if (loading) return <div className="rt-timeline-loading">Loading timeline…</div>;
  if (!detail) return <div className="rt-timeline-loading">Could not load details.</div>;

  return (
    <div className="rt-timeline-wrap">
      {detail.remarks && (
        <div className="rt-applicant-remarks">Applicant remarks: "{detail.remarks}"</div>
      )}
      <div className="rt-timeline">
        {detail.timeline.map((t, i) => (
          <div key={t.id} className={`rt-timeline-item rt-timeline-item--${t.status.toLowerCase()}`}>
            <div className="rt-timeline-dot" />
            {i < detail.timeline.length - 1 && <div className="rt-timeline-line" />}
            <div className="rt-timeline-body">
              <div className="rt-timeline-title">
                {t.status === 'SUBMITTED' ? 'Submitted by applicant' : `${t.step_label || t.role_name} — ${STATUS_LABEL[t.status] ?? t.status}`}
              </div>
              <div className="rt-timeline-meta">
                {t.action_by_name && <span>{t.action_by_name} · </span>}
                {fmtDateTime(t.action_date)}
              </div>
              {t.remarks && <div className="rt-timeline-remarks">"{t.remarks}"</div>}
            </div>
          </div>
        ))}
      </div>

      {detail.documents.length > 0 && (
        <div className="rt-doc-list">
          <div className="rt-doc-list-title">Documents</div>
          {detail.documents.map((d) => (
            <a
              key={d.id}
              className="rt-doc-link"
              href={resolveFileUrl(d.file_path)}
              target="_blank"
              rel="noreferrer"
            >
              {d.document_type === 'OFFLINE_FORM' ? 'Filled Offline Form' : d.document_name || d.document_type}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function RequestRow({ req, steps, expanded, onToggle }) {
  return (
    <>
      <tr className="rt-row" onClick={onToggle}>
        <td>
          <span className={`rt-chevron${expanded ? ' rt-chevron--open' : ''}`}>▸</span>
        </td>
        <td className="rt-td-meta">{req.request_no}</td>
        <td>
          <div className="rt-bold">{req.member_name}</div>
          <div className="rt-td-meta">{req.member_code}</div>
        </td>
        <td>{req.service_name}</td>
        <td><StatusBadge status={req.status} /></td>
        <td><PendingSteps req={req} steps={steps} /></td>
        <td className="rt-td-meta">{fmtDate(req.submitted_at)}</td>
        <td className="rt-td-meta">{fmtDate(req.completed_at)}</td>
      </tr>
      {expanded && (
        <tr className="rt-expand-row">
          <td colSpan={8}>
            <Timeline requestId={req.id} />
          </td>
        </tr>
      )}
    </>
  );
}

function ServiceRequestTracker() {
  const [requests, setRequests] = useState([]);
  const [workflowSteps, setWorkflowSteps] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('awaiting');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    getAllRequests()
      .then((data) => {
        setRequests(data);
        const activeServiceIds = [...new Set(
          data.filter((r) => ACTIVE_STATUSES.includes(r.status)).map((r) => r.service_id)
        )];
        Promise.all(
          activeServiceIds.map((id) => getWorkflowSteps(id).then((steps) => [id, steps]).catch(() => [id, []]))
        ).then((pairs) => setWorkflowSteps(Object.fromEntries(pairs)));
      })
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return requests;
    return requests.filter(
      (r) =>
        r.request_no?.toLowerCase().includes(q) ||
        r.member_name?.toLowerCase().includes(q) ||
        r.member_code?.toLowerCase().includes(q) ||
        r.service_name?.toLowerCase().includes(q)
    );
  }, [requests, search]);

  const awaiting = useMemo(() => filtered.filter((r) => ACTIVE_STATUSES.includes(r.status)), [filtered]);
  const completed = useMemo(() => filtered.filter((r) => r.status === 'COMPLETED'), [filtered]);
  const rejected = useMemo(() => filtered.filter((r) => r.status === 'REJECTED'), [filtered]);

  const shown = { awaiting, completed, rejected, all: filtered }[activeTab];

  const totalRequests = requests.length;
  const totalAwaiting = requests.filter((r) => ACTIVE_STATUSES.includes(r.status)).length;
  const totalCompleted = requests.filter((r) => r.status === 'COMPLETED').length;
  const totalRejected = requests.filter((r) => r.status === 'REJECTED').length;

  if (loading) {
    return (
      <div className="admin-content">
        <div className="admin-page-header"><h1 className="admin-page-title">Service Request Tracker</h1></div>
        <div className="rt-loading">Loading requests…</div>
      </div>
    );
  }

  return (
    <div className="admin-content rt-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Service Request Tracker</h1>
        <p className="admin-page-subtitle">Track offline service requests across every member and approval step</p>
      </div>

      <div className="rt-stats-row">
        <StatCard accent label="Total Requests" value={totalRequests} sub="All time" />
        <StatCard label="Awaiting Action" value={totalAwaiting} sub="Submitted or in progress" />
        <StatCard label="Completed" value={totalCompleted} sub="Fully approved" />
        <StatCard label="Rejected" value={totalRejected} sub="Declined at some step" />
      </div>

      <div className="rt-toolbar">
        <div className="rt-tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`rt-tab-btn${activeTab === t.key ? ' rt-tab-btn--active' : ''}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <input
          className="rt-search"
          type="text"
          placeholder="Search by request no, member, or service…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rt-section">
        {shown.length === 0 ? (
          <p className="rt-empty">No requests in this view.</p>
        ) : (
          <div className="rt-table-wrap">
            <table className="rt-table">
              <thead>
                <tr>
                  <th />
                  <th>Request No</th>
                  <th>Member</th>
                  <th>Service</th>
                  <th>Status</th>
                  <th>Pending Steps</th>
                  <th>Submitted</th>
                  <th>Completed</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <RequestRow
                    key={r.id}
                    req={r}
                    steps={workflowSteps[r.service_id]}
                    expanded={expandedId === r.id}
                    onToggle={() => setExpandedId(expandedId === r.id ? null : r.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ServiceRequestTracker;
