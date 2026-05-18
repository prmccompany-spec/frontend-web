import { useNavigate } from 'react-router-dom';
import './AdminPanel.css';

function AdminPanel() {
  const navigate = useNavigate();

  return (
    <div className="admin-content">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Dashboard</h1>
        <p className="admin-page-subtitle">Welcome to the PRMCF admin panel</p>
      </div>

      <div className="admin-grid">
        <div className="admin-section">
          <div className="admin-section-icon admin-section-icon--members">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <h3>Member Management</h3>
          <p>Register new members and manage existing member records</p>
          <button onClick={() => navigate('/admin/register-member')}>Register Member</button>
        </div>

        <div className="admin-section">
          <div className="admin-section-icon admin-section-icon--view">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
          <h3>View Members</h3>
          <p>Browse, search and manage the full member registry</p>
          <button onClick={() => navigate('/admin/members')}>View Members</button>
        </div>

        <div className="admin-section">
          <div className="admin-section-icon admin-section-icon--logs">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <h3>System Logs</h3>
          <p>View and monitor system activity logs</p>
          <button disabled>View Logs</button>
        </div>

        <div className="admin-section">
          <div className="admin-section-icon admin-section-icon--usertypes">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              <line x1="19" y1="8" x2="23" y2="8" />
              <line x1="21" y1="6" x2="21" y2="10" />
            </svg>
          </div>
          <h3>User Types</h3>
          <p>Define and manage member role types for the registry</p>
          <button onClick={() => navigate('/admin/user-types')}>Manage Types</button>
        </div>

        <div className="admin-section">
          <div className="admin-section-icon admin-section-icon--settings">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </div>
          <h3>Settings</h3>
          <p>Configure system settings and preferences</p>
          <button disabled>Settings</button>
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;
