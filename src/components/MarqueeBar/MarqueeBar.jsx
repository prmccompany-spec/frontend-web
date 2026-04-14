import './MarqueeBar.css';

const items = [
  'Ongoing Event : Tamil New Year Chitirai Vizha',
  'On Apr 14, 2026',
  'All members are welcome!',
  'Ongoing Event : Tamil New Year Chitirai Vizha',
  'On Apr 14, 2026',
  'All members are welcome!',
  'Ongoing Event : Tamil New Year Chitirai Vizha',
  'On Apr 14, 2026',
  'All members are welcome!'
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
