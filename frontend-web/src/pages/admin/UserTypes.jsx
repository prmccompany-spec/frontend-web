import { useState, useEffect, useCallback } from 'react';
import { getUserTypes, createUserType, updateUserType } from '../../services/userTypeService';
import './UserTypes.css';

// ── Shared modal shell ────────────────────────────────────────────────────────
function Modal({ title, subtitle, onClose, children }) {
  return (
    <div className="ut-backdrop" onClick={onClose}>
      <div className="ut-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ut-modal-header">
          <div>
            <h2 className="ut-modal-title">{title}</h2>
            {subtitle && <p className="ut-modal-subtitle">{subtitle}</p>}
          </div>
          <button className="ut-modal-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Add modal ─────────────────────────────────────────────────────────────────
function AddModal({ onClose, onSaved }) {
  const [typeName, setTypeName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await createUserType(typeName.trim());
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to create user type.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Add User Type" subtitle="New type will be available when registering members" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="ut-modal-body">
          {error && (
            <div className="ut-form-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}
          <div className="ut-field">
            <label className="ut-label">Type Name <span className="ut-required">*</span></label>
            <input
              className="ut-input"
              placeholder="e.g. treasurer"
              value={typeName}
              onChange={(e) => setTypeName(e.target.value)}
              autoFocus
              required
            />
            <p className="ut-hint">Saved in lowercase. Must be unique.</p>
          </div>
        </div>
        <div className="ut-modal-footer">
          <button type="button" className="ut-btn ut-btn--ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="ut-btn ut-btn--primary" disabled={loading}>
            {loading ? <><span className="ut-spinner" /> Adding…</> : 'Add Type'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Edit modal ────────────────────────────────────────────────────────────────
function EditModal({ userType, onClose, onSaved }) {
  const [typeName, setTypeName] = useState(userType.type_name);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await updateUserType(userType.id, typeName.trim());
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to update user type.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Edit User Type" subtitle={`Editing type #${userType.id}`} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="ut-modal-body">
          {error && (
            <div className="ut-form-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}
          <div className="ut-field">
            <label className="ut-label">Type Name <span className="ut-required">*</span></label>
            <input
              className="ut-input"
              value={typeName}
              onChange={(e) => setTypeName(e.target.value)}
              autoFocus
              required
            />
            <p className="ut-hint">Saved in lowercase. Must be unique.</p>
          </div>
        </div>
        <div className="ut-modal-footer">
          <button type="button" className="ut-btn ut-btn--ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="ut-btn ut-btn--primary" disabled={loading}>
            {loading ? <><span className="ut-spinner" /> Saving…</> : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
function UserTypes() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editType, setEditType] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getUserTypes();
      setTypes(res.data.data ?? []);
    } catch {
      setError('Failed to load user types. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSaved = () => {
    setShowAdd(false);
    setEditType(null);
    load();
  };

  return (
    <div className="ut-page">
      <div className="ut-page-header">
        <div className="ut-page-header-left">
          <div className="ut-page-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              <line x1="19" y1="8" x2="23" y2="8" />
              <line x1="21" y1="6" x2="21" y2="10" />
            </svg>
          </div>
          <div>
            <h1 className="ut-page-title">User Types</h1>
            <p className="ut-page-subtitle">
              {loading ? 'Loading…' : `${types.length} type${types.length !== 1 ? 's' : ''} defined`}
            </p>
          </div>
        </div>
        <button className="ut-add-btn" onClick={() => setShowAdd(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Type
        </button>
      </div>

      {error && (
        <div className="ut-alert">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      <div className="ut-table-wrap">
        {loading ? (
          <div className="ut-state"><span className="ut-loading-spinner" /> Loading types…</div>
        ) : types.length === 0 ? (
          <div className="ut-state">
            No user types found.{' '}
            <button className="ut-inline-btn" onClick={() => setShowAdd(true)}>Add the first one</button>
          </div>
        ) : (
          <table className="ut-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Type Name</th>
                <th>Members</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {types.map((t, i) => (
                <tr key={t.id}>
                  <td className="ut-td-num">{i + 1}</td>
                  <td>
                    <span className="ut-type-pill">{t.type_name}</span>
                  </td>
                  <td className="ut-td-meta">ID {t.id}</td>
                  <td>
                    <button
                      className="ut-edit-btn"
                      onClick={() => setEditType(t)}
                      title="Edit type"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAdd && <AddModal onClose={() => setShowAdd(false)} onSaved={handleSaved} />}
      {editType && <EditModal userType={editType} onClose={() => setEditType(null)} onSaved={handleSaved} />}
    </div>
  );
}

export default UserTypes;
