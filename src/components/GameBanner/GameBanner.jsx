import './GameBanner.css';

function GameBanner() {
  return (
    <div className="game-banner">
      <div className="game-banner-inner">
        <span className="game-banner-dot">•</span>
        <span className="game-banner-text">Shall we play a game</span>
        <button className="game-banner-btn">Click me</button>
      </div>
    </div>
  );
}

export default GameBanner;
