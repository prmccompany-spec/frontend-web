import { useNavigate, useLocation } from 'react-router-dom';
import './UnderConstruction.css';

const PAGE_LABELS = {
  '/events': 'Events',
  '/news': 'News & Articles',
  '/awards': 'Awards',
  '/donate': 'Donate',
  '/login': 'Login',
};

function UnderConstruction() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const label = PAGE_LABELS[pathname] || 'This Page';

  return (
    <div className="uc-page">
      <div className="uc-card">

        {/* Animated gears / icon */}
        <div className="uc-icon-wrap">
          <div className="uc-gear uc-gear-1">
            <svg viewBox="0 0 100 100" fill="none">
              <path
                d="M50 30a20 20 0 100 40 20 20 0 000-40zM50 20v-8M50 88v-8M80 50h8M12 50h8M70.7 29.3l5.7-5.7M23.6 76.4l5.7-5.7M70.7 70.7l5.7 5.7M23.6 23.6l5.7 5.7"
                stroke="#e8341a"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <circle cx="50" cy="50" r="18" stroke="#e8341a" strokeWidth="6" />
              <circle cx="50" cy="50" r="6" fill="#e8341a" />
            </svg>
          </div>
        </div>

        <span className="uc-eyebrow">Coming Soon</span>
        <h1 className="uc-title">{label}</h1>
        <p className="uc-subtitle">
          We're working hard to bring you this page.<br />
          Stay tuned — something exciting is on the way!
        </p>

        {/* Progress bar */}
        <div className="uc-progress-wrap">
          <div className="uc-progress-bar" />
          <span className="uc-progress-label">Under Construction</span>
        </div>

        <button className="uc-btn" onClick={() => navigate('/')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Home
        </button>
      </div>

      {/* Background decorations */}
      <div className="uc-bg-circle uc-bg-circle-1" />
      <div className="uc-bg-circle uc-bg-circle-2" />
    </div>
  );
}

export default UnderConstruction;
