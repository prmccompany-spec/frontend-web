import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getServiceDetail, createService, updateService, uploadServiceForm } from '../../services/serviceService';
import './ServiceForm.css';

function ServiceForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', description: '' });
  const [existingFormName, setExistingFormName] = useState('');
  const [formFile, setFormFile] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    getServiceDetail(id)
      .then((service) => {
        setForm({ name: service.name, description: service.description ?? '' });
        setExistingFormName(service.offline_form_name ?? '');
      })
      .catch(() => setError('Failed to load service.'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setError('The offline form must be a PDF file.');
      return;
    }
    setError('');
    setFormFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) return setError('Service name is required.');
    if (!isEdit && !formFile) return setError('Upload the offline PDF form for this service.');

    setSaving(true);
    try {
      let serviceId = id;
      if (isEdit) {
        await updateService(id, form);
      } else {
        const res = await createService(form);
        serviceId = res.id;
      }

      if (formFile) {
        const fd = new FormData();
        fd.append('form', formFile);
        await uploadServiceForm(serviceId, fd);
      }

      navigate(isEdit ? '/admin/services' : `/admin/services/${serviceId}/configure`);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to save service.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="admin-content"><div className="sf-state">Loading…</div></div>;
  }

  return (
    <div className="admin-content sf-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">{isEdit ? 'Edit Service' : 'New Service'}</h1>
        <p className="admin-page-subtitle">
          {isEdit ? 'Update the service details or replace the offline form' : 'Create a service, then configure its required documents and workflow'}
        </p>
      </div>

      <div className="sf-card">
        {error && <div className="sf-error">{error}</div>}

        <form className="sf-form" onSubmit={handleSubmit}>
          <div className="sf-field">
            <label className="sf-label">Service Name <span className="sf-required">*</span></label>
            <input
              className="sf-input"
              placeholder="e.g. Marriage Certificate"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>

          <div className="sf-field">
            <label className="sf-label">Description</label>
            <textarea
              className="sf-input sf-textarea"
              placeholder="Brief description shown to members"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>

          <div className="sf-field">
            <label className="sf-label">
              Offline PDF Form {!isEdit && <span className="sf-required">*</span>}
            </label>
            <div className="sf-dropzone" onClick={() => document.getElementById('sf-file-input').click()}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span>
                {formFile ? formFile.name : existingFormName ? `Current: ${existingFormName} (click to replace)` : 'Click to upload PDF form template'}
              </span>
            </div>
            <input
              id="sf-file-input"
              type="file"
              accept="application/pdf"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>

          <div className="sf-actions">
            <button type="button" className="sf-btn sf-btn--ghost" onClick={() => navigate('/admin/services')} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="sf-btn sf-btn--primary" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create & Configure'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ServiceForm;
