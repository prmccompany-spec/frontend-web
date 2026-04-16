import { useState, useEffect } from 'react';
import './VideoPopup.css';

const VIDEO_ID = '4rsIM8Gm8o8';
const EMBED_URL = `https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1&mute=0&rel=0&modestbranding=1&enablejsapi=1`;

function VideoPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [iframeSrc, setIframeSrc] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsOpen(true);
      setIframeSrc(EMBED_URL);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    setIframeSrc('');
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="video-popup-backdrop" onClick={handleBackdropClick}>
      <div className="video-popup-container">
        <button className="video-popup-close" onClick={handleClose} aria-label="Close video">
          &times;
        </button>
        <div className="video-popup-iframe-wrapper">
          <iframe
            key={iframeSrc}
            src={iframeSrc}
            title="Promotional Video"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}

export default VideoPopup;
