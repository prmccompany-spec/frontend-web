import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import './LoginPage.css';

function LoginForm({ onSuccess }) {
  const [step, setStep] = useState('phone'); // 'phone' | 'password'
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loginType, setLoginType] = useState('');
  const [checkingAccount, setCheckingAccount] = useState(false);
  const [error, setError] = useState('');
  const { login, loading } = useAuth();

  const handleContinue = async (e) => {
    e.preventDefault();
    setError('');
    if (phone.trim().length < 10) {
      return setError('Enter a valid 10-digit mobile number.');
    }
    setCheckingAccount(true);
    try {
      const result = await authService.identifyLoginType(phone.trim());
      if (result.account_type === 'ambiguous') {
        setError('This number is linked to multiple accounts. Please contact an administrator.');
        return;
      }
      if (!['member', 'staff'].includes(result.account_type)) {
        setError('No active account was found for this phone number.');
        return;
      }
      setLoginType(result.account_type);
      setPassword('');
      setStep('password');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to check this phone number. Please try again.');
    } finally {
      setCheckingAccount(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = await login(phone.trim(), password.trim());
      onSuccess?.(data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid phone number or password.');
    }
  };

  const handleChangeNumber = () => {
    setStep('phone');
    setPassword('');
    setLoginType('');
    setError('');
  };

  return (
    <>
      <div className="lp-card-header">
        <h2 className="lp-title">Sign in</h2>
        <p className="lp-subtitle">
          {step === 'phone'
            ? 'Enter your registered mobile number'
            : loginType === 'member'
              ? `Enter your 6-digit member password for ${phone}`
              : `Enter your staff password for ${phone}`}
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
        <form onSubmit={handleContinue} className="lp-form">
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
                autoFocus
              />
            </div>
          </div>
          <button type="submit" className="lp-submit" disabled={checkingAccount || phone.length < 10}>
            {checkingAccount ? <><span className="lp-spinner" /> Checking…</> : 'Continue'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleLogin} className="lp-form">
          <div className="lp-field">
            <label htmlFor="password" className="lp-label">Password</label>
            <div className="lp-input-wrap">
              <input
                type="password"
                inputMode={loginType === 'member' ? 'numeric' : undefined}
                id="password"
                className="lp-input lp-input--flat"
                placeholder={loginType === 'member' ? '6-digit password' : 'Enter your password'}
                value={password}
                onChange={(e) => setPassword(loginType === 'member'
                  ? e.target.value.replace(/\D/g, '').slice(0, 6)
                  : e.target.value)}
                minLength={loginType === 'member' ? 6 : 8}
                maxLength={loginType === 'member' ? 6 : 128}
                required
                disabled={loading}
                autoFocus
              />
            </div>
          </div>
          <button type="submit" className="lp-submit"
            disabled={loading || (loginType === 'member' ? password.length !== 6 : password.length < 8)}>
            {loading ? <><span className="lp-spinner" /> Signing in…</> : 'Sign in'}
          </button>
          <button
            type="button"
            className="lp-link-btn"
            onClick={handleChangeNumber}
            disabled={loading}
          >
            Change mobile number
          </button>
        </form>
      )}
    </>
  );
}

export default LoginForm;
