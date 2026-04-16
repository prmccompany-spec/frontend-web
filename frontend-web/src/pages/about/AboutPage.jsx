import { useState } from 'react';
import logo from '../../assets/logo.png';
import festivalImg from '../../assets/slide1.jpg';
import prakashRaja from '../../assets/profile/K.G. Prakash Raja.jpeg';
import ramakrishnaRaja from '../../assets/profile/N.S. Ramakrishna Raja.jpeg';
import balamuruganRaja from '../../assets/profile/A.R. Balamurugan Raja.jpeg';
import venketshRaja from '../../assets/profile/K.K. Venketsha Raja.jpeg';
import dhanushkodiRaja from '../../assets/profile/S.R. Dhanushkodi Raja.jpeg';
import jeganathaRaja from '../../assets/profile/A.S. Jeganatha Raja.jpeg';
import murugaRaja from '../../assets/profile/K.P. Muruga Raja.jpeg';
import './AboutPage.css';

const getProfileImage = (name) => {
  const images = {
    'K.G. Prakash Raja': prakashRaja,
    'N.S. Ramakrishna Raja': ramakrishnaRaja,
    'A.R. Balamurugan Raja': balamuruganRaja,
    'K.K. Venketsha Raja': venketshRaja,
    'S.R. Dhanushkodi Raja': dhanushkodiRaja,
    'A.S. Jeganatha Raja': jeganathaRaja,
    'K.P. Muruga Raja': murugaRaja,
  };
  return images[name];
};

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
  { name: 'K.G. Prakash Raja', position: 'President', isPic: true },
  { name: 'N.S. Ramakrishna Raja', position: 'Vice President', isPic: true },
  { name: 'A.R. Balamurugan Raja', position: 'Secretary', isPic: true },
  { name: 'K.K. Venketsha Raja', position: 'Treasurer', isPic: true },
  { name: 'S.R. Dhanushkodi Raja', position: 'Management', isPic: true },
  { name: 'A.S. Jeganatha Raja', position: 'Management', isPic: true },
  { name: 'K.P. Muruga Raja', position: 'Management', isPic: true },
  { name: 'P.V. Ramesh Raja', position: 'Member' },
  { name: 'T.B. Kumarasamy Raja', position: 'Member' },
  { name: 'S.A. Muruganantha Raja', position: 'Member' },
  { name: 'N.K. Rajendra Raja', position: 'Member' },
  { name: 'P.R. Vignesh', position: 'Member' },
  { name: 'P.R. Samraj', position: 'Member' },
  { name: 'P.S. Arjun Raja', position: 'Member' },
  { name: 'K.R. Karthick Ayyappan', position: 'Member' },
  { name: 'P.S. Ramakrishnan', position: 'Member' },
  { name: 'M.A. Venkeda Perumal Raja', position: 'Member' },
  { name: 'V.M. Kannan Raja', position: 'Member' },
  { name: 'K.D. Jeyagurudeva Raja', position: 'Member' },
  { name: 'P.D. Radhakrishnan Raja - Murali', position: 'Member' },
  { name: 'S.S. Vignesh (King)', position: 'Member' },
  { name: 'P.G. Venkadesha Raja (Meesai)', position: 'Member' },
  { name: 'N.R. Ramshankar Raja (Manoj)', position: 'Member' },
  { name: 'P.L. Murugan Raja', position: 'Member' },
  { name: 'N.R. Gopikrishnan (Tharasu)', position: 'Member' },
  { name: 'A.R. Parthiban @ Madhan', position: 'Member' },
  { name: 'K.V. Harishankar (A.V.M. Siva)', position: 'Member' },
  { name: 'K.K. Murugantha Raja', position: 'Member' },
  { name: 'N.R. Dharmalinga Raja', position: 'Member' },
  { name: 'K.M. Kasi Subramaniya Raja', position: 'Member' },
  { name: 'K.A. Ravikumar Raja', position: 'Member' },
  { name: 'T.V. Ramasubramaniya Raja', position: 'Member' },
  { name: 'K.R. Shankara Subramaniya Raja', position: 'Member' },
  { name: 'P.A. Sivakumar Raja', position: 'Member' },
  { name: 'S.S. Subramaniya Raja (Peesari)', position: 'Member' },
  { name: 'M.R. Vasudeva Raja', position: 'Member' },
  { name: 'V.N. Ramamoorthy Raja', position: 'Member' },
  { name: 'P.K. Dharmakrishna Raja', position: 'Member' },
  { name: 'M.K. Thiyaga Raja', position: 'Member' },
  { name: 'P.P. Venkedesha Raja', position: 'Member' },
  { name: 'K.R. Dharmakrishna Raja', position: 'Member' },
  { name: 'M.A. Srirengaraja', position: 'Member' },
  { name: 'S.N. Ramakrishna Raja', position: 'Member' },
  { name: 'S.A. Ramasubramaniya Raja (Kallathu)', position: 'Member' },
  { name: 'V.B. Jenarthana Raja', position: 'Member' },
  { name: 'P.G. Venkadesha Raja (Pulu)', position: 'Member' },
  { name: 'K.B. Thulasirama Raja', position: 'Member' },
  { name: 'S.S. Subramaniya Raja - Giri Texs', position: 'Member' },
  { name: 'K.C. Venkedeshan Raja', position: 'Member' },
  { name: 'K.D. Sundhar (Koli Pannai)', position: 'Member' },
  { name: 'P.A. Arvinth Kumar', position: 'Member' },
  { name: 'K.R. Dinesh (CCTV)', position: 'Member' },
  { name: 'N.S. Sathishkumar Raja', position: 'Member' },
  { name: 'K.P. Ganesha Raja', position: 'Member' },
  { name: 'P.P. Ramakrishna Raja (Padaiyappa)', position: 'Member' },
  { name: 'P.S. Ramakrishna Raja (Vizag)', position: 'Member' },
  { name: 'P.S. Srirenga Raja (EB)', position: 'Member' },
  { name: 'P.D. Kodhandarama Raja', position: 'Member' },
  { name: 'K.S. Jeganatha Raja', position: 'Member' },
  { name: 'K.R. Rehupathi Raja', position: 'Member' },
  { name: 'A.R. Shankar (Thenkai Petta)', position: 'Member' },
  { name: 'M.B. Radhakrishna Raja', position: 'Member' },
  { name: 'P.S. Ramakrishna Raja (Army)', position: 'Member' },
  { name: 'P.S. Muruga Raja (Vijaya Mill St.)', position: 'Member' },
  { name: 'V.A. Ravishankar Raja (P.S.K.Nagar)', position: 'Member' },
  { name: 'S.R. Viyash (D2b)', position: 'Member' },
  { name: 'T.S. Ramakrishna Raja (Thengai Petta)', position: 'Member' },
  { name: 'S.K. Pethu Raja', position: 'Member' },
  { name: 'P.G. Janarthanan Raja', position: 'Member' },
  { name: 'P.R. Venkadesha Raja', position: 'Member' },
];

