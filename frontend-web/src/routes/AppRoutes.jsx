import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginPage from '../pages/auth/LoginPage';
import AboutPage from '../pages/about/AboutPage';
import EventsPage from '../pages/events/EventsPage';
import UnderConstruction from '../pages/UnderConstruction/UnderConstruction';
import Dashboard from '../pages/user/Dashboard';
import AdminLayout from '../pages/admin/AdminLayout';
import AdminPanel from '../pages/admin/AdminPanel';
import RegisterMember from '../pages/admin/RegisterMember';
import MemberList from '../pages/admin/MemberList';
import Settings from '../pages/admin/Settings';
import AuthControl from '../pages/admin/AuthControl';
import PaymentEntry from '../pages/admin/payments/PaymentEntry';
import PaymentHistory from '../pages/admin/payments/PaymentHistory';
import PaymentReports from '../pages/admin/payments/PaymentReports';
import HomePage from '../pages/home/HomePage';
import AddEvent from '../pages/admin/events/AddEvent';

const ProtectedRoute = ({ children, routeKey }) => {
  const { canAccess, isAuthenticated } = useAuth();
  if (!canAccess(routeKey)) {
    return <Navigate to={isAuthenticated ? '/' : '/login'} replace />;
  }
  return children;
};

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/admin" replace /> : <LoginPage />}
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute routeKey="dashboard">
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute routeKey="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminPanel />} />
        <Route path="members" element={<MemberList />} />
        <Route path="register-member" element={<RegisterMember />} />
        <Route path="settings" element={<Settings />} />
        <Route path="auth-control" element={<AuthControl />} />
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
      <Route
        path="/donate"
        element={
          <ProtectedRoute routeKey="donate">
            <UnderConstruction />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
