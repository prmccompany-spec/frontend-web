import { useNavigate } from 'react-router-dom';
import welcomeImg from '../../assets/slide3.jpg';
import './WelcomeSection.css';

function WelcomeSection() {
  const navigate = useNavigate();

  return (
    <section className="welcome-section">
      {/* Decorative background blobs */}
      <div className="ws-bg-blob ws-bg-blob-1" />
      <div className="ws-bg-blob ws-bg-blob-2" />

      <div className="welcome-inner">

        {/* Left: blob image */}
        <div className="welcome-image-wrap">
          <div className="welcome-blob-ring">
            <div className="welcome-blob">
              <img src={welcomeImg} alt="Community children" className="welcome-img" />
            </div>
          </div>
        </div>

        {/* Right: content */}
        <div className="welcome-content">
          <h2 className="welcome-heading">Welcome to PRMCF</h2>
          <p className="welcome-tagline">
            Alone we can do so little; together we can do so much
          </p>

          {/* Quote card */}
          <div className="welcome-quote-card">
            <span className="welcome-quote-mark">"</span>
            <p className="welcome-quote">
              The smallest act of kindness is worth more than the grandest intention."
            </p>
            <span className="welcome-quote-author">– Oscar Wilde</span>
          </div>

          <p className="welcome-text">
            Giving is not just about making a donation, it's about making a difference.
          </p>

          <p className="welcome-text">
            Your support builds hope.{' '}
            <span className="welcome-highlight">"A small gift, a big impact".</span>
          </p>

          <p className="welcome-text">
            Together, we change lives. When you give, you grow the community.
            Strong communities start with caring hearts. Be the reason someone smiles today.
          </p>

          <div className="welcome-actions">
            <button className="welcome-learn-btn" onClick={() => navigate('/about')}>
              Learn More →
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}

export default WelcomeSection;
