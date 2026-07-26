import { useState, useEffect, useCallback } from 'react';
import { getUserTypes, createUserType, updateUserType } from '../../services/userTypeService';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../../services/paymentService';
import {
  getCategories as getExpenseCategories,
  createCategory as createExpenseCategory,
  updateCategory as updateExpenseCategory,
  deleteCategory as deleteExpenseCategory,
} from '../../services/expenseService';
import {
  getMemberStatuses,
  createMemberStatus,
  updateMemberStatus,
} from '../../services/memberStatusService';
import {
  getBranches,
  createBranch,
  updateBranch,
} from '../../services/branchService';
import './Settings.css';

// ─── Shared helpers ───────────────────────────────────────────────

function Modal({ title, subtitle, onClose, children }) {
  return (
    <div className="st-backdrop" onClick={onClose}>
      <div className="st-modal" onClick={(e) => e.stopPropagation()}>
        <div className="st-modal-header">
          <div>
            <h2 className="st-modal-title">{title}</h2>
            {subtitle && <p className="st-modal-subtitle">{subtitle}</p>}
          </div>
          <button className="st-modal-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ErrorBanner({ msg }) {
  return (
    <div className="st-form-error">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      {msg}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// USER TYPES TAB
// ═══════════════════════════════════════════════════════════════════

function AddTypeModal({ onClose, onSaved }) {
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
        <div className="st-modal-body">
          {error && <ErrorBanner msg={error} />}
          <div className="st-field">
            <label className="st-label">Type Name <span className="st-required">*</span></label>
            <input className="st-input" placeholder="e.g. treasurer" value={typeName}
              onChange={(e) => setTypeName(e.target.value)} autoFocus required />
            <p className="st-hint">Saved in lowercase. Must be unique.</p>
          </div>
        </div>
        <div className="st-modal-footer">
          <button type="button" className="st-btn st-btn--ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="st-btn st-btn--primary" disabled={loading}>
            {loading ? 'Adding…' : 'Add Type'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function EditTypeModal({ userType, onClose, onSaved }) {
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
    <Modal title="Edit User Type" subtitle={`Editing: ${userType.type_name}`} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="st-modal-body">
          {error && <ErrorBanner msg={error} />}
          <div className="st-field">
            <label className="st-label">Type Name <span className="st-required">*</span></label>
            <input className="st-input" value={typeName}
              onChange={(e) => setTypeName(e.target.value)} autoFocus required />
          </div>
        </div>
        <div className="st-modal-footer">
          <button type="button" className="st-btn st-btn--ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="st-btn st-btn--primary" disabled={loading}>
            {loading ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function UserTypesTab() {
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
      setError('Failed to load user types.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSaved = () => { setShowAdd(false); setEditType(null); load(); };

  return (
    <div className="st-tab-content">
      <div className="st-section-header">
        <div>
          <h2 className="st-section-title">User Types</h2>
          <p className="st-section-sub">Define member role types available during registration</p>
        </div>
        <button className="st-add-btn" onClick={() => setShowAdd(true)}>+ Add Type</button>
      </div>

      {error && <ErrorBanner msg={error} />}

      <div className="st-table-wrap">
        {loading ? (
          <div className="st-state">Loading…</div>
        ) : types.length === 0 ? (
          <div className="st-state">No user types found. <button className="st-inline-btn" onClick={() => setShowAdd(true)}>Add the first one</button></div>
        ) : (
          <table className="st-table">
            <thead>
              <tr><th>#</th><th>Type Name</th><th>ID</th><th>Action</th></tr>
            </thead>
            <tbody>
              {types.map((t, i) => (
                <tr key={t.id}>
                  <td className="st-td-num">{i + 1}</td>
                  <td><span className="st-pill st-pill--type">{t.type_name}</span></td>
                  <td className="st-td-meta">{t.id}</td>
                  <td>
                    <button className="st-row-btn" onClick={() => setEditType(t)}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAdd && <AddTypeModal onClose={() => setShowAdd(false)} onSaved={handleSaved} />}
      {editType && <EditTypeModal userType={editType} onClose={() => setEditType(null)} onSaved={handleSaved} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PAYMENT GATEWAY TAB
// ═══════════════════════════════════════════════════════════════════

function AddCategoryModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', description: '', default_amount: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await createCategory({
        name: form.name.trim(),
        description: form.description.trim() || null,
        default_amount: form.default_amount ? Number(form.default_amount) : null,
      });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to create category.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Add Payment Category" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="st-modal-body">
          {error && <ErrorBanner msg={error} />}
          <div className="st-field">
            <label className="st-label">Category Name <span className="st-required">*</span></label>
            <input className="st-input" placeholder="e.g. Annual Membership Fee" required autoFocus
              value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="st-field">
            <label className="st-label">Description</label>
            <input className="st-input" placeholder="Optional short description"
              value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="st-field">
            <label className="st-label">Default Amount (₹)</label>
            <input className="st-input" type="number" min="0" step="0.01" placeholder="Leave blank if variable"
              value={form.default_amount} onChange={(e) => setForm((f) => ({ ...f, default_amount: e.target.value }))} />
            <p className="st-hint">Pre-fills the amount field when this category is selected.</p>
          </div>
        </div>
        <div className="st-modal-footer">
          <button type="button" className="st-btn st-btn--ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="st-btn st-btn--primary" disabled={loading}>
            {loading ? 'Adding…' : 'Add Category'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function EditCategoryModal({ category, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: category.name,
    description: category.description ?? '',
    default_amount: category.default_amount ?? '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await updateCategory(category.id, {
        name: form.name.trim(),
        description: form.description.trim() || null,
        default_amount: form.default_amount !== '' ? Number(form.default_amount) : null,
      });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to update category.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Edit Payment Category" subtitle={`Editing: ${category.name}`} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="st-modal-body">
          {error && <ErrorBanner msg={error} />}
          <div className="st-field">
            <label className="st-label">Category Name <span className="st-required">*</span></label>
            <input className="st-input" required autoFocus value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="st-field">
            <label className="st-label">Description</label>
            <input className="st-input" value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="st-field">
            <label className="st-label">Default Amount (₹)</label>
            <input className="st-input" type="number" min="0" step="0.01" placeholder="Leave blank if variable"
              value={form.default_amount}
              onChange={(e) => setForm((f) => ({ ...f, default_amount: e.target.value }))} />
          </div>
        </div>
        <div className="st-modal-footer">
          <button type="button" className="st-btn st-btn--ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="st-btn st-btn--primary" disabled={loading}>
            {loading ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function DeleteConfirmModal({ category, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteCategory(category.id);
      onDeleted();
    } catch {
      setLoading(false);
    }
  };

  return (
    <Modal title="Deactivate Category" subtitle="This category will be hidden from payment forms" onClose={onClose}>
      <div className="st-modal-body">
        <p className="st-confirm-text">
          Are you sure you want to deactivate <strong>{category.name}</strong>?
          Existing payment records will not be affected.
        </p>
      </div>
      <div className="st-modal-footer">
        <button type="button" className="st-btn st-btn--ghost" onClick={onClose}>Cancel</button>
        <button className="st-btn st-btn--danger" onClick={handleDelete} disabled={loading}>
          {loading ? 'Deactivating…' : 'Deactivate'}
        </button>
      </div>
    </Modal>
  );
}

function PaymentGatewayTab() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [deleteCat, setDeleteCat] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCategories();
      setCategories(data);
    } catch {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSaved = () => { setShowAdd(false); setEditCat(null); setDeleteCat(null); load(); };

  const fmt = (v) => v != null ? `₹${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—';

  return (
    <div className="st-tab-content">
      <div className="st-section-header">
        <div>
          <h2 className="st-section-title">Payment Gateway</h2>
          <p className="st-section-sub">Manage payment categories used when recording cash payments</p>
        </div>
        <button className="st-add-btn" onClick={() => setShowAdd(true)}>+ Add Category</button>
      </div>

      <div className="st-table-wrap">
        {loading ? (
          <div className="st-state">Loading…</div>
        ) : categories.length === 0 ? (
          <div className="st-state">No categories found.</div>
        ) : (
          <table className="st-table">
            <thead>
              <tr><th>#</th><th>Category</th><th>Description</th><th>Default Amount</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {categories.map((c, i) => (
                <tr key={c.id}>
                  <td className="st-td-num">{i + 1}</td>
                  <td><span className="st-pill st-pill--cat">{c.name}</span></td>
                  <td className="st-td-meta">{c.description || '—'}</td>
                  <td className="st-td-amount">{fmt(c.default_amount)}</td>
                  <td className="st-td-actions">
                    <button className="st-row-btn" onClick={() => setEditCat(c)}>Edit</button>
                    <button className="st-row-btn st-row-btn--danger" onClick={() => setDeleteCat(c)}>Deactivate</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAdd && <AddCategoryModal onClose={() => setShowAdd(false)} onSaved={handleSaved} />}
      {editCat && <EditCategoryModal category={editCat} onClose={() => setEditCat(null)} onSaved={handleSaved} />}
      {deleteCat && <DeleteConfirmModal category={deleteCat} onClose={() => setDeleteCat(null)} onDeleted={handleSaved} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// EXPENSE CATEGORIES TAB
// ═══════════════════════════════════════════════════════════════════

function AddExpenseCategoryModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await createExpenseCategory({
        name: form.name.trim(),
        description: form.description.trim() || null,
      });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to create category.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Add Expense Category" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="st-modal-body">
          {error && <ErrorBanner msg={error} />}
          <div className="st-field">
            <label className="st-label">Category Name <span className="st-required">*</span></label>
            <input className="st-input" placeholder="e.g. Maintenance" required autoFocus
              value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="st-field">
            <label className="st-label">Description</label>
            <input className="st-input" placeholder="Optional short description"
              value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
        </div>
        <div className="st-modal-footer">
          <button type="button" className="st-btn st-btn--ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="st-btn st-btn--primary" disabled={loading}>
            {loading ? 'Adding…' : 'Add Category'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function EditExpenseCategoryModal({ category, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: category.name,
    description: category.description ?? '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await updateExpenseCategory(category.id, {
        name: form.name.trim(),
        description: form.description.trim() || null,
      });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to update category.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Edit Expense Category" subtitle={`Editing: ${category.name}`} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="st-modal-body">
          {error && <ErrorBanner msg={error} />}
          <div className="st-field">
            <label className="st-label">Category Name <span className="st-required">*</span></label>
            <input className="st-input" required autoFocus value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="st-field">
            <label className="st-label">Description</label>
            <input className="st-input" value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
        </div>
        <div className="st-modal-footer">
          <button type="button" className="st-btn st-btn--ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="st-btn st-btn--primary" disabled={loading}>
            {loading ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function DeleteExpenseCategoryModal({ category, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteExpenseCategory(category.id);
      onDeleted();
    } catch {
      setLoading(false);
    }
  };

  return (
    <Modal title="Deactivate Category" subtitle="This category will be hidden from the expense form" onClose={onClose}>
      <div className="st-modal-body">
        <p className="st-confirm-text">
          Are you sure you want to deactivate <strong>{category.name}</strong>?
          Existing expense records will not be affected.
        </p>
      </div>
      <div className="st-modal-footer">
        <button type="button" className="st-btn st-btn--ghost" onClick={onClose}>Cancel</button>
        <button className="st-btn st-btn--danger" onClick={handleDelete} disabled={loading}>
          {loading ? 'Deactivating…' : 'Deactivate'}
        </button>
      </div>
    </Modal>
  );
}

function ExpenseCategoriesTab() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [deleteCat, setDeleteCat] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getExpenseCategories();
      setCategories(data);
    } catch {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSaved = () => { setShowAdd(false); setEditCat(null); setDeleteCat(null); load(); };

  return (
    <div className="st-tab-content">
      <div className="st-section-header">
        <div>
          <h2 className="st-section-title">Expense Categories</h2>
          <p className="st-section-sub">Manage categories used when recording expenses in the Expense Book</p>
        </div>
        <button className="st-add-btn" onClick={() => setShowAdd(true)}>+ Add Category</button>
      </div>

      <div className="st-table-wrap">
        {loading ? (
          <div className="st-state">Loading…</div>
        ) : categories.length === 0 ? (
          <div className="st-state">No categories found.</div>
        ) : (
          <table className="st-table">
            <thead>
              <tr><th>#</th><th>Category</th><th>Description</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {categories.map((c, i) => (
                <tr key={c.id}>
                  <td className="st-td-num">{i + 1}</td>
                  <td><span className="st-pill st-pill--cat">{c.name}</span></td>
                  <td className="st-td-meta">{c.description || '—'}</td>
                  <td className="st-td-actions">
                    <button className="st-row-btn" onClick={() => setEditCat(c)}>Edit</button>
                    <button className="st-row-btn st-row-btn--danger" onClick={() => setDeleteCat(c)}>Deactivate</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAdd && <AddExpenseCategoryModal onClose={() => setShowAdd(false)} onSaved={handleSaved} />}
      {editCat && <EditExpenseCategoryModal category={editCat} onClose={() => setEditCat(null)} onSaved={handleSaved} />}
      {deleteCat && <DeleteExpenseCategoryModal category={deleteCat} onClose={() => setDeleteCat(null)} onDeleted={handleSaved} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MEMBER STATUS TAB
// ═══════════════════════════════════════════════════════════════════

function AddStatusModal({ onClose, onSaved }) {
  const [statusName, setStatusName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await createMemberStatus(statusName.trim());
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to create status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Add Member Status" subtitle="New status will be available in the member status dropdown" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="st-modal-body">
          {error && <ErrorBanner msg={error} />}
          <div className="st-field">
            <label className="st-label">Status Name <span className="st-required">*</span></label>
            <input className="st-input" placeholder="e.g. Suspended" value={statusName}
              onChange={(e) => setStatusName(e.target.value)} autoFocus required />
            <p className="st-hint">Must be unique.</p>
          </div>
        </div>
        <div className="st-modal-footer">
          <button type="button" className="st-btn st-btn--ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="st-btn st-btn--primary" disabled={loading}>
            {loading ? 'Adding…' : 'Add Status'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function EditStatusModal({ status, onClose, onSaved }) {
  const [statusName, setStatusName] = useState(status.status_name);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await updateMemberStatus(status.id, statusName.trim());
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to update status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Edit Member Status" subtitle={`Editing: ${status.status_name}`} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="st-modal-body">
          {error && <ErrorBanner msg={error} />}
          <div className="st-field">
            <label className="st-label">Status Name <span className="st-required">*</span></label>
            <input className="st-input" value={statusName}
              onChange={(e) => setStatusName(e.target.value)} autoFocus required />
          </div>
        </div>
        <div className="st-modal-footer">
          <button type="button" className="st-btn st-btn--ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="st-btn st-btn--primary" disabled={loading}>
            {loading ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function MemberStatusTab() {
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editStatus, setEditStatus] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getMemberStatuses();
      setStatuses(res.data.data ?? []);
    } catch {
      setError('Failed to load member statuses.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSaved = () => { setShowAdd(false); setEditStatus(null); load(); };

  return (
    <div className="st-tab-content">
      <div className="st-section-header">
        <div>
          <h2 className="st-section-title">Member Status</h2>
          <p className="st-section-sub">Define statuses selectable when registering or editing members</p>
        </div>
        <button className="st-add-btn" onClick={() => setShowAdd(true)}>+ Add Status</button>
      </div>

      {error && <ErrorBanner msg={error} />}

      <div className="st-table-wrap">
        {loading ? (
          <div className="st-state">Loading…</div>
        ) : statuses.length === 0 ? (
          <div className="st-state">No statuses found. <button className="st-inline-btn" onClick={() => setShowAdd(true)}>Add the first one</button></div>
        ) : (
          <table className="st-table">
            <thead>
              <tr><th>#</th><th>Status Name</th><th>ID</th><th>Action</th></tr>
            </thead>
            <tbody>
              {statuses.map((s, i) => (
                <tr key={s.id}>
                  <td className="st-td-num">{i + 1}</td>
                  <td><span className="st-pill st-pill--type">{s.status_name}</span></td>
                  <td className="st-td-meta">{s.id}</td>
                  <td>
                    <button className="st-row-btn" onClick={() => setEditStatus(s)}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAdd && <AddStatusModal onClose={() => setShowAdd(false)} onSaved={handleSaved} />}
      {editStatus && <EditStatusModal status={editStatus} onClose={() => setEditStatus(null)} onSaved={handleSaved} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// BRANCHES TAB
// ═══════════════════════════════════════════════════════════════════

function AddBranchModal({ onClose, onSaved }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await createBranch(name.trim());
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to create branch.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Add Branch" subtitle="New branch will be available in the member branch dropdown" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="st-modal-body">
          {error && <ErrorBanner msg={error} />}
          <div className="st-field">
            <label className="st-label">Branch Name <span className="st-required">*</span></label>
            <input className="st-input" placeholder="e.g. kottumukkalu" value={name}
              onChange={(e) => setName(e.target.value)} autoFocus required />
            <p className="st-hint">Must be unique.</p>
          </div>
        </div>
        <div className="st-modal-footer">
          <button type="button" className="st-btn st-btn--ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="st-btn st-btn--primary" disabled={loading}>
            {loading ? 'Adding…' : 'Add Branch'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function EditBranchModal({ branch, onClose, onSaved }) {
  const [name, setName] = useState(branch.name);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await updateBranch(branch.id, name.trim());
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to update branch.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Edit Branch" subtitle={`Editing: ${branch.name}`} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="st-modal-body">
          {error && <ErrorBanner msg={error} />}
          <div className="st-field">
            <label className="st-label">Branch Name <span className="st-required">*</span></label>
            <input className="st-input" value={name}
              onChange={(e) => setName(e.target.value)} autoFocus required />
          </div>
        </div>
        <div className="st-modal-footer">
          <button type="button" className="st-btn st-btn--ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="st-btn st-btn--primary" disabled={loading}>
            {loading ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function BranchesTab() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editBranchItem, setEditBranchItem] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getBranches();
      setBranches(res.data.data ?? []);
    } catch {
      setError('Failed to load branches.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSaved = () => { setShowAdd(false); setEditBranchItem(null); load(); };

  return (
    <div className="st-tab-content">
      <div className="st-section-header">
        <div>
          <h2 className="st-section-title">Branches</h2>
          <p className="st-section-sub">Define branches selectable when registering or editing members</p>
        </div>
        <button className="st-add-btn" onClick={() => setShowAdd(true)}>+ Add Branch</button>
      </div>

      {error && <ErrorBanner msg={error} />}

      <div className="st-table-wrap">
        {loading ? (
          <div className="st-state">Loading…</div>
        ) : branches.length === 0 ? (
          <div className="st-state">No branches found. <button className="st-inline-btn" onClick={() => setShowAdd(true)}>Add the first one</button></div>
        ) : (
          <table className="st-table">
            <thead>
              <tr><th>#</th><th>Branch Name</th><th>ID</th><th>Action</th></tr>
            </thead>
            <tbody>
              {branches.map((b, i) => (
                <tr key={b.id}>
                  <td className="st-td-num">{i + 1}</td>
                  <td><span className="st-pill st-pill--type">{b.name}</span></td>
                  <td className="st-td-meta">{b.id}</td>
                  <td>
                    <button className="st-row-btn" onClick={() => setEditBranchItem(b)}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAdd && <AddBranchModal onClose={() => setShowAdd(false)} onSaved={handleSaved} />}
      {editBranchItem && <EditBranchModal branch={editBranchItem} onClose={() => setEditBranchItem(null)} onSaved={handleSaved} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SETTINGS PAGE
// ═══════════════════════════════════════════════════════════════════

const TABS = [
  { key: 'user-types', label: 'User Types' },
  { key: 'member-status', label: 'Member Status' },
  { key: 'branches', label: 'Branches' },
  { key: 'payment-gateway', label: 'Payment Gateway' },
  { key: 'expense-categories', label: 'Expense Categories' },
];

function Settings() {
  const [activeTab, setActiveTab] = useState('user-types');

  return (
    <div className="admin-content st-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Settings</h1>
        <p className="admin-page-subtitle">Manage user types, member statuses and payment gateway configuration</p>
      </div>

      <div className="st-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`st-tab-btn${activeTab === t.key ? ' st-tab-btn--active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'user-types' && <UserTypesTab />}
      {activeTab === 'member-status' && <MemberStatusTab />}
      {activeTab === 'branches' && <BranchesTab />}
      {activeTab === 'payment-gateway' && <PaymentGatewayTab />}
      {activeTab === 'expense-categories' && <ExpenseCategoriesTab />}
    </div>
  );
}

export default Settings;
