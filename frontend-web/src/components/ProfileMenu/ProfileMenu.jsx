import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ResetPasswordModal from './ResetPasswordModal';
import './ProfileMenu.css';

function initials(name = '') {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

// variant: 'avatar' (filled circle w/ initials, for the red member-portal
// headers) | 'icon' (plain person icon, for the white public-site navbar)
// links: optional [{label, path}] shown above Reset Password/Logout
function ProfileMenu({ variant = 'avatar', links = [] }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const goTo = (path) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <div className="pm-root" ref={rootRef}>
      <button
        className={`pm-trigger pm-trigger--${variant}`}
        onClick={() => setOpen((o) => !o)}
        aria-label="Profile menu"
      >
        {variant === 'icon' ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        ) : (
          <span className="pm-avatar">{initials(user?.name)}</span>
        )}
      </button>

      {open && (
        <div className="pm-dropdown">
          <div className="pm-dropdown-name">{user?.name}</div>
          {user?.phone && <div className="pm-dropdown-sub">{user.phone}</div>}
          <div className="pm-dropdown-divider" />

          {links.length > 0 && (
            <>
              {links.map((link) => (
                <button key={link.path} className="pm-dropdown-item" onClick={() => goTo(link.path)}>
                  {link.icon}
                  {link.label}
                </button>
              ))}
              <div className="pm-dropdown-divider" />
            </>
          )}

          <button className="pm-dropdown-item" onClick={() => { setShowReset(true); setOpen(false); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Reset Password
          </button>
          <button className="pm-dropdown-item pm-dropdown-item--danger" onClick={handleLogout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
        </div>
      )}

      {showReset && <ResetPasswordModal onClose={() => setShowReset(false)} />}
    </div>
  );
}

export default ProfileMenu;
