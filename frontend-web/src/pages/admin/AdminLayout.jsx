import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';
import './AdminLayout.css';

const sidebarLinks = [
  {
    label: 'Dashboard',
    path: '/admin',
    end: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    label: 'Members',
    path: '/admin/members',
    end: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: 'Register Member',
    path: '/admin/register-member',
    end: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
        <line x1="12" y1="14" x2="12" y2="20" />
        <line x1="9" y1="17" x2="15" y2="17" />
      </svg>
    ),
  },
  {
    label: 'User Types',
    path: '/admin/user-types',
    end: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        <line x1="19" y1="8" x2="23" y2="8" />
        <line x1="21" y1="6" x2="21" y2="10" />
      </svg>
    ),
  },
];

function AdminLayout() {
  const navigate = useNavigate();

  return (
    <div className="al-root">
      <aside className="al-sidebar">
        <div className="al-brand" onClick={() => navigate('/')}>
          <img src={logo} alt="PRMCF" className="al-logo" />
          <div className="al-brand-text">
            <span className="al-brand-name">PRMCF</span>
            <span className="al-brand-sub">Admin Panel</span>
          </div>
        </div>

        <nav className="al-nav">
          {sidebarLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.end}
              className={({ isActive }) =>
                `al-nav-item${isActive ? ' al-nav-item--active' : ''}`
              }
            >
              {link.icon}
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="al-sidebar-footer">
          <button className="al-back-btn" onClick={() => navigate('/')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back to Site
          </button>
        </div>
      </aside>

      <main className="al-main">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;
