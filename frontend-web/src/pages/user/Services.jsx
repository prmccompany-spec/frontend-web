import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getServices, getServiceDocuments } from '../../services/serviceService';
import {
  submitServiceRequest,
  getMyRequests,
  getPendingApprovals,
  getRequestDetail,
  approveRequest,
  rejectRequest,
} from '../../services/serviceRequestService';
import logo from '../../assets/logo.png';
import './Services.css';

const BACKEND_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api').replace(/\/api$/, '');

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const STATUS_LABEL = {
  SUBMITTED: 'Submitted',
  IN_PROGRESS: 'In Progress',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  COMPLETED: 'Completed',
};

function StatusBadge({ status }) {
  return <span className={`us-status us-status--${status.toLowerCase()}`}>{STATUS_LABEL[status] ?? status}</span>;
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
            href={`${BACKEND_BASE}/${d.file_path}`}
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

            <div className="us-field">
              <label className="us-label">Filled Offline Form (PDF) <span className="us-required">*</span></label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setOfflineFormFile(e.target.files[0] ?? null)}
              />
            </div>

            {loadingDocs ? (
              <div className="us-state">Loading required documents…</div>
            ) : (
              documents.map((d) => (
                <div className="us-field" key={d.id}>
                  <label className="us-label">
                    {d.document_name} {d.mandatory ? <span className="us-required">*</span> : <span className="us-optional">(optional)</span>}
                  </label>
                  <input
                    type="file"
                    accept={(d.allowed_extensions || '').split(',').map((e) => `.${e.trim()}`).join(',')}
                    onChange={(e) => setDocFiles((f) => ({ ...f, [d.id]: e.target.files[0] ?? null }))}
                  />
                </div>
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
function AvailableServicesTab({ onApplied }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyTarget, setApplyTarget] = useState(null);
  const [submittedRef, setSubmittedRef] = useState('');

  useEffect(() => {
    getServices({ published: true })
      .then(setServices)
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  }, []);

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
        <div className="us-state">No services are available right now.</div>
      ) : (
        <div className="us-service-grid">
          {services.map((s) => (
            <div className="us-service-card" key={s.id}>
              <h3>{s.name}</h3>
              {s.description && <p>{s.description}</p>}
              <div className="us-service-actions">
                {s.offline_form_path && (
                  <a
                    className="us-btn us-btn--ghost"
                    href={`${BACKEND_BASE}/${s.offline_form_path}`}
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
function MyRequestsTab({ refreshKey }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    getMyRequests()
      .then(setRequests)
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  if (loading) return <div className="us-state">Loading your requests…</div>;
  if (requests.length === 0) return <div className="us-state">You haven't submitted any requests yet.</div>;

  return (
    <div className="us-request-list">
      {requests.map((r) => (
        <div className="us-request-card" key={r.id}>
          <div className="us-request-row" onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
            <div>
              <div className="us-request-service">{r.service_name}</div>
              <div className="us-request-no">{r.request_no} · {fmtDate(r.submitted_at)}</div>
            </div>
            <StatusBadge status={r.status} />
          </div>
          {expanded === r.id && <Timeline requestId={r.id} />}
        </div>
      ))}
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
  if (pending.length === 0) return <div className="us-state">No requests are waiting on your approval.</div>;

  return (
    <div className="us-request-list">
      {pending.map((r) => (
        <div className="us-request-card" key={r.id}>
          <div className="us-request-row" onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
            <div>
              <div className="us-request-service">{r.service_name}</div>
              <div className="us-request-no">
                {r.request_no} · {r.member_name} ({r.member_code}) · {fmtDate(r.submitted_at)}
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
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('available');
  const [pending, setPending] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadPending = useCallback(() => {
    setPendingLoading(true);
    getPendingApprovals()
      .then(setPending)
      .catch(() => setPending([]))
      .finally(() => setPendingLoading(false));
  }, []);

  useEffect(() => { loadPending(); }, [loadPending]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const bump = () => setRefreshKey((k) => k + 1);

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
          <button className="us-logout-btn" onClick={handleLogout}>Logout</button>
        </nav>
      </header>

      <div className="us-content">
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

        {activeTab === 'available' && <AvailableServicesTab onApplied={bump} />}
        {activeTab === 'mine' && <MyRequestsTab refreshKey={refreshKey} />}
        {activeTab === 'approvals' && <ApprovalsTab pending={pending} loading={pendingLoading} onActed={loadPending} />}
      </div>
    </div>
  );
}

export default Services;
