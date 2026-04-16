import { useAuth } from '../../context/AuthContext';
import './Dashboard.css';

function Dashboard() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Dashboard</h1>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </header>

      <div className="dashboard-content">
        <div className="welcome-card">
          <h2>Welcome, {user?.name || 'User'}!</h2>
          <p>Email: {user?.email}</p>
          <p>Role: {user?.role || 'user'}</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Users</h3>
            <p className="stat-number">1,234</p>
          </div>
          <div className="stat-card">
            <h3>Active Sessions</h3>
            <p className="stat-number">567</p>
          </div>
          <div className="stat-card">
            <h3>System Status</h3>
            <p className="stat-status">Healthy</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
