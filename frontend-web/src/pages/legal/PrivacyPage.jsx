import { Link } from 'react-router-dom';
import './LegalPage.css';

function PrivacyPage() {
  return (
    <div className="legal-page">
      <div className="legal-hero">
        <h1>Privacy Policy</h1>
        <p>Last updated: May 2025</p>
      </div>

      <div className="legal-container">
        <div className="legal-card">

          <section className="legal-section">
            <h2>1. Introduction</h2>
            <p>
              PRMCF ("we", "our", "us") is committed to protecting your personal information.
              This Privacy Policy explains how we collect, use, store, and safeguard your data
              when you use our website and services.
            </p>
          </section>

          <section className="legal-section">
            <h2>2. Information We Collect</h2>
            <p>We may collect the following types of information:</p>
            <ul>
              <li><strong>Personal details:</strong> Name, date of birth, address, phone number, and email address provided during registration.</li>
              <li><strong>Payment information:</strong> Transaction reference numbers processed through CC Avenue (we do not store card details).</li>
              <li><strong>Usage data:</strong> Pages visited, browser type, and IP address collected automatically for analytics.</li>
              <li><strong>Communication records:</strong> Messages or queries you send to us.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>3. How We Use Your Information</h2>
            <p>Your information is used to:</p>
            <ul>
              <li>Verify and manage your membership.</li>
              <li>Process donations and payments.</li>
              <li>Send important community updates and notifications.</li>
              <li>Respond to your queries and support requests.</li>
              <li>Improve our website and services.</li>
              <li>Comply with legal obligations.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>4. Data Sharing</h2>
            <p>
              We do not sell or rent your personal information to third parties. We may share
              data with:
            </p>
            <ul>
              <li><strong>Payment processors:</strong> CC Avenue, solely to complete your transactions.</li>
              <li><strong>Legal authorities:</strong> When required by law or court order.</li>
              <li><strong>Trust committee members:</strong> For membership verification and welfare activities.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>5. Data Storage &amp; Security</h2>
            <p>
              Your data is stored on secure servers. We implement industry-standard security
              measures including encryption and access controls. However, no method of
              transmission over the internet is 100% secure, and we cannot guarantee absolute
              security.
            </p>
          </section>

          <section className="legal-section">
            <h2>6. Cookies</h2>
            <p>
              We use cookies and similar technologies to maintain your session and understand
              how you use our platform. You can disable cookies in your browser settings, though
              some features may not function properly as a result.
            </p>
          </section>

          <section className="legal-section">
            <h2>7. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access the personal data we hold about you.</li>
              <li>Request correction of inaccurate data.</li>
              <li>Request deletion of your data (subject to legal obligations).</li>
              <li>Opt out of non-essential communications.</li>
            </ul>
            <p>To exercise these rights, contact us at the details below.</p>
          </section>

          <section className="legal-section">
            <h2>8. Third-Party Links</h2>
            <p>
              Our website may contain links to third-party sites. We are not responsible for
              the privacy practices of those sites and encourage you to review their policies.
            </p>
          </section>

          <section className="legal-section">
            <h2>9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy periodically. Any changes will be posted on
              this page with a revised date. Continued use of our platform after changes
              constitutes acceptance.
            </p>
          </section>

          <section className="legal-section">
            <h2>10. Contact</h2>
            <p>
              For privacy-related concerns, contact us at{' '}
              <a href="mailto:Palayapalayamrajukkalshavadi@gmail.com">
                Palayapalayamrajukkalshavadi@gmail.com
              </a>{' '}
              or call <a href="tel:+918807541551">+91-8807541551</a>.
            </p>
          </section>

        </div>

        <div className="legal-nav">
          <Link to="/terms" className="legal-nav-link">Terms &amp; Conditions →</Link>
          <Link to="/refund-policy" className="legal-nav-link">Refund &amp; Cancellation Policy →</Link>
        </div>
      </div>

      <div className="legal-back">
        <Link to="/" className="legal-back-link">← Back to Home</Link>
      </div>
    </div>
  );
}

export default PrivacyPage;
