import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/logo.png';
import './LoginPage.css';

function LoginPage() {
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const { requestOtp, verifyOtp, loading } = useAuth();
  const navigate = useNavigate();

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await requestOtp(phone.trim());
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send OTP. Please try again.');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = await verifyOtp(phone.trim(), otp.trim());
      const typeId = data.user?.user_type_id;
      navigate(typeId === 1 ? '/admin' : '/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    }
  };

  return (
    <div className="lp-container">
      <div className="lp-left">
        <div className="lp-left-blob lp-blob-1" />
        <div className="lp-left-blob lp-blob-2" />
        <div className="lp-left-content">
          <img src={logo} alt="PRMCF Logo" className="lp-logo" />
          <h1 className="lp-brand">PRMCF</h1>
          <p className="lp-brand-sub">
            Palayapalayam Rajapalayam<br />Raju's Common Fund
          </p>
          <div className="lp-divider" />
          <p className="lp-quote">
            &ldquo;Your passion fuels our purpose.<br />
            Your commitment creates our strength.&rdquo;
          </p>
        </div>
      </div>

      <div className="lp-right">
        <div className="lp-card">
          <div className="lp-card-header">
            <h2 className="lp-title">
              {step === 'phone' ? 'Sign in' : 'Enter OTP'}
            </h2>
            <p className="lp-subtitle">
              {step === 'phone'
                ? 'Enter your registered mobile number'
                : `OTP sent to +91 ${phone}`}
            </p>
          </div>

          {error && (
            <div className="lp-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          {step === 'phone' ? (
            <form onSubmit={handleRequestOtp} className="lp-form">
              <div className="lp-field">
                <label htmlFor="phone" className="lp-label">Mobile Number</label>
                <div className="lp-input-wrap">
                  <svg className="lp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.69h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <input
                    type="tel"
                    id="phone"
                    className="lp-input"
                    placeholder="10-digit mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    maxLength={10}
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              <button type="submit" className="lp-submit" disabled={loading || phone.length < 10}>
                {loading ? <><span className="lp-spinner" /> Sending OTP…</> : 'Get OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="lp-form">
              <div className="lp-field">
                <label htmlFor="otp" className="lp-label">One-Time Password</label>
                <div className="lp-input-wrap">
                  <svg className="lp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    type="text"
                    id="otp"
                    className="lp-input lp-input--otp"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    maxLength={6}
                    required
                    disabled={loading}
                    autoFocus
                  />
                </div>
              </div>
              <button type="submit" className="lp-submit" disabled={loading || otp.length < 4}>
                {loading ? <><span className="lp-spinner" /> Verifying…</> : 'Verify OTP'}
              </button>
              <button
                type="button"
                className="lp-change-number"
                onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
                disabled={loading}
              >
                Change number
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
