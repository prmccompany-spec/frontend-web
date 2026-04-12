import { useAuth } from '../../context/AuthContext';
import './AdminPanel.css';

function AdminPanel() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1>Admin Panel</h1>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </header>

      <div className="admin-content">
        <div className="admin-card">
          <h2>Administrator Dashboard</h2>
          <p>Logged in as: {user?.name} ({user?.email})</p>
        </div>

        <div className="admin-grid">
          <div className="admin-section">
            <h3>User Management</h3>
            <p>Manage system users and permissions</p>
            <button>Manage Users</button>
          </div>
          <div className="admin-section">
            <h3>System Logs</h3>
            <p>View and monitor system logs</p>
            <button>View Logs</button>
          </div>
          <div className="admin-section">
            <h3>Settings</h3>
            <p>Configure system settings</p>
            <button>Settings</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;