function AboutPage() {
  const [openId, setOpenId] = useState('history');
  const [currentPage, setCurrentPage] = useState(0);

  const toggle = (id) => setOpenId((prev) => (prev === id ? null : id));

  // Pagination setup: 2 rows, 5 items per row = 10 items per page
  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(COMMITTEE_MEMBERS.length / ITEMS_PER_PAGE);
  const startIdx = currentPage * ITEMS_PER_PAGE;
  const endIdx = startIdx + ITEMS_PER_PAGE;
  const currentMembers = COMMITTEE_MEMBERS.slice(startIdx, endIdx);

  const handlePrevPage = () => {
    setCurrentPage((prev) => (prev > 0 ? prev - 1 : totalPages - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => (prev < totalPages - 1 ? prev + 1 : 0));
  };

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

          <div className="ab-members-pagination-wrap">
            {/* Left Arrow */}
            <button
              className="ab-members-arrow ab-members-arrow-left"
              onClick={handlePrevPage}
              aria-label="Previous page"
              disabled={totalPages <= 1}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <div className="ab-members-grid">
              {currentMembers.map((member, i) => (
                <div className="ab-member-card" key={`${currentPage}-${i}`}>
                  <div className="ab-member-avatar-wrap">
                    <div className="ab-member-avatar">
                      {member.isPic && getProfileImage(member.name) ? (
                        <img src={getProfileImage(member.name)} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect width="80" height="80" fill="#f5f5f5" />
                          <circle cx="40" cy="28" r="16" fill="#ddd" />
                          <ellipse cx="40" cy="72" rx="26" ry="18" fill="#ddd" />
                        </svg>
                      )}
                    </div>
                    {member.position !== 'Member' && <span className="ab-member-badge">{member.position}</span>}
                  </div>
                  <p className="ab-member-name">{member.name}</p>
                  <p className="ab-member-position">{member.position}</p>
                </div>
              ))}
            </div>

            {/* Right Arrow */}
            <button
              className="ab-members-arrow ab-members-arrow-right"
              onClick={handleNextPage}
              aria-label="Next page"
              disabled={totalPages <= 1}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          {/* Pagination Indicator */}
          <div className="ab-pagination-info">
            Page {currentPage + 1} of {totalPages}
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
