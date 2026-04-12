import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/logo.png';
import './Navbar.css';

const navLinks = [
  { label: 'Home', path: '/' },
  { label: 'About Us', path: '/about' },
  { label: 'Events', path: '/events' },
  { label: 'News & Articles', path: '/news' },
  { label: 'Awards', path: '/awards' },
  { label: 'Donate', path: '/donate' },
];

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMenuOpen(false);
  };

  const goTo = (path) => {
    navigate(path);
    setMenuOpen(false);
  };

  return (
    <>
      <nav className="navbar">
        {/* Hamburger */}
        <button
          className={`navbar-hamburger${menuOpen ? ' is-open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Logo - Center */}
        <div className="navbar-logo" onClick={() => goTo('/')}>
          <img src={logo} alt="PRMC Logo" />
        </div>

        {/* Right side actions */}
        <div className="navbar-actions">
          <button className="navbar-donate-btn" onClick={() => goTo('/donate')}>
            Donate
          </button>
          <button
            className="navbar-user-btn"
            aria-label="User account"
            onClick={() => isAuthenticated ? goTo('/dashboard') : goTo('/login')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Overlay backdrop */}
      <div
        className={`nav-overlay${menuOpen ? ' is-visible' : ''}`}
        onClick={() => setMenuOpen(false)}
      />

      {/* Slide-in Drawer */}
      <div className={`nav-drawer${menuOpen ? ' is-open' : ''}`}>
        {/* Drawer header */}
        <div className="nav-drawer-header">
          <img src={logo} alt="PRMC Logo" className="nav-drawer-logo" onClick={() => goTo('/')} />
          <button className="nav-drawer-close" onClick={() => setMenuOpen(false)} aria-label="Close menu">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Nav links */}
        <ul className="nav-drawer-links">
          {navLinks.map((link, i) => (
            <li key={link.path} className="nav-drawer-item" style={{ '--i': i }}>
              <button onClick={() => goTo(link.path)}>
                <span className="nav-drawer-dot" />
                {link.label}
              </button>
            </li>
          ))}
          {user?.role === 'admin' && (
            <li className="nav-drawer-item" style={{ '--i': navLinks.length }}>
              <button onClick={() => goTo('/admin')}>
                <span className="nav-drawer-dot" />
                Admin Panel
              </button>
            </li>
          )}
        </ul>

        {/* Drawer footer */}
        <div className="nav-drawer-footer">
          {isAuthenticated ? (
            <button className="nav-drawer-auth-btn nav-drawer-logout" onClick={handleLogout}>
              Logout
            </button>
          ) : (
            <button className="nav-drawer-auth-btn nav-drawer-login" onClick={() => goTo('/login')}>
              Login
            </button>
          )}
        </div>
      </div>
    </>
  );
}

export default Navbar;
