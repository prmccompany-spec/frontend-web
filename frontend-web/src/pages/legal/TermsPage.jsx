import { Link } from 'react-router-dom';
import './LegalPage.css';

function TermsPage() {
  return (
    <div className="legal-page">
      <div className="legal-hero">
        <h1>Terms &amp; Conditions</h1>
        <p>Last updated: May 2025</p>
      </div>

      <div className="legal-container">
        <div className="legal-card">

          <section className="legal-section">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing or using the PRMCF (Palayapalayam Raju's Mahumai Common Fund) website
              and its services, you agree to be bound by these Terms &amp; Conditions. If you do
              not agree to any part of these terms, please do not use our website.
            </p>
          </section>

          <section className="legal-section">
            <h2>2. About PRMCF</h2>
            <p>
              PRMCF is a community trust established to support its members in education,
              marriage assistance, healthcare aid, and general community welfare. All activities
              conducted through this platform are governed by the rules and regulations of the
              trust.
            </p>
          </section>

          <section className="legal-section">
            <h2>3. Eligibility</h2>
            <p>
              Membership and access to certain services are restricted to eligible community
              members as defined by the PRMCF constitution. Registration on this platform does
              not automatically confer membership; membership is subject to verification and
              approval by the trust committee.
            </p>
          </section>

          <section className="legal-section">
            <h2>4. Use of the Platform</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Provide false or misleading information during registration or transactions.</li>
              <li>Use the platform for any unlawful purpose.</li>
              <li>Attempt to gain unauthorized access to any part of the website.</li>
              <li>Interfere with the proper functioning of the platform.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>5. Donations &amp; Payments</h2>
            <p>
              All donations and payments made through this platform are processed securely via
              CC Avenue payment gateway. By making a payment, you confirm that you are the
              authorized holder of the payment instrument used. All amounts are in Indian Rupees
              (INR) unless stated otherwise.
            </p>
          </section>

          <section className="legal-section">
            <h2>6. Intellectual Property</h2>
            <p>
              All content on this website, including text, images, logos, and graphics, is the
              property of PRMCF and is protected under applicable copyright laws. You may not
              reproduce or redistribute any content without prior written permission.
            </p>
          </section>

          <section className="legal-section">
            <h2>7. Limitation of Liability</h2>
            <p>
              PRMCF shall not be liable for any indirect, incidental, or consequential damages
              arising from the use of or inability to use this platform. We make no warranties,
              expressed or implied, regarding the accuracy or completeness of the information
              provided.
            </p>
          </section>

          <section className="legal-section">
            <h2>8. Amendments</h2>
            <p>
              PRMCF reserves the right to modify these Terms &amp; Conditions at any time.
              Changes will be effective immediately upon posting to the website. Continued use
              of the platform constitutes acceptance of the revised terms.
            </p>
          </section>

          <section className="legal-section">
            <h2>9. Governing Law</h2>
            <p>
              These terms are governed by the laws of India. Any disputes shall be subject to
              the exclusive jurisdiction of courts in Rajapalayam, Tamil Nadu.
            </p>
          </section>

          <section className="legal-section">
            <h2>10. Contact</h2>
            <p>
              For any questions regarding these Terms &amp; Conditions, please contact us at{' '}
              <a href="mailto:Palayapalayamrajukkalshavadi@gmail.com">
                Palayapalayamrajukkalshavadi@gmail.com
              </a>{' '}
              or call <a href="tel:+918807541551">+91-8807541551</a>.
            </p>
          </section>

        </div>

        <div className="legal-nav">
          <Link to="/privacy-policy" className="legal-nav-link">Privacy Policy →</Link>
          <Link to="/refund-policy" className="legal-nav-link">Refund &amp; Cancellation Policy →</Link>
        </div>
      </div>

      <div className="legal-back">
        <Link to="/" className="legal-back-link">← Back to Home</Link>
      </div>
    </div>
  );
}

export default TermsPage;
