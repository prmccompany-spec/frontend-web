import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/logo.png';
import './LoginPage.css';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="lp-container">

      {/* Left panel — brand */}
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

      {/* Right panel — form */}
      <div className="lp-right">
        <div className="lp-card">

          <div className="lp-card-header">
            <h2 className="lp-title">Welcome back</h2>
            <p className="lp-subtitle">Sign in to your PRMCF account</p>
          </div>

          {error && (
            <div className="lp-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="lp-form">
            <div className="lp-field">
              <label htmlFor="email" className="lp-label">Email address</label>
              <div className="lp-input-wrap">
                <svg className="lp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <input
                  type="email"
                  id="email"
                  className="lp-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="lp-field">
              <div className="lp-label-row">
                <label htmlFor="password" className="lp-label">Password</label>
                <button type="button" className="lp-forgot">Forgot password?</button>
              </div>
              <div className="lp-input-wrap">
                <svg className="lp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className="lp-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="lp-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" className="lp-submit" disabled={loading}>
              {loading ? (
                <><span className="lp-spinner" /> Signing in...</>
              ) : (
                'Sign In'
              )}
            </button>

            {/* <p className="lp-register-text">
              Don't have an account?{' '}
              <button type="button" className="lp-register-link" onClick={() => navigate('/register')}>
                Create account
              </button>
            </p> */}
          </form>

        </div>
      </div>

    </div>
  );
}

export default LoginPage;
