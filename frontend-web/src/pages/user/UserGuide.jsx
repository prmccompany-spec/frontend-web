import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ProfileMenu from '../../components/ProfileMenu/ProfileMenu';
import UserGuideView from '../../components/UserGuideView/UserGuideView';
import logo from '../../assets/logo.png';
import memberGuide from '../../data/memberGuideContent';
import './UserGuide.css';

function UserGuide() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="mug-root">
      <header className="mug-header">
        <div className="mug-header-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <img src={logo} alt="PRMCF" className="mug-header-logo" />
          <div>
            <div className="mug-header-name">PRMCF</div>
            <div className="mug-header-sub">Member Portal</div>
          </div>
        </div>
        <nav className="mug-header-nav">
          <button className="mug-nav-btn" onClick={() => navigate('/dashboard')}>Dashboard</button>
          <button className="mug-nav-btn" onClick={() => navigate('/member-search')}>Member Search</button>
          <button className="mug-nav-btn" onClick={() => navigate('/services')}>Offline Services</button>
          <ProfileMenu />
        </nav>
      </header>

      <div className="mug-content">
        <UserGuideView
          title="Member Portal User Guide"
          subtitle="What each page in your portal is for, and how to get the most out of it."
          sections={memberGuide}
        />
      </div>
    </div>
  );
}

export default UserGuide;
