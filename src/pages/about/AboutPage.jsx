import { useState } from 'react';
import logo from '../../assets/logo.png';
import festivalImg from '../../assets/slide1.jpg';
import './AboutPage.css';

const ACCORDION_ITEMS = [
  {
    id: 'history',
    title: 'History',
    icon: '🏛️',
    content: null,
    points: [
      "The roots of the Common Fund date back to the early 20th century, when visionary leaders from Palayapalayam and Rajapalayam realized the need for a shared financial system to support families during important milestones.",
      "Starting with small pooled contributions, the Fund evolved into a trusted institution, focusing on education support, marriage assistance, healthcare aid, and community welfare.",
    ],
  },
  {
    id: 'evolution',
    title: 'Evolution',
    icon: '🌱',
    content: "Over the decades, PRMCF expanded its services and formalized operations:",
    points: [
      "1970s–1980s: Formation of committees, introduction of accounting systems, regular audits, and transparent operations.",
      "1990s–2000s: Legal registration, banking partnerships, digital record-keeping, and launch of scholarships and healthcare initiatives.",
      "Present: Community outreach beyond Tamil Nadu, entrepreneurship support, youth programs, and social welfare drives.",
    ],
  },
  {
    id: 'vision',
    title: 'Vision',
    icon: '🔭',
    content: "To build a sustainable, inclusive, and empowering community that honors our rich traditions while creating new opportunities for future generations.",
    points: [],
  },
  {
    id: 'mission',
    title: 'Mission',
    icon: '🎯',
    content: null,
    points: [
      "Empower individuals through education, scholarships, and skill-building programs.",
      "Strengthen community bonding through cultural, social, and spiritual initiatives.",
      "Provide timely financial support for key life events and emergencies.",
      "Promote social welfare and uplift underprivileged members.",
      "Uphold transparency, trust, and fairness in all our actions.",
    ],
  },
];

const COMMITTEE_MEMBERS = [
  { name: 'Name', position: 'President' },
  { name: 'Name', position: 'Vice President' },
  { name: 'Name', position: 'Secretary' },
  { name: 'Name', position: 'Treasurer' },
  { name: 'Name', position: 'Member' },
  { name: 'Name', position: 'Member' },
  { name: 'Name', position: 'Member' },
  { name: 'Name', position: 'Member' },
  { name: 'Name', position: 'Member' },
  { name: 'Name', position: 'Member' },
  { name: 'Name', position: 'Member' },
];

