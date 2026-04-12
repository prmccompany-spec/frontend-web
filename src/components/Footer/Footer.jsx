import { useState } from 'react';
import './Footer.css';

function Footer() {
  const [email, setEmail] = useState('');

  return (
    <footer className="footer">
      <div className="footer-inner">

        {/* Col 1 — Brand + Newsletter + Socials */}
        <div className="footer-col footer-col-brand">
          <h2 className="footer-logo">PRMCF</h2>
          <p className="footer-tagline">
            Sign up for inspirational stories<br />& the latest updates
          </p>

          <div className="footer-email-wrap">
            <label className="footer-email-label" htmlFor="footer-email">Email</label>
            <div className="footer-email-row">
              <input
                id="footer-email"
                type="email"
                className="footer-email-input"
                placeholder="Your email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              <span className="footer-email-arrow">&#8250;</span>
            </div>
          </div>

          <div className="footer-socials">
            {/* Facebook */}
            <a href="https://facebook.com" className="footer-social-link" target="_blank" rel="noreferrer" aria-label="Facebook">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
              </svg>
            </a>
            {/* Instagram */}
            <a href="https://instagram.com" className="footer-social-link" target="_blank" rel="noreferrer" aria-label="Instagram">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <circle cx="12" cy="12" r="4"/>
                <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
              </svg>
            </a>
            {/* YouTube */}
            <a href="https://youtube.com" className="footer-social-link" target="_blank" rel="noreferrer" aria-label="YouTube">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.96-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
                <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="#e8341a"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Col 2 — About us */}
        <div className="footer-col footer-col-links">
          <h3 className="footer-col-heading">About us</h3>
          <ul className="footer-link-list">
            <li><a href="#">Awards</a></li>
            <li><a href="#">News &amp; Articles</a></li>
            <li><a href="#">Events</a></li>
            <li><a href="#">Donate</a></li>
          </ul>
        </div>

        {/* Col 3 — Contact us */}
        <div className="footer-col footer-col-contact">
          <h3 className="footer-col-heading">Contact us</h3>
          <address className="footer-address">
            <p>44, Dharmaraja St,</p>
            <p>RJPM Avarampatti, Rajapalayam,</p>
            <p>Tamil Nadu - 626117</p>
            <p className="footer-address-gap">
              <a href="mailto:Palayapalayamrajukkalshavadi@gmail.com">
                Palayapalayamrajukkalshavadi@gmail.com
              </a>
            </p>
            <p><a href="tel:+918807541551">+91-8807541551</a></p>
            <p><a href="tel:+911140661662">+91-1140661662</a></p>
          </address>
        </div>

      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} PRMCF. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
