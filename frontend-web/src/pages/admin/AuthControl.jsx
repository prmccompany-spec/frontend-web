import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import './AuthControl.css';

const EMPTY_FORM = {
  route_key: '',
  route_label: '',
  description: '',
  require_login: 0,
  allowed_type_ids: [],
};

function parseIds(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try { return JSON.parse(val); } catch { return []; }
}

/* ── Modal ─────────────────────────────────────────── */
function PermissionModal({ mode, initial, userTypes, onSave, onClose, saving, error }) {
  const [form, setForm] = useState(initial);

  const toggleType = (id) => {
    setForm((f) => ({
      ...f,
      allowed_type_ids: f.allowed_type_ids.includes(id)
        ? f.allowed_type_ids.filter((t) => t !== id)
        : [...f.allowed_type_ids, id],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="ac-overlay" onClick={onClose}>
      <div className="ac-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ac-modal-header">
          <h2 className="ac-modal-title">
            {mode === 'add' ? 'Add Route Permission' : 'Edit Route Permission'}
          </h2>
          <button className="ac-modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {error && <div className="ac-modal-error">{error}</div>}

        <form onSubmit={handleSubmit} className="ac-modal-body">
          <div className="ac-field-row">
            <div className="ac-field">
              <label className="ac-label">Route Key <span className="ac-required">*</span></label>
              <input
                className="ac-input"
                placeholder="e.g. admin, donate"
                value={form.route_key}
                onChange={(e) => setForm((f) => ({ ...f, route_key: e.target.value }))}
                disabled={mode === 'edit'}
                required
              />
              {mode === 'edit' && <span className="ac-hint">Route key cannot be changed after creation</span>}
            </div>
            <div className="ac-field">
              <label className="ac-label">Route Label <span className="ac-required">*</span></label>
              <input
                className="ac-input"
                placeholder="e.g. Admin Panel"
                value={form.route_label}
                onChange={(e) => setForm((f) => ({ ...f, route_label: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="ac-field">
            <label className="ac-label">Description</label>
            <input
              className="ac-input"
              placeholder="Brief description of this route"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>

          <div className="ac-field">
            <label className="ac-label">Require Login</label>
            <div className="ac-toggle-wrap">
              <button
                type="button"
                className={`ac-toggle${form.require_login ? ' ac-toggle--on' : ''}`}
                onClick={() => setForm((f) => ({ ...f, require_login: f.require_login ? 0 : 1 }))}
              >
                <span className="ac-toggle-knob" />
              </button>
              <span className="ac-toggle-text">
                {form.require_login ? 'Login required to access this route' : 'Accessible without login'}
              </span>
            </div>
          </div>

          <div className="ac-field">
            <label className="ac-label">
              Allowed User Types
              <span className="ac-label-hint">— leave empty to allow all logged-in users</span>
            </label>
            <div className="ac-chips">
              {userTypes.map((ut) => {
                const on = form.allowed_type_ids.includes(ut.id);
                return (
                  <button
                    key={ut.id}
                    type="button"
                    className={`ac-chip${on ? ' ac-chip--on' : ''}`}
                    onClick={() => toggleType(ut.id)}
                  >
                    {on && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                    {ut.type_name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="ac-modal-footer">
            <button type="button" className="ac-btn ac-btn--ghost" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="ac-btn ac-btn--primary" disabled={saving}>
              {saving ? 'Saving…' : mode === 'add' ? 'Add Permission' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Delete confirm ─────────────────────────────────── */
function DeleteModal({ perm, onConfirm, onClose, saving }) {
  return (
    <div className="ac-overlay" onClick={onClose}>
      <div className="ac-modal ac-modal--sm" onClick={(e) => e.stopPropagation()}>
        <div className="ac-modal-header">
          <h2 className="ac-modal-title">Delete Permission</h2>
          <button className="ac-modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="ac-modal-body">
          <p className="ac-delete-msg">
            Are you sure you want to delete the <strong>{perm.route_label}</strong> permission?
            This will remove all access control for the <code>{perm.route_key}</code> route.
          </p>
          <div className="ac-modal-footer">
            <button className="ac-btn ac-btn--ghost" onClick={onClose} disabled={saving}>Cancel</button>
            <button className="ac-btn ac-btn--danger" onClick={onConfirm} disabled={saving}>
              {saving ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main component ─────────────────────────────────── */
function AuthControl() {
  const [permissions, setPermissions] = useState([]);
  const [userTypes, setUserTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modal, setModal] = useState(null); // { mode: 'add'|'edit'|'delete', perm?: {} }
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([api.get('/route-permissions'), api.get('/user-types')])
      .then(([permsRes, typesRes]) => {
        setPermissions(
          (permsRes.data.data ?? []).map((p) => ({
            ...p,
            allowed_type_ids: parseIds(p.allowed_type_ids),
          }))
        );
        setUserTypes(typesRes.data.data ?? typesRes.data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setModalError('');
    setModal({ mode: 'add', perm: { ...EMPTY_FORM } });
  };

  const openEdit = (perm) => {
    setModalError('');
    setModal({ mode: 'edit', perm: { ...perm } });
  };

  const openDelete = (perm) => {
    setModal({ mode: 'delete', perm });
  };

  const closeModal = () => {
    if (saving) return;
    setModal(null);
    setModalError('');
  };

  const handleSave = async (form) => {
    setSaving(true);
    setModalError('');
    try {
      if (modal.mode === 'add') {
        await api.post('/route-permissions', form);
      } else {
        await api.put(`/route-permissions/${modal.perm.id}`, form);
      }
      setModal(null);
      load();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await api.delete(`/route-permissions/${modal.perm.id}`);
      setModal(null);
      load();
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const typeNames = (ids) => {
    if (!ids || ids.length === 0) return <span className="ac-all-badge">All users</span>;
    return ids.map((id) => {
      const ut = userTypes.find((t) => t.id === id);
      return ut ? (
        <span key={id} className="ac-type-tag">{ut.type_name}</span>
      ) : null;
    });
  };

  return (
    <div className="admin-content ac-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Auth Control</h1>
          <p className="admin-page-subtitle">Configure login requirements and user type access for each route</p>
        </div>
        <button className="ac-add-btn" onClick={openAdd}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Permission
        </button>
      </div>

      {loading ? (
        <div className="ac-loading">Loading permissions…</div>
      ) : permissions.length === 0 ? (
        <div className="ac-empty">
          <div className="ac-empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <p>No route permissions defined yet.</p>
          <button className="ac-btn ac-btn--primary" onClick={openAdd}>Add your first permission</button>
        </div>
      ) : (
        <div className="ac-table-wrap">
          <table className="ac-table">
            <thead>
              <tr>
                <th>Route Key</th>
                <th>Label</th>
                <th>Description</th>
                <th className="ac-th-center">Login Required</th>
                <th>Allowed Types</th>
                <th className="ac-th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {permissions.map((perm) => (
                <tr key={perm.id}>
                  <td><code className="ac-key">{perm.route_key}</code></td>
                  <td className="ac-td-label">{perm.route_label}</td>
                  <td className="ac-td-desc">{perm.description || <span className="ac-none">—</span>}</td>
                  <td className="ac-td-center">
                    {perm.require_login ? (
                      <span className="ac-status ac-status--yes">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Yes
                      </span>
                    ) : (
                      <span className="ac-status ac-status--no">No</span>
                    )}
                  </td>
                  <td className="ac-td-types">{typeNames(perm.allowed_type_ids)}</td>
                  <td className="ac-td-actions">
                    <button className="ac-row-btn ac-row-btn--edit" onClick={() => openEdit(perm)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      Edit
                    </button>
                    <button className="ac-row-btn ac-row-btn--delete" onClick={() => openDelete(perm)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                      </svg>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal?.mode !== 'delete' && modal && (
        <PermissionModal
          mode={modal.mode}
          initial={modal.perm}
          userTypes={userTypes}
          onSave={handleSave}
          onClose={closeModal}
          saving={saving}
          error={modalError}
        />
      )}

      {modal?.mode === 'delete' && (
        <DeleteModal
          perm={modal.perm}
          onConfirm={handleDelete}
          onClose={closeModal}
          saving={saving}
        />
      )}
    </div>
  );
}

export default AuthControl;
