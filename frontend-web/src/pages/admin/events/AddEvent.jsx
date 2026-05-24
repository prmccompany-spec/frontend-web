import { useState, useRef } from 'react';
import { createEvent } from '../../../services/eventService';
import './AddEvent.css';

const initialForm = {
  title: '',
  status: 'upcoming',
  date: '',
  startTime: '',
  endTime: '',
  location: '',
  attendees: '',
  shortDescription: '',
  fullDescription: '',
  organizer: '',
  contactPerson: '',
  phone: '',
  isLive: false,
  videoLink: '',
};

function AddEvent() {
  const [form, setForm] = useState(initialForm);
  const [highlights, setHighlights] = useState(['']);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleImageRemove = () => {
    setImage(null);
    setImagePreview('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleHighlightChange = (index, value) => {
    setHighlights((prev) => prev.map((h, i) => (i === index ? value : h)));
  };

  const addHighlight = () => {
    setHighlights((prev) => [...prev, '']);
  };

  const removeHighlight = (index) => {
    setHighlights((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const fd = new FormData();

      // Scalar fields
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));

      // Highlights as JSON string
      fd.set('highlights', JSON.stringify(highlights.filter((h) => h.trim())));

      // Image file
      if (image) fd.append('image', image);

      await createEvent(fd);

      setSuccess(`Event "${form.title}" created successfully.`);
      setForm(initialForm);
      setHighlights(['']);
      setImage(null);
      setImagePreview('');
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ae-page">

      {/* ── Header ── */}
      <div className="ae-page-header">
        <div className="ae-page-header-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
            <line x1="12" y1="14" x2="12" y2="18" />
            <line x1="10" y1="16" x2="14" y2="16" />
          </svg>
        </div>
        <div>
          <h1 className="ae-page-title">Add Event</h1>
          <p className="ae-page-subtitle">Create a new event for the PRMCF community</p>
        </div>
      </div>

      {error && (
        <div className="ae-alert ae-alert--error">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      {success && (
        <div className="ae-alert ae-alert--success">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="ae-form">

        {/* ── Basic Info ── */}
        <div className="ae-card">
          <div className="ae-section-label">Basic Information</div>

          <div className="ae-field">
            <label className="ae-label">Event Title <span className="ae-required">*</span></label>
            <input
              className="ae-input"
              name="title"
              placeholder="e.g. PRMCF Annual Convention & Felicitation Ceremony"
              value={form.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="ae-grid-2">
            <div className="ae-field">
              <label className="ae-label">Event Status <span className="ae-required">*</span></label>
              <select className="ae-input ae-select" name="status" value={form.status} onChange={handleChange} required>
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="ae-field">
              <label className="ae-label">Expected Attendees</label>
              <input className="ae-input" name="attendees" placeholder="e.g. 800+" value={form.attendees} onChange={handleChange} />
            </div>
          </div>
        </div>

        {/* ── Date & Time ── */}
        <div className="ae-card">
          <div className="ae-section-label">Date &amp; Time</div>

          <div className="ae-grid-3">
            <div className="ae-field">
              <label className="ae-label">Event Date <span className="ae-required">*</span></label>
              <input className="ae-input" name="date" type="date" value={form.date} onChange={handleChange} required />
            </div>
            <div className="ae-field">
              <label className="ae-label">Start Time <span className="ae-required">*</span></label>
              <input className="ae-input" name="startTime" type="time" value={form.startTime} onChange={handleChange} required />
            </div>
            <div className="ae-field">
              <label className="ae-label">End Time <span className="ae-required">*</span></label>
              <input className="ae-input" name="endTime" type="time" value={form.endTime} onChange={handleChange} required />
            </div>
          </div>
        </div>

        {/* ── Location ── */}
        <div className="ae-card">
          <div className="ae-section-label">Location</div>
          <div className="ae-field">
            <label className="ae-label">Venue / Location <span className="ae-required">*</span></label>
            <input
              className="ae-input"
              name="location"
              placeholder="e.g. Community Bhavan, Bengaluru  or  Online - YouTube Live"
              value={form.location}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* ── Event Image ── */}
        <div className="ae-card ae-card--image">
          <div className="ae-section-label">Event Image</div>
          <div className="ae-image-row">
            <div
              className={`ae-image-zone ${imagePreview ? 'ae-image-zone--filled' : ''}`}
              onClick={() => fileRef.current?.click()}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="ae-image-preview" />
              ) : (
                <div className="ae-image-placeholder">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="3" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <span>Click to upload</span>
                  <span className="ae-image-hint">JPG, PNG or WebP · max 5 MB</span>
                </div>
              )}
              {imagePreview && (
                <div className="ae-image-overlay">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Change
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }} onChange={handleImageChange} />
            <div className="ae-image-info">
              <p className="ae-image-name">{image ? image.name : 'No image selected'}</p>
              <p className="ae-image-sub">
                {image ? `${(image.size / 1024).toFixed(0)} KB` : 'Upload a banner or poster image for this event (optional).'}
              </p>
              {imagePreview && (
                <button type="button" className="ae-image-remove" onClick={handleImageRemove}>Remove</button>
              )}
            </div>
          </div>
        </div>

        {/* ── Description ── */}
        <div className="ae-card">
          <div className="ae-section-label">Description</div>
          <div className="ae-field">
            <label className="ae-label">Short Description <span className="ae-required">*</span></label>
            <textarea
              className="ae-input ae-textarea"
              name="shortDescription"
              rows={2}
              placeholder="Brief summary shown on the event card"
              value={form.shortDescription}
              onChange={handleChange}
              required
            />
          </div>
          <div className="ae-field">
            <label className="ae-label">Full Description (About Event)</label>
            <textarea
              className="ae-input ae-textarea"
              name="fullDescription"
              rows={4}
              placeholder="Detailed description shown inside the event modal"
              value={form.fullDescription}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* ── Key Highlights ── */}
        <div className="ae-card">
          <div className="ae-section-label">Key Highlights</div>
          <div className="ae-highlights-list">
            {highlights.map((h, i) => (
              <div key={i} className="ae-highlight-row">
                <span className="ae-highlight-bullet">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <input
                  className="ae-input ae-highlight-input"
                  placeholder={`Highlight ${i + 1}`}
                  value={h}
                  onChange={(e) => handleHighlightChange(i, e.target.value)}
                />
                {highlights.length > 1 && (
                  <button type="button" className="ae-highlight-remove" onClick={() => removeHighlight(i)}
                    aria-label="Remove">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                      strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
          <button type="button" className="ae-add-highlight" onClick={addHighlight}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Highlight
          </button>
        </div>

        {/* ── Contact Information ── */}
        <div className="ae-card">
          <div className="ae-section-label">Contact Information</div>
          <div className="ae-grid-3">
            <div className="ae-field">
              <label className="ae-label">Organizer</label>
              <input className="ae-input" name="organizer" placeholder="e.g. PRMCF Management Committee"
                value={form.organizer} onChange={handleChange} />
            </div>
            <div className="ae-field">
              <label className="ae-label">Contact Person</label>
              <input className="ae-input" name="contactPerson" placeholder="e.g. K.G. Prakash Raja"
                value={form.contactPerson} onChange={handleChange} />
            </div>
            <div className="ae-field">
              <label className="ae-label">Phone Number</label>
              <input className="ae-input" name="phone" type="tel" placeholder="+91-XXXXXXXXXX"
                value={form.phone} onChange={handleChange} />
            </div>
          </div>
        </div>

        {/* ── Live Event ── */}
        <div className={`ae-card ae-card--live ${form.isLive ? 'ae-card--live-active' : ''}`}>
          <div className="ae-section-label">Live Event</div>

          <label className="ae-toggle-row">
            <div className="ae-toggle-text">
              <span className="ae-toggle-title">Mark as Live Event</span>
              <span className="ae-toggle-sub">
                When enabled, a live banner will appear on the Events page and users can watch the stream.
              </span>
            </div>
            <div className={`ae-toggle ${form.isLive ? 'ae-toggle--on' : ''}`}
              onClick={() => setForm((p) => ({ ...p, isLive: !p.isLive }))}>
              <div className="ae-toggle-knob" />
            </div>
          </label>

          {form.isLive && (
            <div className="ae-field ae-live-link-field">
              <label className="ae-label">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14, marginRight: 5 }}>
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.96-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
                  <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="currentColor" />
                </svg>
                Video / Stream Link <span className="ae-required">*</span>
              </label>
              <input
                className="ae-input"
                name="videoLink"
                type="url"
                placeholder="https://www.youtube.com/live/..."
                value={form.videoLink}
                onChange={handleChange}
                required={form.isLive}
              />
              <p className="ae-live-hint">Paste a YouTube Live, Zoom, or any streaming URL.</p>
            </div>
          )}
        </div>

        {/* ── Actions ── */}
        <div className="ae-actions">
          <button type="button" className="ae-btn ae-btn--secondary"
            onClick={() => { setForm(initialForm); setHighlights(['']); handleImageRemove(); }}>
            Clear Form
          </button>
          <button type="submit" className="ae-btn ae-btn--primary" disabled={loading}>
            {loading
              ? <><span className="ae-spinner" /> Saving...</>
              : <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Save Event
                </>}
          </button>
        </div>

      </form>
    </div>
  );
}

export default AddEvent;
