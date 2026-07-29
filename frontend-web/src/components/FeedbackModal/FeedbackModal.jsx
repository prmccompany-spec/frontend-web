import { useState } from 'react';
import { submitReview } from '../../services/reviewService';
import './FeedbackModal.css';

// Reviews render as compact testimonial cards on the home page — long
// values there would overflow/blow out the card layout, so the limits are
// tuned for a short blurb, not a full essay. Kept in sync with the
// server-side check in backend/src/services/reviewService.js.
const NAME_MAX_LENGTH = 60;
const MESSAGE_MAX_LENGTH = 300;

// Interactive 1-5 star picker used inside the feedback form.
function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="feedback-star-picker">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          type="button"
          key={n}
          className="feedback-star-btn"
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
          aria-label={`${n} star${n !== 1 ? 's' : ''}`}
        >
          <span className={(hovered || value) >= n ? 'feedback-star feedback-star--filled' : 'feedback-star'}>&#9733;</span>
        </button>
      ))}
    </div>
  );
}

// "Share Your Experience" modal — reused by both the Testimonials section
// and the Stats section, so both entry points submit through the exact
// same validated flow into the admin moderation queue.
function FeedbackModal({ onClose, onSubmitted }) {
  const [name, setName] = useState('');
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) return setError('Please enter your name.');
    if (rating < 1) return setError('Please pick a star rating.');
    if (!message.trim()) return setError('Please share a few words about your experience.');

    setSubmitting(true);
    try {
      await submitReview({ name: name.trim(), rating, message: message.trim() });
      onSubmitted();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit your feedback. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="feedback-overlay" onClick={onClose}>
      <div className="feedback-modal" onClick={(e) => e.stopPropagation()}>
        <button className="feedback-close" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <h3 className="feedback-title">Share Your Experience</h3>
        <p className="feedback-subtitle">Tell us what you think of PRMCF — your review will appear here once approved.</p>

        <form onSubmit={handleSubmit}>
          {error && <div className="feedback-error">{error}</div>}

          <div className="feedback-field">
            <div className="feedback-label-row">
              <label className="feedback-label">Your Name</label>
              <span className="feedback-char-count">{name.length}/{NAME_MAX_LENGTH}</span>
            </div>
            <input
              className="feedback-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ramesh Kumar"
              maxLength={NAME_MAX_LENGTH}
            />
          </div>

          <div className="feedback-field">
            <label className="feedback-label">Your Rating</label>
            <StarPicker value={rating} onChange={setRating} />
          </div>

          <div className="feedback-field">
            <div className="feedback-label-row">
              <label className="feedback-label">Your Review</label>
              <span className="feedback-char-count">{message.length}/{MESSAGE_MAX_LENGTH}</span>
            </div>
            <textarea
              className="feedback-input feedback-textarea"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us about your experience…"
              rows={4}
              maxLength={MESSAGE_MAX_LENGTH}
            />
          </div>

          <button type="submit" className="feedback-submit-btn" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit Review'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default FeedbackModal;
