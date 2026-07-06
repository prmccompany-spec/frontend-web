import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getServices, deleteService, togglePublish } from '../../services/serviceService';
import './ServicesList.css';

function DeactivateModal({ service, onClose, onConfirmed }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    setLoading(true);
    setError('');
    try {
      await deleteService(service.id);
      onConfirmed();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to deactivate service.');
      setLoading(false);
    }
  };

  return (
    <div className="sv-overlay" onClick={onClose}>
      <div className="sv-modal sv-modal--sm" onClick={(e) => e.stopPropagation()}>
        <div className="sv-modal-header">
          <h2 className="sv-modal-title">Deactivate Service</h2>
          <button className="sv-modal-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="sv-modal-body">
          {error && <div className="sv-modal-error">{error}</div>}
          <p className="sv-delete-msg">
            Are you sure you want to deactivate <strong>{service.name}</strong>? It will be
            unpublished and hidden from members. Existing submitted requests are not affected.
          </p>
        </div>
        <div className="sv-modal-footer">
          <button className="sv-btn sv-btn--ghost" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="sv-btn sv-btn--danger" onClick={handleConfirm} disabled={loading}>
            {loading ? 'Deactivating…' : 'Deactivate'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ServicesList() {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [publishingId, setPublishingId] = useState(null);
  const [deactivateTarget, setDeactivateTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setServices(await getServices());
    } catch {
      setError('Failed to load services. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleTogglePublish = async (service) => {
    setPublishingId(service.id);
    try {
      await togglePublish(service.id, !service.is_published);
      await load();
    } catch (err) {
      alert(err.response?.data?.message ?? 'Failed to update publish status.');
    } finally {
      setPublishingId(null);
    }
  };

  return (
    <div className="admin-content sv-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Offline Services</h1>
          <p className="admin-page-subtitle">Configure services, required documents and approval workflows</p>
        </div>
        <button className="sv-add-btn" onClick={() => navigate('/admin/services/new')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Service
        </button>
      </div>

      {error && <div className="sv-alert">{error}</div>}

      {loading ? (
        <div className="sv-state">Loading…</div>
      ) : services.length === 0 ? (
        <div className="sv-state">
          No services yet. <button className="sv-inline-btn" onClick={() => navigate('/admin/services/new')}>Create the first one</button>
        </div>
      ) : (
        <div className="sv-table-wrap">
          <table className="sv-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Documents</th>
                <th>Workflow Steps</th>
                <th>Status</th>
                <th className="sv-th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div className="sv-td-name">{s.name}</div>
                    {s.description && <div className="sv-td-desc">{s.description}</div>}
                  </td>
                  <td className="sv-td-center">{s.document_count}</td>
                  <td className="sv-td-center">{s.step_count}</td>
                  <td>
                    <span className={`sv-status ${s.is_published ? 'sv-status--published' : 'sv-status--draft'}`}>
                      {s.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="sv-td-actions">
                    <button className="sv-row-btn" onClick={() => navigate(`/admin/services/${s.id}/edit`)}>Edit</button>
                    <button className="sv-row-btn" onClick={() => navigate(`/admin/services/${s.id}/configure`)}>Configure</button>
                    <button
                      className="sv-row-btn sv-row-btn--publish"
                      onClick={() => handleTogglePublish(s)}
                      disabled={publishingId === s.id}
                    >
                      {publishingId === s.id ? '…' : s.is_published ? 'Unpublish' : 'Publish'}
                    </button>
                    <button className="sv-row-btn sv-row-btn--danger" onClick={() => setDeactivateTarget(s)}>Deactivate</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deactivateTarget && (
        <DeactivateModal
          service={deactivateTarget}
          onClose={() => setDeactivateTarget(null)}
          onConfirmed={() => { setDeactivateTarget(null); load(); }}
        />
      )}
    </div>
  );
}

export default ServicesList;
