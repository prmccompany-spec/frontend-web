import { useNavigate } from 'react-router-dom';
import LoginForm from '../../pages/auth/LoginForm';
import logo from '../../assets/logo.png';
import './LoginModal.css';

function LoginModal({ onClose }) {
  const navigate = useNavigate();

  const handleSuccess = (user) => {
    onClose();
    navigate(user?.user_type_id === 1 ? '/admin' : '/dashboard', { replace: true });
  };

  return (
    <div className="lm-overlay" onClick={onClose}>
      <div className="lm-card" onClick={(e) => e.stopPropagation()}>
        <button className="lm-close" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <img src={logo} alt="PRMCF" className="lm-logo" />

        <LoginForm onSuccess={handleSuccess} />
      </div>
    </div>
  );
}

export default LoginModal;
