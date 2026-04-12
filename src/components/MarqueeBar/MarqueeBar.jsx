import './MarqueeBar.css';

const items = [
  'Upcoming Event: Grand Annual Meeting',
  'on June 15th, 2025',
  'Venue: Palayapalayam Community Hall',
  'All Members are Welcome!',
  'Upcoming Event: Grand Annual Meeting',
  'on June 15th, 2025',
  'Venue: Palayapalayam Community Hall',
  'All Members are Welcome!',
];

function MarqueeBar() {
  return (
    <div className="marquee-bar">
      <div className="marquee-track">
        {items.map((item, index) => (
          <span key={index} className="marquee-item">
            <span className="marquee-dot">•</span>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export default MarqueeBar;
