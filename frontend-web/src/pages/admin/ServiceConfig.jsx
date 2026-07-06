import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getServiceDetail,
  getServiceDocuments,
  saveServiceDocuments,
  getWorkflowSteps,
  saveWorkflowSteps,
} from '../../services/serviceService';
import { getUserTypes } from '../../services/userTypeService';
import './ServiceConfig.css';

let tempIdCounter = 0;
const nextTempId = () => `tmp-${++tempIdCounter}`;

// ═══════════════════════════════════════════════════════════════
// DOCUMENTS TAB
// ═══════════════════════════════════════════════════════════════
function DocumentsTab({ serviceId }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getServiceDocuments(serviceId)
      .then((rows) => setDocs(rows.map((r) => ({ ...r, _key: r.id ?? nextTempId() }))))
      .catch(() => setError('Failed to load documents.'))
      .finally(() => setLoading(false));
  }, [serviceId]);

  const addRow = () => {
    setDocs((d) => [
      ...d,
      { _key: nextTempId(), document_name: '', mandatory: true, allowed_extensions: 'pdf,jpg,jpeg,png', max_file_size_mb: 5 },
    ]);
  };

  const updateRow = (key, patch) => {
    setDocs((d) => d.map((row) => (row._key === key ? { ...row, ...patch } : row)));
  };

  const removeRow = (key) => {
    setDocs((d) => d.filter((row) => row._key !== key));
  };

  const handleSave = async () => {
    setError('');
    setSaved(false);
    if (docs.some((d) => !d.document_name.trim())) {
      setError('Every document needs a name.');
      return;
    }
    setSaving(true);
    try {
      const payload = docs.map((d, i) => ({
        document_name: d.document_name.trim(),
        mandatory: !!d.mandatory,
        allowed_extensions: d.allowed_extensions || 'pdf,jpg,jpeg,png',
        max_file_size_mb: Number(d.max_file_size_mb) || 5,
        display_order: i + 1,
      }));
      const rows = await saveServiceDocuments(serviceId, payload);
      setDocs((rows.data ?? rows).map((r) => ({ ...r, _key: r.id })));
      setSaved(true);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to save documents.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="cf-state">Loading…</div>;

  return (
    <div className="cf-tab-content">
      {error && <div className="cf-error">{error}</div>}
      {saved && <div className="cf-success">Documents saved.</div>}

      {docs.length === 0 ? (
        <div className="cf-empty">No required documents configured yet.</div>
      ) : (
        <div className="cf-doc-list">
          {docs.map((d) => (
            <div key={d._key} className="cf-doc-row">
              <input
                className="cf-input cf-doc-name"
                placeholder="Document name (e.g. Aadhaar Card)"
                value={d.document_name}
                onChange={(e) => updateRow(d._key, { document_name: e.target.value })}
              />
              <input
                className="cf-input cf-doc-ext"
                placeholder="pdf,jpg,png"
                value={d.allowed_extensions ?? ''}
                onChange={(e) => updateRow(d._key, { allowed_extensions: e.target.value })}
              />
              <input
                className="cf-input cf-doc-size"
                type="number"
                min="1"
                value={d.max_file_size_mb ?? 5}
                onChange={(e) => updateRow(d._key, { max_file_size_mb: e.target.value })}
              />
              <label className="cf-checkbox-label">
                <input
                  type="checkbox"
                  checked={!!d.mandatory}
                  onChange={(e) => updateRow(d._key, { mandatory: e.target.checked })}
                />
                Mandatory
              </label>
              <button className="cf-remove-btn" onClick={() => removeRow(d._key)} aria-label="Remove document">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="cf-tab-actions">
        <button className="cf-btn cf-btn--ghost" onClick={addRow}>+ Add Document</button>
        <button className="cf-btn cf-btn--primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save Documents'}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// WORKFLOW TAB
// ═══════════════════════════════════════════════════════════════
function WorkflowTab({ serviceId, userTypes }) {
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getWorkflowSteps(serviceId)
      .then((rows) => setSteps(rows.map((r) => ({ ...r, _key: r.id ?? nextTempId() }))))
      .catch(() => setError('Failed to load workflow.'))
      .finally(() => setLoading(false));
  }, [serviceId]);

  const addStep = () => {
    setSteps((s) => [...s, { _key: nextTempId(), user_type_id: userTypes[0]?.id ?? '', step_label: '', can_reject: true }]);
  };

  const updateStep = (key, patch) => {
    setSteps((s) => s.map((row) => (row._key === key ? { ...row, ...patch } : row)));
  };

  const removeStep = (key) => {
    setSteps((s) => s.filter((row) => row._key !== key));
  };

  const move = (index, dir) => {
    setSteps((s) => {
      const copy = [...s];
      const target = index + dir;
      if (target < 0 || target >= copy.length) return copy;
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
  };

  const handleSave = async () => {
    setError('');
    setSaved(false);
    if (steps.length === 0) {
      setError('At least one workflow step is required.');
      return;
    }
    if (steps.some((s) => !s.user_type_id)) {
      setError('Every step needs an approver role.');
      return;
    }
    setSaving(true);
    try {
      const payload = steps.map((s) => ({
        user_type_id: Number(s.user_type_id),
        step_label: s.step_label || null,
        can_reject: !!s.can_reject,
      }));
      const rows = await saveWorkflowSteps(serviceId, payload);
      setSteps((rows.data ?? rows).map((r) => ({ ...r, _key: r.id })));
      setSaved(true);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to save workflow.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="cf-state">Loading…</div>;

  return (
    <div className="cf-tab-content">
      {error && <div className="cf-error">{error}</div>}
      {saved && <div className="cf-success">Workflow saved.</div>}
      <p className="cf-hint">
        Steps run in order top to bottom. The last step automatically completes the request when approved.
      </p>

      {steps.length === 0 ? (
        <div className="cf-empty">No workflow steps configured yet.</div>
      ) : (
        <div className="cf-step-list">
          {steps.map((s, i) => (
            <div key={s._key} className="cf-step-row">
              <div className="cf-step-order">
                <span className="cf-step-no">{i + 1}</span>
                <div className="cf-step-order-btns">
                  <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">▲</button>
                  <button onClick={() => move(i, 1)} disabled={i === steps.length - 1} aria-label="Move down">▼</button>
                </div>
              </div>
              <select
                className="cf-input cf-step-role"
                value={s.user_type_id}
                onChange={(e) => updateStep(s._key, { user_type_id: e.target.value })}
              >
                <option value="">Select approver role…</option>
                {userTypes.map((ut) => (
                  <option key={ut.id} value={ut.id}>{ut.type_name}</option>
                ))}
              </select>
              <input
                className="cf-input cf-step-label"
                placeholder="Step label (optional, e.g. President Review)"
                value={s.step_label ?? ''}
                onChange={(e) => updateStep(s._key, { step_label: e.target.value })}
              />
              <label className="cf-checkbox-label">
                <input
                  type="checkbox"
                  checked={!!s.can_reject}
                  onChange={(e) => updateStep(s._key, { can_reject: e.target.checked })}
                />
                Can reject
              </label>
              {i === steps.length - 1 && <span className="cf-final-badge">Final</span>}
              <button className="cf-remove-btn" onClick={() => removeStep(s._key)} aria-label="Remove step">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="cf-tab-actions">
        <button className="cf-btn cf-btn--ghost" onClick={addStep}>+ Add Step</button>
        <button className="cf-btn cf-btn--primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save Workflow'}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════
const TABS = [
  { key: 'documents', label: 'Required Documents' },
  { key: 'workflow', label: 'Approval Workflow' },
];

function ServiceConfig() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [userTypes, setUserTypes] = useState([]);
  const [activeTab, setActiveTab] = useState('documents');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [detail, typesRes] = await Promise.all([getServiceDetail(id), getUserTypes()]);
      setService(detail);
      setUserTypes(typesRes.data.data ?? []);
    } catch {
      setService(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="admin-content"><div className="cf-state">Loading…</div></div>;
  if (!service) return <div className="admin-content"><div className="cf-state">Service not found.</div></div>;

  return (
    <div className="admin-content cf-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Configure: {service.name}</h1>
          <p className="admin-page-subtitle">Set the documents members must upload and the approval chain for this service</p>
        </div>
        <button className="cf-back-btn" onClick={() => navigate('/admin/services')}>Back to Services</button>
      </div>

      <div className="cf-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`cf-tab-btn${activeTab === t.key ? ' cf-tab-btn--active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'documents' && <DocumentsTab serviceId={id} />}
      {activeTab === 'workflow' && <WorkflowTab serviceId={id} userTypes={userTypes} />}
    </div>
  );
}

export default ServiceConfig;
