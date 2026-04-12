import { useEffect } from 'react';
import './LiveEventModal.css';

function LiveEventModal({ event, onClose }) {
  if (!event) return null;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Extract YouTube video ID from various YouTube URL formats
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return '';
    
    let videoId = '';
    
    // Handle youtube.com/live/ID
    if (url.includes('youtube.com/live')) {
      videoId = url.split('live/')[1]?.split('?')[0];
    }
    // Handle youtube.com/watch?v=ID
    else if (url.includes('youtube.com/watch')) {
      videoId = url.split('v=')[1]?.split('&')[0];
    }
    // Handle youtu.be/ID
    else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0];
    }
    // Handle youtube.com/embed/ID
    else if (url.includes('youtube.com/embed/')) {
      videoId = url.split('embed/')[1]?.split('?')[0];
    }
    // If it's just the video ID
    else if (!/[\/:\.]/.test(url)) {
      videoId = url;
    }

    return `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1&modestbranding=1&fs=1`;
  };

  return (
    <div className="live-modal-overlay" onClick={handleOverlayClick}>
      <div className="live-modal" onClick={(e) => e.stopPropagation()}>
        <button className="live-modal-close" onClick={onClose} title="Close (ESC)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="live-modal-header">
          <div className="live-modal-badge">
            <span className="live-modal-dot"></span>
            <span>LIVE</span>
          </div>
          <h2 className="live-modal-title">{event.title}</h2>
        </div>

        <div className="live-video-container">
          <iframe
            className="live-video-player"
            src={getYouTubeEmbedUrl(event.youtubeLink)}
            title={event.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>

        {/* <div className="live-modal-footer">
          <div className="live-modal-info">
            <div className="live-info-item">
              <span className="live-info-label">Organizer</span>
              <span className="live-info-value">{event.organizer}</span>
            </div>
            <div className="live-info-item">
              <span className="live-info-label">Contact</span>
              <span className="live-info-value">
                <a href={`tel:${event.phone}`}>{event.phone}</a>
              </span>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
}

export default LiveEventModal;
