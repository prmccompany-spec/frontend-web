import './TestimonialsSection.css';

const testimonials = [
  {
    id: 1,
    text: 'Being part of PRMCF has been an incredible journey. The energy, the teamwork, and the passion everyone brings to every event is truly inspiring. It has shaped me into a better organizer and leader.',
    name: 'Vignesh Rajavel',
    position: 'Committee Member',
    avatar: null,
    stars: 5,
  },
  {
    id: 2,
    text: 'PRMCF gave me a platform to showcase my skills and grow beyond my comfort zone. Every event we organize brings the community closer together, and I am proud to be a part of this amazing team.',
    name: 'Gowtham',
    position: 'Committee Member',
    avatar: null,
    stars: 5,
  },
  {
    id: 3,
    text: 'The experience of working with PRMCF has been outstanding. From planning to execution, our committee ensures everything runs smoothly. It is a privilege to contribute to such a meaningful initiative.',
    name: 'Sivakumar',
    position: 'Committee Member',
    avatar: null,
    stars: 5,
  },
];

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
  return (
    <section className="testimonials-section">
      {/* Decorative bg */}
      <div className="testimonials-bg-accent" />

      <div className="testimonials-inner">

        <div className="testimonials-heading-wrap">
          <h2 className="testimonials-heading">What People Think of</h2>
          <h2 className="testimonials-heading testimonials-heading-accent">PRMCF</h2>
        </div>

        <div className="testimonials-cards">
          {testimonials.map((t) => (
            <div className="testimonial-card" key={t.id}>
              {/* Large decorative quote mark */}
              <span className="testimonial-quote-mark">&#8220;</span>

              <StarRating count={t.stars} />

              <p className="testimonial-text">{t.text}</p>

              <div className="testimonial-divider" />

              <div className="testimonial-author">
                <div className="testimonial-avatar">
                  {t.avatar ? (
                    <img src={t.avatar} alt={t.name} />
                  ) : (
                    <div className="testimonial-avatar-placeholder">
                      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="20" cy="15" r="8" fill="rgba(255,255,255,0.5)"/>
                        <ellipse cx="20" cy="34" rx="13" ry="8" fill="rgba(255,255,255,0.5)"/>
                      </svg>
                    </div>
                  )}
                </div>
                <div className="testimonial-meta">
                  <span className="testimonial-name">{t.name}</span>
                  <span className="testimonial-position">{t.position}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

export default TestimonialsSection;