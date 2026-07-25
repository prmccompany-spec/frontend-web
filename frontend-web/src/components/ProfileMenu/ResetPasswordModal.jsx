import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './ProfileMenu.css';

function ResetPasswordModal({ onClose }) {
  const { resetPassword } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!/^\d{6}$/.test(newPassword)) {
      return setError('New password must be exactly 6 digits.');
    }
    if (newPassword !== confirmPassword) {
      return setError('New password and confirmation do not match.');
    }

    setLoading(true);
    try {
      await resetPassword(oldPassword, newPassword);
      setSuccess('Password updated successfully.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pm-modal-overlay" onClick={onClose}>
      <div className="pm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pm-modal-header">
          <h2 className="pm-modal-title">Reset Password</h2>
          <button className="pm-modal-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="pm-modal-body">
          {error && <div className="pm-alert pm-alert--error">{error}</div>}
          {success && <div className="pm-alert pm-alert--success">{success}</div>}

          <div className="pm-field">
            <label className="pm-label">Current Password</label>
            <input
              type="password" inputMode="numeric" className="pm-input" maxLength={6}
              value={oldPassword} onChange={(e) => setOldPassword(e.target.value)}
              required autoFocus disabled={loading}
            />
          </div>
          <div className="pm-field">
            <label className="pm-label">New Password (6 digits)</label>
            <input
              type="password" inputMode="numeric" className="pm-input" maxLength={6}
              value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              required disabled={loading}
            />
          </div>
          <div className="pm-field">
            <label className="pm-label">Confirm New Password</label>
            <input
              type="password" inputMode="numeric" className="pm-input" maxLength={6}
              value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              required disabled={loading}
            />
          </div>

          <button type="submit" className="pm-submit" disabled={loading}>
            {loading ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ResetPasswordModal;
