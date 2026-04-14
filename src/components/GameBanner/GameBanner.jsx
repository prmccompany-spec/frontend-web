import { useState } from 'react';
import './GameBanner.css';

function GameBanner() {
  const [isMoving, setIsMoving] = useState(false);
  const [buttonPos, setButtonPos] = useState({ x: 0, y: 0 });
  const [text, setText] = useState('Click me');

  const handleButtonHover = () => {
    if (isMoving) return;

    // Generate random position
    const randomX = Math.random() * 200 - 100; // -100px to 100px
    const randomY = Math.random() * 120 - 60; // -60px to 60px

    setButtonPos({ x: randomX, y: randomY });
    setIsMoving(true);
    setText('Donate');

    // Reset after animation completes
    setTimeout(() => {
      setIsMoving(false);
      setButtonPos({ x: 0, y: 0 });
    }, 600);
  };

  return (
    <div className="game-banner">
      <div className="game-banner-inner">
        <span className="game-banner-dot">•</span>
        <span className="game-banner-text">Shall we play a game</span>
        <button
          className={`game-banner-btn ${isMoving ? 'game-banner-btn-moving' : ''}`}
          onMouseEnter={handleButtonHover}
          disabled={isMoving}
          style={{
            transform: `translate(${buttonPos.x}px, ${buttonPos.y}px)`,
          }}
        >
          {text}
        </button>
      </div>
    </div>
  );
}

export default GameBanner;
