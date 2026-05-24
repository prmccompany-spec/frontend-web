import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import AboutPage from '../pages/about/AboutPage';
import EventsPage from '../pages/events/EventsPage';
import UnderConstruction from '../pages/UnderConstruction/UnderConstruction';
import Dashboard from '../pages/user/Dashboard';
import AdminLayout from '../pages/admin/AdminLayout';
import AdminPanel from '../pages/admin/AdminPanel';
import RegisterMember from '../pages/admin/RegisterMember';
import MemberList from '../pages/admin/MemberList';
import UserTypes from '../pages/admin/UserTypes';
import Settings from '../pages/admin/Settings';
import PaymentEntry from '../pages/admin/payments/PaymentEntry';
import PaymentHistory from '../pages/admin/payments/PaymentHistory';
import PaymentReports from '../pages/admin/payments/PaymentReports';
import HomePage from '../pages/home/HomePage';
import AddEvent from '../pages/admin/events/AddEvent';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <UnderConstruction />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />}
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Admin — auth free, sidebar layout */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminPanel />} />
        <Route path="members" element={<MemberList />} />
        <Route path="register-member" element={<RegisterMember />} />
        <Route path="user-types" element={<UserTypes />} />
        <Route path="settings" element={<Settings />} />
        <Route path="payments/entry" element={<PaymentEntry />} />
        <Route path="payments/history" element={<PaymentHistory />} />
        <Route path="payments/reports" element={<PaymentReports />} />
        <Route path="events/add" element={<AddEvent />} />
      </Route>

      <Route path="/" element={<HomePage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/events" element={<EventsPage />} />
      <Route path="/news" element={<UnderConstruction />} />
      <Route path="/awards" element={<UnderConstruction />} />
      <Route path="/donate" element={<UnderConstruction />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
