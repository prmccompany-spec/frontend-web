import { useState, useEffect, useCallback } from 'react';
import { getRentalProducts, createRentalProduct, updateRentalProduct, deleteRentalProduct } from '../../../services/rentalService';
import './RentalProducts.css';

const emptyForm = { name: '', description: '', day_rate: '', month_rate: '', year_rate: '' };

function ProductModal({ product, onClose, onSaved }) {
  const isEdit = !!product;
  const [form, setForm] = useState(
    product
      ? {
          name: product.name,
          description: product.description ?? '',
          day_rate: product.day_rate ?? '',
          month_rate: product.month_rate ?? '',
          year_rate: product.year_rate ?? '',
        }
      : emptyForm
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) return setError('Product name is required.');
    if (!form.day_rate || Number(form.day_rate) <= 0) {
      return setError('Day rate is required — it is the minimum charge for any rental of this product.');
    }

    const payload = {
      name: form.name.trim(),
      description: form.description || null,
      day_rate: Number(form.day_rate),
      month_rate: form.month_rate ? Number(form.month_rate) : null,
      year_rate: form.year_rate ? Number(form.year_rate) : null,
    };

    setSaving(true);
    try {
      if (isEdit) {
        await updateRentalProduct(product.id, payload);
      } else {
        await createRentalProduct(payload);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to save rental product.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rp-overlay" onClick={onClose}>
      <div className="rp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="rp-modal-header">
          <h2 className="rp-modal-title">{isEdit ? 'Edit Rental Product' : 'New Rental Product'}</h2>
          <button className="rp-modal-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="rp-modal-body">
            {error && <div className="rp-modal-error">{error}</div>}

            <div className="rp-field">
              <label className="rp-label">Product Name *</label>
              <input
                className="rp-input"
                placeholder="e.g. Plastic Chair"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div className="rp-field">
              <label className="rp-label">Description</label>
              <textarea
                className="rp-input rp-textarea"
                placeholder="Optional notes about this item"
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div className="rp-row">
              <div className="rp-field">
                <label className="rp-label">Day Rate (₹) *</label>
                <input
                  type="number"
                  className="rp-input"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.day_rate}
                  onChange={(e) => setForm((f) => ({ ...f, day_rate: e.target.value }))}
                />
                <p className="rp-hint">Minimum charge for any rental of this product.</p>
              </div>
              <div className="rp-field">
                <label className="rp-label">Month Rate (₹)</label>
                <input
                  type="number"
                  className="rp-input"
                  min="0"
                  step="0.01"
                  placeholder="Optional"
                  value={form.month_rate}
                  onChange={(e) => setForm((f) => ({ ...f, month_rate: e.target.value }))}
                />
              </div>
              <div className="rp-field">
                <label className="rp-label">Year Rate (₹)</label>
                <input
                  type="number"
                  className="rp-input"
                  min="0"
                  step="0.01"
                  placeholder="Optional"
                  value={form.year_rate}
                  onChange={(e) => setForm((f) => ({ ...f, year_rate: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <div className="rp-modal-footer">
            <button type="button" className="rp-btn rp-btn--ghost" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="rp-btn rp-btn--primary" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeactivateModal({ product, onClose, onConfirmed }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    setLoading(true);
    setError('');
    try {
      await deleteRentalProduct(product.id);
      onConfirmed();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to deactivate product.');
      setLoading(false);
    }
  };

  return (
    <div className="rp-overlay" onClick={onClose}>
      <div className="rp-modal rp-modal--sm" onClick={(e) => e.stopPropagation()}>
        <div className="rp-modal-header">
          <h2 className="rp-modal-title">Deactivate Product</h2>
          <button className="rp-modal-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="rp-modal-body">
          {error && <div className="rp-modal-error">{error}</div>}
          <p className="rp-delete-msg">
            Are you sure you want to deactivate <strong>{product.name}</strong>? It will no longer
            be available to select for new rentals. Existing rental records are not affected.
          </p>
        </div>
        <div className="rp-modal-footer">
          <button className="rp-btn rp-btn--ghost" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="rp-btn rp-btn--danger" onClick={handleConfirm} disabled={loading}>
            {loading ? 'Deactivating…' : 'Deactivate'}
          </button>
        </div>
      </div>
    </div>
  );
}

const fmt = (val) => (val === null || val === undefined ? '—' : `₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

function RentalProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editTarget, setEditTarget] = useState(null);
  const [creating, setCreating] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setProducts(await getRentalProducts());
    } catch {
      setError('Failed to load rental products. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="admin-content rp-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Rental Products</h1>
          <p className="admin-page-subtitle">Manage items available for rental, with day / month / year rates</p>
        </div>
        <button className="rp-add-btn" onClick={() => setCreating(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Product
        </button>
      </div>

      {error && <div className="rp-alert">{error}</div>}

      {loading ? (
        <div className="rp-state">Loading…</div>
      ) : products.length === 0 ? (
        <div className="rp-state">
          No rental products yet. <button className="rp-inline-btn" onClick={() => setCreating(true)}>Add the first one</button>
        </div>
      ) : (
        <div className="rp-table-wrap">
          <table className="rp-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Day</th>
                <th>Month</th>
                <th>Year</th>
                <th>Status</th>
                <th className="rp-th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="rp-td-name">{p.name}</div>
                    {p.description && <div className="rp-td-desc">{p.description}</div>}
                  </td>
                  <td>{fmt(p.day_rate)}</td>
                  <td>{fmt(p.month_rate)}</td>
                  <td>{fmt(p.year_rate)}</td>
                  <td>
                    <span className={`rp-status ${p.is_active ? 'rp-status--active' : 'rp-status--inactive'}`}>
                      {p.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="rp-td-actions">
                    <button className="rp-row-btn" onClick={() => setEditTarget(p)}>Edit</button>
                    {p.is_active === 1 && (
                      <button className="rp-row-btn rp-row-btn--danger" onClick={() => setDeactivateTarget(p)}>Deactivate</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creating && (
        <ProductModal onClose={() => setCreating(false)} onSaved={() => { setCreating(false); load(); }} />
      )}
      {editTarget && (
        <ProductModal product={editTarget} onClose={() => setEditTarget(null)} onSaved={() => { setEditTarget(null); load(); }} />
      )}
      {deactivateTarget && (
        <DeactivateModal
          product={deactivateTarget}
          onClose={() => setDeactivateTarget(null)}
          onConfirmed={() => { setDeactivateTarget(null); load(); }}
        />
      )}
    </div>
  );
}

export default RentalProducts;
