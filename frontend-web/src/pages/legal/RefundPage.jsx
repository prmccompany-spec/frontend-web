import { Link } from 'react-router-dom';
import './LegalPage.css';

function RefundPage() {
  return (
    <div className="legal-page">
      <div className="legal-hero">
        <h1>Refund &amp; Cancellation Policy</h1>
        <p>Last updated: May 2025</p>
      </div>

      <div className="legal-container">
        <div className="legal-card">

          <section className="legal-section">
            <h2>1. Overview</h2>
            <p>
              This policy outlines the terms under which PRMCF processes refunds and
              cancellations for donations and payments made through our platform via the
              CC Avenue payment gateway.
            </p>
          </section>

          <section className="legal-section">
            <h2>2. Donations</h2>
            <p>
              All donations made to PRMCF are voluntary contributions to the community trust.
              Once a donation is successfully processed, it is generally considered final and
              non-refundable, as the funds are allocated to community welfare activities.
            </p>
            <p>
              However, refunds may be considered in the following exceptional circumstances:
            </p>
            <ul>
              <li>Duplicate payment — the same amount was charged more than once for a single transaction.</li>
              <li>Technical error — an incorrect amount was debited due to a system malfunction.</li>
              <li>Unauthorized transaction — the payment was made without your knowledge or consent.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>3. Membership Fees</h2>
            <p>
              Membership fees paid to PRMCF are non-refundable once the membership has been
              activated. If your membership application is rejected by the trust committee,
              any fees paid will be refunded in full within 7–10 working days.
            </p>
          </section>

          <section className="legal-section">
            <h2>4. How to Request a Refund</h2>
            <p>To request a refund, please follow these steps:</p>
            <ol>
              <li>Contact us within <strong>7 days</strong> of the transaction date.</li>
              <li>
                Email{' '}
                <a href="mailto:Palayapalayamrajukkalshavadi@gmail.com">
                  Palayapalayamrajukkalshavadi@gmail.com
                </a>{' '}
                with the subject line: <em>"Refund Request – [Order ID]"</em>.
              </li>
              <li>Include: your full name, registered email, transaction date, Order ID, amount, and reason for the refund request.</li>
              <li>Our team will review and respond within <strong>3–5 working days</strong>.</li>
            </ol>
          </section>

          <section className="legal-section">
            <h2>5. Refund Processing</h2>
            <p>
              Approved refunds will be credited back to the original payment method used at
              the time of the transaction. Processing times:
            </p>
            <ul>
              <li><strong>Credit / Debit cards:</strong> 5–7 working days</li>
              <li><strong>Net banking:</strong> 3–5 working days</li>
              <li><strong>UPI:</strong> 1–3 working days</li>
            </ul>
            <p>
              PRMCF does not bear any charges levied by the bank or payment gateway for
              refund processing. The net refunded amount may vary accordingly.
            </p>
          </section>

          <section className="legal-section">
            <h2>6. Cancellation of Transactions</h2>
            <p>
              If you cancel a transaction on the CC Avenue payment page before completion,
              no amount will be deducted from your account. If a deduction occurs despite
              cancellation, please contact us with your transaction details and we will
              resolve it promptly.
            </p>
          </section>

          <section className="legal-section">
            <h2>7. Non-Refundable Cases</h2>
            <p>Refunds will not be issued for:</p>
            <ul>
              <li>Voluntary donations where no technical error occurred.</li>
              <li>Requests made after 7 days of the transaction date.</li>
              <li>Situations where services have already been rendered.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>8. Disputes</h2>
            <p>
              In case of any payment dispute, you may also raise a chargeback request through
              your bank. PRMCF will cooperate fully with the bank's dispute resolution process
              and provide all necessary transaction records.
            </p>
          </section>

          <section className="legal-section">
            <h2>9. Contact</h2>
            <p>
              For refund or cancellation queries, reach us at{' '}
              <a href="mailto:Palayapalayamrajukkalshavadi@gmail.com">
                Palayapalayamrajukkalshavadi@gmail.com
              </a>{' '}
              or call <a href="tel:+918807541551">+91-8807541551</a>.
            </p>
          </section>

        </div>

        <div className="legal-nav">
          <Link to="/terms" className="legal-nav-link">Terms &amp; Conditions →</Link>
          <Link to="/privacy-policy" className="legal-nav-link">Privacy Policy →</Link>
        </div>
      </div>

      <div className="legal-back">
        <Link to="/" className="legal-back-link">← Back to Home</Link>
      </div>
    </div>
  );
}

export default RefundPage;
