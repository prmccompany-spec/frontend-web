import volleyballImg from '../../assets/volley_ball_tournament.png';
import './DriveSection.css';

const cards = [
  {
    id: 1,
    title: 'Educational Programs',
    description: 'Workshops and scholarships for youth development.',
    image: null,
  },
  {
    id: 2,
    title: 'Volleyball Tournament',
    description: 'Celebrating sportsmanship and community spirit.',
    image: volleyballImg,
  },
  {
    id: 3,
    title: 'Community Events',
    description: 'Workshops and scholarships for youth development.',
    image: null,
  },
];

function DriveSection() {
  return (
    <section className="drive-section">
      <div className="drive-inner">

        <h2 className="drive-heading">
          Find Our <span className="drive-heading-accent">Drive</span>
        </h2>

        <div className="drive-cards">
          {cards.map((card) => (
            <div className="drive-card" key={card.id}>

              {/* Stacked image frames */}
              <div className="drive-card-frames">
                {/* Salmon dot overlapping top-left of card */}
                <div className="drive-card-dot" />
                <div className="drive-frame drive-frame-back" />
                <div className="drive-frame drive-frame-front">
                  {card.image ? (
                    <img src={card.image} alt={card.title} className="drive-card-img" />
                  ) : (
                    <div className="drive-card-placeholder">
                      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="6" y="10" width="36" height="28" rx="3" stroke="#bbb" strokeWidth="2" fill="none"/>
                        <circle cx="18" cy="20" r="4" stroke="#bbb" strokeWidth="2" fill="none"/>
                        <path d="M6 32l9-8 7 7 5-5 9 9" stroke="#bbb" strokeWidth="2" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Text */}
              <h3 className="drive-card-title">{card.title}</h3>
              <p className="drive-card-desc">{card.description}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

export default DriveSection;
