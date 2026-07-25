import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AboutPage from '../pages/about/AboutPage';
import EventsPage from '../pages/events/EventsPage';
import UnderConstruction from '../pages/UnderConstruction/UnderConstruction';
import Dashboard from '../pages/user/Dashboard';
import Services from '../pages/user/Services';
import MemberSearch from '../pages/user/MemberSearch';
import AdminLayout from '../pages/admin/AdminLayout';
import AdminPanel from '../pages/admin/AdminPanel';
import RegisterMember from '../pages/admin/RegisterMember';
import MemberList from '../pages/admin/MemberList';
import Settings from '../pages/admin/Settings';
import AuthControl from '../pages/admin/AuthControl';
import PaymentEntry from '../pages/admin/payments/PaymentEntry';
import PaymentHistory from '../pages/admin/payments/PaymentHistory';
import Reports from '../pages/admin/Reports';
import AssignDue from '../pages/admin/payments/AssignDue';
import DueTracker from '../pages/admin/payments/DueTracker';
import HomePage from '../pages/home/HomePage';
import TermsPage from '../pages/legal/TermsPage';
import PrivacyPage from '../pages/legal/PrivacyPage';
import RefundPage from '../pages/legal/RefundPage';
import AddEvent from '../pages/admin/events/AddEvent';
import ServicesList from '../pages/admin/ServicesList';
import ServiceForm from '../pages/admin/ServiceForm';
import ServiceConfig from '../pages/admin/ServiceConfig';
import ServiceRequestTracker from '../pages/admin/ServiceRequestTracker';
import ExpenseBook from '../pages/admin/ExpenseBook';
import RentalProducts from '../pages/admin/rentals/RentalProducts';
import RentalEntry from '../pages/admin/rentals/RentalEntry';
import RentalHistory from '../pages/admin/rentals/RentalHistory';
import Scanner from '../pages/admin/attendance/Scanner';
import AttendanceReport from '../pages/admin/attendance/AttendanceReport';

const ProtectedRoute = ({ children, routeKey }) => {
  const { canAccess } = useAuth();
  if (!canAccess(routeKey)) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute routeKey="dashboard">
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/services"
        element={
          <ProtectedRoute routeKey="services">
            <Services />
          </ProtectedRoute>
        }
      />

      <Route
        path="/member-search"
        element={
          <ProtectedRoute routeKey="member-search">
            <MemberSearch />
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
        <Route path="payments/assign-due" element={<AssignDue />} />
        <Route path="payments/due-tracker" element={<DueTracker />} />
        <Route path="reports" element={<Reports />} />
        <Route path="events/add" element={<AddEvent />} />
        <Route path="services" element={<ServicesList />} />
        <Route path="services/new" element={<ServiceForm />} />
        <Route path="services/:id/edit" element={<ServiceForm />} />
        <Route path="services/:id/configure" element={<ServiceConfig />} />
        <Route path="services/requests" element={<ServiceRequestTracker />} />
        <Route path="expenses" element={<ExpenseBook />} />
        <Route path="rentals/products" element={<RentalProducts />} />
        <Route path="rentals/entry" element={<RentalEntry />} />
        <Route path="rentals/history" element={<RentalHistory />} />
        <Route path="attendance/scan" element={<Scanner />} />
        <Route path="attendance/report" element={<AttendanceReport />} />
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
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/privacy-policy" element={<PrivacyPage />} />
      <Route path="/refund-policy" element={<RefundPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
