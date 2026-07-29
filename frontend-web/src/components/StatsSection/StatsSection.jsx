import { useState, useEffect } from 'react';
import { getApprovedReviews } from '../../services/reviewService';
import FeedbackModal from '../FeedbackModal/FeedbackModal';
import './StatsSection.css';

function ReviewStars({ value }) {
  const rounded = Math.round(value);
  return (
    <div className="stats-review-stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < rounded ? 'stats-review-star stats-review-star--filled' : 'stats-review-star'}>&#9733;</span>
      ))}
    </div>
  );
}

function StatsSection() {
  const [reviews, setReviews] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);

  useEffect(() => {
    getApprovedReviews()
      .then((res) => setReviews(res.data?.data ?? []))
      .catch(() => setReviews([]));
  }, []);

  const reviewCount = reviews.length;
  const avgRating = reviewCount > 0
    ? reviews.reduce((s, r) => s + Number(r.rating), 0) / reviewCount
    : 0;
  const featured = reviews[0];

  return (
    <section className="stats-section">
      <div className="stats-inner">

        {/* Left column */}
        <div className="stats-left">
          <div className="stats-blob" />
          <p className="stats-eyebrow">PRMCF's</p>
          <h2 className="stats-heading">
            Our Strength in <span className="stats-heading-accent">Numbers</span>
          </h2>

          <div className="stats-number-block">
            <span className="stats-number">1000 +</span>
            <h3 className="stats-sub">Incredible Souls Strong</h3>
          </div>

          <p className="stats-desc">
            To every member who believed in our vision, who showed up when it mattered,
            who lifted others when they needed it most — this is YOUR community. Your
            passion fuels our purpose. Your commitment creates our strength. Your voice
            shapes our future.
          </p>

          <p className="stats-tagline">
            We don't just count members. We celebrate champions.
          </p>
        </div>

        {/* Right column — live community review summary */}
        <div className="stats-right">
          <div className="stats-impact-card">
            <div className="stats-impact-content">
              {reviewCount > 0 ? (
                <div className="stats-review-summary">
                  <div className="stats-review-score">{avgRating.toFixed(1)}</div>
                  <ReviewStars value={avgRating} />
                  <p className="stats-review-count">
                    Based on {reviewCount} review{reviewCount !== 1 ? 's' : ''} from our community
                  </p>

                  {featured && (
                    <div className="stats-review-quote">
                      <span className="stats-review-quote-mark">&#8220;</span>
                      <p className="stats-review-quote-text">{featured.message}</p>
                      <span className="stats-review-quote-name">— {featured.name}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="stats-review-summary stats-review-summary--empty">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                  <p>No reviews yet — be the first to share your experience with PRMCF.</p>
                </div>
              )}
            </div>
            <div className="stats-impact-footer">
              {justSubmitted ? (
                <p className="stats-impact-thanks">Thanks! Your review will appear here once approved.</p>
              ) : (
                <p className="stats-impact-placeholder">
                  Loved being part of PRMCF? Tell the community about it.
                </p>
              )}
              <button className="stats-impact-btn" onClick={() => setShowForm(true)}>Share Your Experience</button>
            </div>
          </div>
        </div>

      </div>

      {showForm && (
        <FeedbackModal
          onClose={() => setShowForm(false)}
          onSubmitted={() => { setShowForm(false); setJustSubmitted(true); }}
        />
      )}
    </section>
  );
}

export default StatsSection;
