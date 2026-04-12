import './LiveEventBanner.css';

function LiveEventBanner({ event, onWatchNow }) {
  if (!event || !event.isActive) return null;

  return (
    <div className="live-banner">
      <div className="live-banner-content">
        <div className="live-pulse">
          <span className="live-dot"></span>
          <span className="live-label">LIVE</span>
        </div>
        <h2 className="live-banner-title">{event.title}</h2>
        <button className="live-watch-btn" onClick={onWatchNow}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          Watch Now
        </button>
      </div>
    </div>
  );
}

export default LiveEventBanner;
