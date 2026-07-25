import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getServices, getServiceDocuments } from '../../services/serviceService';
import {
  submitServiceRequest,
  getMyRequests,
  getPendingApprovals,
  getRequestDetail,
  approveRequest,
  rejectRequest,
} from '../../services/serviceRequestService';
import ProfileMenu from '../../components/ProfileMenu/ProfileMenu';
import logo from '../../assets/logo.png';
import { resolveFileUrl } from '../../utils/fileUrl';
import './Services.css';

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const STATUS_LABEL = {
  SUBMITTED: 'Submitted',
  IN_PROGRESS: 'In Progress',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  COMPLETED: 'Completed',
};

const ACTIVE_STATUSES = ['SUBMITTED', 'IN_PROGRESS'];

function StatusBadge({ status }) {
  return <span className={`us-status us-status--${status.toLowerCase()}`}>{STATUS_LABEL[status] ?? status}</span>;
}

function RequestDot({ status }) {
  return <span className={`us-request-dot us-request-dot--${status.toLowerCase()}`} />;
}

function EmptyState({ icon, title, sub }) {
  return (
    <div className="us-empty-state">
      {icon}
      <p className="us-empty-state-title">{title}</p>
      {sub && <p className="us-empty-state-sub">{sub}</p>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TIMELINE (shared by My Requests + Approvals)
// ═══════════════════════════════════════════════════════════════
function Timeline({ requestId }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRequestDetail(requestId)
      .then(setDetail)
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [requestId]);

  if (loading) return <div className="us-timeline-loading">Loading timeline…</div>;
  if (!detail) return <div className="us-timeline-loading">Could not load details.</div>;

  return (
    <div className="us-timeline-wrap">
      <div className="us-timeline">
        {detail.timeline.map((t, i) => (
          <div key={t.id} className={`us-timeline-item us-timeline-item--${t.status.toLowerCase()}`}>
            <div className="us-timeline-dot" />
            {i < detail.timeline.length - 1 && <div className="us-timeline-line" />}
            <div className="us-timeline-body">
              <div className="us-timeline-title">
                {t.status === 'SUBMITTED' ? 'Submitted by applicant' : `${t.step_label || t.role_name} — ${STATUS_LABEL[t.status] ?? t.status}`}
              </div>
              <div className="us-timeline-meta">
                {t.action_by_name && <span>{t.action_by_name} · </span>}
                {new Date(t.action_date).toLocaleString('en-IN')}
              </div>
              {t.remarks && <div className="us-timeline-remarks">"{t.remarks}"</div>}
            </div>
          </div>
        ))}
      </div>

      <div className="us-doc-list">
        <div className="us-doc-list-title">Uploaded Documents</div>
        {detail.documents.map((d) => (
          <a
            key={d.id}
            className="us-doc-link"
            href={resolveFileUrl(d.file_path)}
            target="_blank"
            rel="noreferrer"
          >
            {d.document_type === 'OFFLINE_FORM' ? 'Filled Offline Form' : d.document_name || d.document_type}
          </a>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// APPLY MODAL
// ═══════════════════════════════════════════════════════════════
function FileField({ label, required, hint, accept, onChange, file }) {
  return (
    <div className="us-field">
      <label className="us-label">
        {label} {required ? <span className="us-required">*</span> : <span className="us-optional">(optional)</span>}
      </label>
      <input type="file" accept={accept} onChange={onChange} />
      {file ? (
        <span className="us-file-picked">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {file.name}
        </span>
      ) : hint ? (
        <span className="us-file-hint">{hint}</span>
      ) : null}
    </div>
  );
}

function ApplyModal({ service, onClose, onSubmitted }) {
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [offlineFormFile, setOfflineFormFile] = useState(null);
  const [docFiles, setDocFiles] = useState({});
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getServiceDocuments(service.id)
      .then(setDocuments)
      .catch(() => setDocuments([]))
      .finally(() => setLoadingDocs(false));
  }, [service.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!offlineFormFile) return setError('Upload the filled offline form.');

    const missing = documents.filter((d) => d.mandatory && !docFiles[d.id]);
    if (missing.length > 0) {
      return setError(`Missing mandatory documents: ${missing.map((d) => d.document_name).join(', ')}`);
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('service_id', service.id);
      fd.append('offline_form', offlineFormFile);
      if (remarks) fd.append('remarks', remarks);
      documents.forEach((d) => {
        if (docFiles[d.id]) fd.append(`document_${d.id}`, docFiles[d.id]);
      });
      const result = await submitServiceRequest(fd);
      onSubmitted(result.request_no);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="us-overlay" onClick={onClose}>
      <div className="us-modal" onClick={(e) => e.stopPropagation()}>
        <div className="us-modal-header">
          <div>
            <h2 className="us-modal-title">Apply: {service.name}</h2>
            <p className="us-modal-subtitle">Upload the filled form and required documents</p>
          </div>
          <button className="us-modal-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="us-modal-body">
            {error && <div className="us-error">{error}</div>}

            <FileField
              label="Filled Offline Form (PDF)"
              required
              accept="application/pdf"
              file={offlineFormFile}
              onChange={(e) => setOfflineFormFile(e.target.files[0] ?? null)}
            />

            {loadingDocs ? (
              <div className="us-state">Loading required documents…</div>
            ) : (
              documents.map((d) => (
                <FileField
                  key={d.id}
                  label={d.document_name}
                  required={d.mandatory}
                  accept={(d.allowed_extensions || '').split(',').map((e) => `.${e.trim()}`).join(',')}
                  file={docFiles[d.id]}
                  onChange={(e) => setDocFiles((f) => ({ ...f, [d.id]: e.target.files[0] ?? null }))}
                />
              ))
            )}

            <div className="us-field">
              <label className="us-label">Remarks (optional)</label>
              <textarea
                className="us-input"
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>
          </div>

          <div className="us-modal-footer">
            <button type="button" className="us-btn us-btn--ghost" onClick={onClose} disabled={submitting}>Cancel</button>
            <button type="submit" className="us-btn us-btn--primary" disabled={submitting || loadingDocs}>
              {submitting ? 'Submitting…' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// AVAILABLE SERVICES TAB
// ═══════════════════════════════════════════════════════════════
function AvailableServicesTab({ onApplied, onCount }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyTarget, setApplyTarget] = useState(null);
  const [submittedRef, setSubmittedRef] = useState('');

  useEffect(() => {
    getServices({ published: true })
      .then((list) => { setServices(list); onCount?.(list.length); })
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  }, [onCount]);

  const handleSubmitted = (requestNo) => {
    setApplyTarget(null);
    setSubmittedRef(requestNo);
    onApplied();
  };

  if (loading) return <div className="us-state">Loading services…</div>;

  return (
    <div>
      {submittedRef && (
        <div className="us-success">
          Request submitted successfully! Reference: <strong>{submittedRef}</strong>
          <button className="us-success-close" onClick={() => setSubmittedRef('')}>×</button>
        </div>
      )}

      {services.length === 0 ? (
        <EmptyState
          icon={(
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          )}
          title="No services are available right now."
          sub="Check back later or contact the committee."
        />
      ) : (
        <div className="us-service-grid">
          {services.map((s) => (
            <div className="us-service-card" key={s.id}>
              <div className="us-service-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <h3>{s.name}</h3>
              {s.description && <p>{s.description}</p>}
              {Number(s.document_count) > 0 && (
                <span className="us-service-doc-count">
                  {s.document_count} document{Number(s.document_count) !== 1 ? 's' : ''} required
                </span>
              )}
              <div className="us-service-actions">
                {s.offline_form_path && (
                  <a
                    className="us-btn us-btn--ghost"
                    href={resolveFileUrl(s.offline_form_path)}
                    target="_blank"
                    rel="noreferrer"
                    download
                  >
                    Download Form
                  </a>
                )}
                <button className="us-btn us-btn--primary" onClick={() => setApplyTarget(s)}>Apply</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {applyTarget && (
        <ApplyModal
          service={applyTarget}
          onClose={() => setApplyTarget(null)}
          onSubmitted={handleSubmitted}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MY REQUESTS TAB
// ═══════════════════════════════════════════════════════════════
function MyRequestsTab({ refreshKey, onCount }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    getMyRequests()
      .then((list) => { setRequests(list); onCount?.(list); })
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  }, [refreshKey, onCount]);

  if (loading) return <div className="us-state">Loading your requests…</div>;
  if (requests.length === 0) {
    return (
      <EmptyState
        icon={(
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        )}
        title="You haven't submitted any requests yet."
        sub="Apply for a service from the Available Services tab."
      />
    );
  }

  const statusCounts = requests.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {});
  const filtered = statusFilter === 'ALL' ? requests : requests.filter((r) => r.status === statusFilter);

  return (
    <div>
      <div className="us-filter-row">
        <button className={`us-filter-pill${statusFilter === 'ALL' ? ' us-filter-pill--active' : ''}`} onClick={() => setStatusFilter('ALL')}>
          All <span className="us-filter-count">{requests.length}</span>
        </button>
        {Object.entries(STATUS_LABEL).map(([key, label]) => statusCounts[key] ? (
          <button
            key={key}
            className={`us-filter-pill${statusFilter === key ? ' us-filter-pill--active' : ''}`}
            onClick={() => setStatusFilter(key)}
          >
            {label} <span className="us-filter-count">{statusCounts[key]}</span>
          </button>
        ) : null)}
      </div>

      <div className="us-request-list">
        {filtered.map((r) => (
          <div className="us-request-card" key={r.id}>
            <div className="us-request-row" onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
              <div className="us-request-main">
                <RequestDot status={r.status} />
                <div>
                  <div className="us-request-service">{r.service_name}</div>
                  <div className="us-request-no">{r.request_no} · {fmtDate(r.submitted_at)}</div>
                </div>
              </div>
              <div className="us-request-row-right">
                <StatusBadge status={r.status} />
                <svg className={`us-request-chevron${expanded === r.id ? ' us-request-chevron--open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>
            {expanded === r.id && <Timeline requestId={r.id} />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// APPROVALS TAB
// ═══════════════════════════════════════════════════════════════
function ActionModal({ request, action, onClose, onDone }) {
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (action === 'reject' && !remarks.trim()) return setError('A reason is required to reject.');
    setSubmitting(true);
    try {
      if (action === 'approve') await approveRequest(request.id, remarks || undefined);
      else await rejectRequest(request.id, remarks);
      onDone();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Action failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="us-overlay" onClick={onClose}>
      <div className="us-modal us-modal--sm" onClick={(e) => e.stopPropagation()}>
        <div className="us-modal-header">
          <h2 className="us-modal-title">{action === 'approve' ? 'Approve Request' : 'Reject Request'}</h2>
          <button className="us-modal-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="us-modal-body">
            {error && <div className="us-error">{error}</div>}
            <p className="us-confirm-text">
              {request.request_no} — {request.service_name} ({request.member_name})
            </p>
            <div className="us-field">
              <label className="us-label">
                Remarks {action === 'reject' && <span className="us-required">*</span>}
              </label>
              <textarea className="us-input" rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
            </div>
          </div>
          <div className="us-modal-footer">
            <button type="button" className="us-btn us-btn--ghost" onClick={onClose} disabled={submitting}>Cancel</button>
            <button type="submit" className={`us-btn ${action === 'approve' ? 'us-btn--primary' : 'us-btn--danger'}`} disabled={submitting}>
              {submitting ? 'Saving…' : action === 'approve' ? 'Approve' : 'Reject'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ApprovalsTab({ pending, loading, onActed }) {
  const [expanded, setExpanded] = useState(null);
  const [actionTarget, setActionTarget] = useState(null);

  if (loading) return <div className="us-state">Loading approvals…</div>;
  if (pending.length === 0) {
    return (
      <EmptyState
        icon={(
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
        title="No requests are waiting on your approval."
      />
    );
  }

  return (
    <div className="us-request-list">
      {pending.map((r) => (
        <div className="us-request-card" key={r.id}>
          <div className="us-request-row" onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
            <div className="us-request-main">
              <RequestDot status={r.status} />
              <div>
                <div className="us-request-service">{r.service_name}</div>
                <div className="us-request-no">
                  {r.request_no} · {r.member_name} ({r.member_code}) · {fmtDate(r.submitted_at)}
                </div>
              </div>
            </div>
            <div className="us-approval-actions" onClick={(e) => e.stopPropagation()}>
              <button className="us-btn us-btn--primary" onClick={() => setActionTarget({ request: r, action: 'approve' })}>
                Approve
              </button>
              {r.can_reject && (
                <button className="us-btn us-btn--danger" onClick={() => setActionTarget({ request: r, action: 'reject' })}>
                  Reject
                </button>
              )}
            </div>
          </div>
          {expanded === r.id && <Timeline requestId={r.id} />}
        </div>
      ))}

      {actionTarget && (
        <ActionModal
          request={actionTarget.request}
          action={actionTarget.action}
          onClose={() => setActionTarget(null)}
          onDone={() => { setActionTarget(null); onActed(); }}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════
function Services() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('available');
  const [pending, setPending] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [servicesCount, setServicesCount] = useState(0);
  const [myRequests, setMyRequests] = useState([]);

  const loadPending = useCallback(() => {
    setPendingLoading(true);
    getPendingApprovals()
      .then(setPending)
      .catch(() => setPending([]))
      .finally(() => setPendingLoading(false));
  }, []);

  useEffect(() => { loadPending(); }, [loadPending]);

  const bump = () => setRefreshKey((k) => k + 1);
  const myRequestsPending = myRequests.filter((r) => ACTIVE_STATUSES.includes(r.status)).length;

  return (
    <div className="us-root">
      <header className="us-header">
        <div className="us-header-brand" onClick={() => navigate('/dashboard')}>
          <img src={logo} alt="PRMCF" className="us-header-logo" />
          <div>
            <div className="us-header-name">PRMCF</div>
            <div className="us-header-sub">Offline Services</div>
          </div>
        </div>
        <nav className="us-header-nav">
          <button className="us-nav-btn" onClick={() => navigate('/dashboard')}>Dashboard</button>
          <ProfileMenu />
        </nav>
      </header>

      <div className="us-content">
        <div className="us-page-head">
          <h1 className="us-page-title">Offline Services</h1>
          <p className="us-page-subtitle">Apply for services, track your requests, and manage approvals</p>
        </div>

        <div className="us-stats-row">
          <div className="us-stat-card us-stat-card--accent">
            <div className="us-stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <div className="us-stat-value">{servicesCount}</div>
            <div className="us-stat-label">Available Services</div>
          </div>

          <div className="us-stat-card">
            <div className="us-stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </div>
            <div className="us-stat-value">{myRequests.length}</div>
            <div className="us-stat-label">My Requests</div>
            {myRequestsPending > 0 && <span className="us-stat-sub">{myRequestsPending} in progress</span>}
          </div>

          {pending.length > 0 && (
            <div className="us-stat-card us-stat-card--warning">
              <div className="us-stat-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className="us-stat-value">{pending.length}</div>
              <div className="us-stat-label">Pending My Approval</div>
            </div>
          )}
        </div>

        <div className="us-tabs">
          <button className={`us-tab-btn${activeTab === 'available' ? ' us-tab-btn--active' : ''}`} onClick={() => setActiveTab('available')}>
            Available Services
          </button>
          <button className={`us-tab-btn${activeTab === 'mine' ? ' us-tab-btn--active' : ''}`} onClick={() => setActiveTab('mine')}>
            My Requests
          </button>
          {(pending.length > 0 || activeTab === 'approvals') && (
            <button className={`us-tab-btn${activeTab === 'approvals' ? ' us-tab-btn--active' : ''}`} onClick={() => setActiveTab('approvals')}>
              Approvals {pending.length > 0 && <span className="us-tab-count">{pending.length}</span>}
            </button>
          )}
        </div>

        {activeTab === 'available' && <AvailableServicesTab onApplied={bump} onCount={setServicesCount} />}
        {activeTab === 'mine' && <MyRequestsTab refreshKey={refreshKey} onCount={setMyRequests} />}
        {activeTab === 'approvals' && <ApprovalsTab pending={pending} loading={pendingLoading} onActed={loadPending} />}
      </div>
    </div>
  );
}

export default Services;
