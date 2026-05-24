import './EventDetailsModal.css';

const BACKEND_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api').replace(/\/api$/, '');

const formatDate = (raw) => {
  if (!raw) return '';
  try {
    return new Date(raw).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return raw; }
};

const formatTime = (raw) => {
  if (!raw) return '';
  const [h, m] = raw.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return raw;
  const period = h >= 12 ? 'pm' : 'am';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
};

const resolveImage = (src) => {
  if (!src) return null;
  if (src.startsWith('http')) return src;
  return `${BACKEND_BASE}/${src}`;
};

function EventDetailsModal({ event, onClose }) {
  if (!event) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="ev-modal-overlay" onClick={handleOverlayClick}>
      <div className="ev-modal" onClick={(e) => e.stopPropagation()}>
        <button className="ev-modal-close" onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="ev-modal-image">
          {resolveImage(event.image) && (
            <img src={resolveImage(event.image)} alt={event.title} />
          )}
        </div>

        <div className="ev-modal-content">
          <h2 className="ev-modal-title">{event.title}</h2>

          <div className="ev-modal-meta-group">
            <div className="ev-modal-meta-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <div>
                <div className="ev-modal-meta-label">Date</div>
                <div className="ev-modal-meta-value">{formatDate(event.date)}</div>
              </div>
            </div>

            <div className="ev-modal-meta-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="1" />
                <path d="M12 1v6m0 6v6" />
                <path d="M4.22 4.22l4.24 4.24m5.08 5.08l4.24 4.24" />
              </svg>
              <div>
                <div className="ev-modal-meta-label">Time</div>
                <div className="ev-modal-meta-value">
                  {formatTime(event.startTime)}{event.endTime ? ` – ${formatTime(event.endTime)}` : ''}
                </div>
              </div>
            </div>

            <div className="ev-modal-meta-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <div>
                <div className="ev-modal-meta-label">Location</div>
                <div className="ev-modal-meta-value">{event.location}</div>
              </div>
            </div>

            <div className="ev-modal-meta-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <div>
                <div className="ev-modal-meta-label">Attendees</div>
                <div className="ev-modal-meta-value">{event.attendees}</div>
              </div>
            </div>
          </div>

          <div className="ev-modal-description">
            <h3 className="ev-modal-section-title">About Event</h3>
            <p>{event.fullDescription}</p>
          </div>

          {event.keyHighlights && event.keyHighlights.length > 0 && (
            <div className="ev-modal-highlights">
              <h3 className="ev-modal-section-title">Key Highlights</h3>
              <ul className="ev-modal-list">
                {event.keyHighlights.map((highlight, i) => (
                  <li key={i}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="ev-modal-contact">
            <h3 className="ev-modal-section-title">Contact Information</h3>
            <div className="ev-modal-contact-grid">
              <div className="ev-modal-contact-item">
                <span className="ev-modal-contact-label">Organizer</span>
                <span className="ev-modal-contact-value">{event.organizer}</span>
              </div>
              <div className="ev-modal-contact-item">
                <span className="ev-modal-contact-label">Contact Person</span>
                <span className="ev-modal-contact-value">{event.contactPerson}</span>
              </div>
              <div className="ev-modal-contact-item">
                <span className="ev-modal-contact-label">Phone Number</span>
                <span className="ev-modal-contact-value">
                  <a href={`tel:${event.phone}`}>{event.phone}</a>
                </span>
              </div>
            </div>
          </div>

          <div className="ev-modal-actions">
            <button className="ev-modal-btn ev-modal-btn-secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventDetailsModal;
