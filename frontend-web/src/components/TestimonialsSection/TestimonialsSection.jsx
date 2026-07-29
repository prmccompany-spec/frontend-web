import { useState, useEffect, useMemo } from 'react';
import { getApprovedReviews } from '../../services/reviewService';
import FeedbackModal from '../FeedbackModal/FeedbackModal';
import './TestimonialsSection.css';

// Curated fallback so the section is never empty before real reviews come
// in — as soon as any approved review exists, these are replaced entirely
// by live ones from the moderation queue.
const FALLBACK_TESTIMONIALS = [
  {
    id: 'fallback-1',
    message: 'Being part of PRMCF has been an incredible journey. The energy, the teamwork, and the passion everyone brings to every event is truly inspiring. It has shaped me into a better organizer and leader.',
    name: 'Vignesh Rajavel',
    rating: 5,
  },
  {
    id: 'fallback-2',
    message: 'PRMCF gave me a platform to showcase my skills and grow beyond my comfort zone. Every event we organize brings the community closer together, and I am proud to be a part of this amazing team.',
    name: 'Gowtham',
    rating: 5,
  },
  {
    id: 'fallback-3',
    message: 'The experience of working with PRMCF has been outstanding. From planning to execution, our committee ensures everything runs smoothly. It is a privilege to contribute to such a meaningful initiative.',
    name: 'Sivakumar',
    rating: 5,
  },
];

const CARDS_PER_PAGE = 3;

function StarRating({ count }) {
  return (
    <div className="testimonial-stars">
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className="testimonial-star">&#9733;</span>
      ))}
    </div>
  );
}

function TestimonialsSection() {
  const [reviews, setReviews] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [page, setPage] = useState(0);

  useEffect(() => {
    getApprovedReviews()
      .then((res) => setReviews(res.data?.data ?? []))
      .catch(() => setReviews([]));
  }, []);

  const handleSubmitted = () => {
    setShowForm(false);
    setJustSubmitted(true);
  };

  const displayed = reviews.length > 0
    ? reviews.map((r) => ({ id: r.id, message: r.message, name: r.name, rating: r.rating }))
    : FALLBACK_TESTIMONIALS;

  const pageCount = Math.ceil(displayed.length / CARDS_PER_PAGE);

  // Clamp back into range whenever the underlying list changes size (e.g.
  // once the live reviews finish loading and replace the fallback list).
  const safePage = page >= pageCount ? 0 : page;

  const visible = useMemo(
    () => displayed.slice(safePage * CARDS_PER_PAGE, safePage * CARDS_PER_PAGE + CARDS_PER_PAGE),
    [displayed, safePage]
  );

  const goPrev = () => setPage((p) => (p - 1 + pageCount) % pageCount);
  const goNext = () => setPage((p) => (p + 1) % pageCount);

  return (
    <section className="testimonials-section">
      {/* Decorative bg */}
      <div className="testimonials-bg-accent" />

      <div className="testimonials-inner">

        <div className="testimonials-heading-row">
          <div className="testimonials-heading-wrap">
            <h2 className="testimonials-heading">What People Think of</h2>
            <h2 className="testimonials-heading testimonials-heading-accent">PRMCF</h2>
          </div>
          <button className="testimonials-cta-btn" onClick={() => setShowForm(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
            Share Your Experience
          </button>
        </div>

        {justSubmitted && (
          <div className="testimonials-thanks">
            Thank you! Your review has been submitted and will appear here once approved by our team.
          </div>
        )}

        <div className="testimonials-carousel">
          {pageCount > 1 && (
            <button className="testimonials-arrow testimonials-arrow--left" onClick={goPrev} aria-label="Previous testimonials">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}

          <div className="testimonials-cards">
            {visible.map((t) => (
              <div className="testimonial-card" key={t.id}>
                {/* Large decorative quote mark */}
                <span className="testimonial-quote-mark">&#8220;</span>

                <StarRating count={t.rating} />

                <p className="testimonial-text">{t.message}</p>

                <div className="testimonial-divider" />

                <div className="testimonial-author">
                  <div className="testimonial-avatar">
                    <div className="testimonial-avatar-placeholder">
                      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="20" cy="15" r="8" fill="rgba(255,255,255,0.5)"/>
                        <ellipse cx="20" cy="34" rx="13" ry="8" fill="rgba(255,255,255,0.5)"/>
                      </svg>
                    </div>
                  </div>
                  <div className="testimonial-meta">
                    <span className="testimonial-name">{t.name}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {pageCount > 1 && (
            <button className="testimonials-arrow testimonials-arrow--right" onClick={goNext} aria-label="Next testimonials">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}
        </div>

        {pageCount > 1 && (
          <div className="testimonials-dots">
            {Array.from({ length: pageCount }).map((_, i) => (
              <button
                key={i}
                className={`testimonials-dot${i === safePage ? ' testimonials-dot--active' : ''}`}
                onClick={() => setPage(i)}
                aria-label={`Go to page ${i + 1}`}
              />
            ))}
          </div>
        )}

      </div>

      {showForm && (
        <FeedbackModal onClose={() => setShowForm(false)} onSubmitted={handleSubmitted} />
      )}
    </section>
  );
}

export default TestimonialsSection;