function AboutPage() {
  const [openId, setOpenId] = useState('history');

  const toggle = (id) => setOpenId((prev) => (prev === id ? null : id));

  return (
    <div className="ab-page">

      {/* ── Hero ─────────────────────────────────────── */}
      <section className="ab-hero">
        {/* Background decorative circles */}
        <div className="ab-hero-circle ab-hero-circle-1" />
        <div className="ab-hero-circle ab-hero-circle-2" />

        <div className="ab-hero-inner">
          {/* Left: logo + text */}
          <div className="ab-hero-left">
            <div className="ab-hero-logo-ring">
              <img src={logo} alt="PRMCF" className="ab-hero-logo" />
            </div>
            <div className="ab-hero-text">
              <span className="ab-hero-eyebrow">Est. 2000 · Community Fund</span>
              <h1 className="ab-hero-title">
                About <span className="ab-red">PRMCF</span>
              </h1>
              <p className="ab-hero-desc">
                Palayapalayam Rajapalayam Raju's Common Fund — uniting families,
                preserving traditions, and building a stronger community together.
              </p>
              <div className="ab-hero-badges">
                <span className="ab-badge">🤝 Community</span>
                <span className="ab-badge">🌿 Heritage</span>
                <span className="ab-badge">❤️ Welfare</span>
              </div>
            </div>
          </div>

          {/* Right: coral card */}
          <div className="ab-hero-card">
            <div className="ab-hero-card-blob" />
            <p className="ab-hero-card-quote">
              &ldquo;Your passion fuels our purpose. Your commitment creates our strength.&rdquo;
            </p>
            <div className="ab-hero-card-divider" />
            <p className="ab-hero-card-name">Palayapalayam Rajapalayam Raju's<br/>Common Fund</p>
          </div>
        </div>
      </section>


      {/* ── About content ────────────────────────────── */}
      <section className="ab-about">
        <div className="ab-about-inner">

          {/* Left — image with overlay tag */}
          <div className="ab-about-img-wrap">
            <img src={festivalImg} alt="Community festival" className="ab-about-img" />
            <div className="ab-about-img-tag">
              <span>🎉</span>
              <span>Annual Community Celebration</span>
            </div>
          </div>

          {/* Right — text + accordion */}
          <div className="ab-about-content">
            <div className="ab-about-title-block">
              <span className="ab-section-eyebrow">Who We Are</span>
              <h2 className="ab-about-heading">About <span className="ab-red">PRMCF</span></h2>
              <p className="ab-about-fullname">Palayapalayam Rajapalayam Raju's Common Fund</p>
            </div>
            <p className="ab-about-desc">
              At Palayapalayam Rajapalayam Raju's Common Fund (PRMCF), we believe in the power of
              community, tradition, and collective growth. Our Fund serves as a financial and social
              backbone for our members, offering support across major life events and fostering unity
              among families of Palayapalayam and Rajapalayam origins. With trust and transparency at
              our core, we continue to work towards strengthening our community for today's generation
              and the many generations to come.
            </p>

            <div className="ab-accordion">
              {ACCORDION_ITEMS.map((item) => {
                const isOpen = openId === item.id;
                return (
                  <div key={item.id} className={`ab-accordion-item${isOpen ? ' ab-open' : ''}`}>
                    <button
                      className="ab-accordion-header"
                      onClick={() => toggle(item.id)}
                      aria-expanded={isOpen}
                    >
                      <span className="ab-accordion-icon">{item.icon}</span>
                      <span className="ab-accordion-title">Our <strong>{item.title}</strong></span>
                      <span className={`ab-accordion-chevron${isOpen ? ' ab-chevron-open' : ''}`}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </span>
                    </button>
                    <div className="ab-accordion-body" style={{ maxHeight: isOpen ? '500px' : '0' }}>
                      {item.content && <p className="ab-accordion-text">{item.content}</p>}
                      {item.points && item.points.length > 0 && (
                        <ul className="ab-accordion-list">
                          {item.points.map((pt, i) => (
                            <li key={i} className="ab-accordion-list-item">{pt}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </section>

      {/* ── Committee Members ─────────────────────────── */}
      <section className="ab-committee">
        <div className="ab-committee-inner">
          <div className="ab-committee-header">
            <span className="ab-section-eyebrow">Leadership</span>
            <h2 className="ab-committee-heading">
              Committee <span className="ab-red">Members</span>
            </h2>
            <p className="ab-committee-sub">Current Management Committee (2024–2027)</p>
          </div>

          <div className="ab-members-grid">
            {COMMITTEE_MEMBERS.map((member, i) => (
              <div className="ab-member-card" key={i}>
                <div className="ab-member-avatar-wrap">
                  <div className="ab-member-avatar">
                    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="80" height="80" fill="#f5f5f5" />
                      <circle cx="40" cy="28" r="16" fill="#ddd" />
                      <ellipse cx="40" cy="72" rx="26" ry="18" fill="#ddd" />
                    </svg>
                  </div>
                  {i === 0 && <span className="ab-member-badge">President</span>}
                </div>
                <p className="ab-member-name">{member.name}</p>
                <p className="ab-member-position">{member.position}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Scroll-to-top fab ─────────────────────────── */}
      <button className="ab-fab" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Back to top">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>

    </div>
  );
}

export default AboutPage;
