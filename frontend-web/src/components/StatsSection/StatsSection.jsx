import './StatsSection.css';

function StatsSection() {
  return (
    <section className="stats-section">
      <div className="stats-inner">

        {/* Left column */}
        <div className="stats-left">
          <div className="stats-blob" />
          <p className="stats-eyebrow">PRMCF's</p>
          <h2 className="stats-heading">
            Our Strength in <span className="stats-heading-accent">Numbers</span>
          </h2>

          <div className="stats-number-block">
            <span className="stats-number">1000 +</span>
            <h3 className="stats-sub">Incredible Souls Strong</h3>
          </div>

          <p className="stats-desc">
            To every member who believed in our vision, who showed up when it mattered,
            who lifted others when they needed it most — this is YOUR community. Your
            passion fuels our purpose. Your commitment creates our strength. Your voice
            shapes our future.
          </p>

          <p className="stats-tagline">
            We don't just count members. We celebrate champions.
          </p>
        </div>

        {/* Right column */}
        <div className="stats-right">
          <div className="stats-impact-card">
            <div className="stats-impact-content">
              {/* Empty upper area — to be filled with impact imagery/content */}
            </div>
            <div className="stats-impact-footer">
              <p className="stats-impact-placeholder">
                Write about the impact that we have created over the past years
              </p>
              <button className="stats-impact-btn">Write</button>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

export default StatsSection;
