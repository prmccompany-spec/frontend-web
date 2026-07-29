import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { PieChart } from '@mui/x-charts/PieChart';
import { BarChart } from '@mui/x-charts/BarChart';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { getRentals } from '../../services/rentalService';
import { getAttendance } from '../../services/attendanceService';
import { getMyLoginHistory } from '../../services/loginHistoryService';
import { downloadMemberIdCard } from '../../utils/downloadIdCard';
import SiteTour from '../../components/SiteTour/SiteTour';
import ProfileMenu from '../../components/ProfileMenu/ProfileMenu';
import ResetPasswordModal from '../../components/ProfileMenu/ResetPasswordModal';
import EditProfileModal from './EditProfileModal';
import logo from '../../assets/logo.png';
import './Dashboard.css';

const fmt = (val) =>
  Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const fmtMonthYear = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—';

const fmtTime = (d) =>
  d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';

const fmtDuration = (ms) => {
  if (ms <= 0) return '0m';
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const asDate = (d) => (d instanceof Date ? d : new Date(d));
const dateKey = (d) => {
  const dt = asDate(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
};
const monthKey = (d) => {
  const dt = asDate(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
};
const pctChange = (curr, prev) => (prev ? ((curr - prev) / prev) * 100 : null);

const RENTAL_STATUS_LABEL = { active: 'Active', returned: 'Returned', cancelled: 'Cancelled' };

const MEMBER_TOUR_STEPS = [
  {
    target: '[data-tour="member-profile"]',
    title: 'Welcome to your Member Portal',
    content: 'This is your profile card — your name, member ID, role and key personal details at a glance.',
    icon: 'idCard',
    disableBeacon: true,
  },
  {
    target: '[data-tour="member-details"]',
    title: 'My Details',
    content: 'Your gotra, family, contact and identity details, including your assigned branch.',
    icon: 'idCard',
  },
  {
    target: '[data-tour="member-quicklinks"]',
    title: 'Quick Links',
    content: 'Edit your profile, change your password, download your ID card, or search the member directory — all from here.',
    icon: 'link',
  },
  {
    target: '[data-tour="member-stats"]',
    title: 'Your Contribution Summary',
    content: 'Total contributed, outstanding dues, transaction count, and this month/year totals at a glance.',
    icon: 'barChart',
  },
  {
    target: '[data-tour="member-pending"]',
    title: 'Pending Amount',
    content: 'Any dues you owe show up here — select one or more and pay directly.',
    icon: 'alertCircle',
  },
  {
    target: '[data-tour="member-payment-overview"]',
    title: 'Payment Overview',
    content: 'A breakdown of what you\'ve paid, what\'s pending, and dues cleared — plus your full payment history.',
    icon: 'rupee',
  },
  {
    target: '[data-tour="member-attendance"]',
    title: 'My Attendance',
    content: 'Your check-in record for the month, with recent activity listed alongside it.',
    icon: 'calendarCheck',
  },
  {
    target: '[data-tour="member-rentals"]',
    title: 'My Rentals',
    content: 'Any assets you\'ve rented from the organization, with status and amount.',
    icon: 'package',
  },
  {
    target: '[data-tour="member-tour-btn"]',
    title: 'Replay Anytime',
    content: 'Come back to this tour anytime by clicking this button again.',
    icon: 'compass',
  },
];

function initials(name = '') {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

// Inherits the app's font and uses the brand red as MUI's primary color.
const chartTheme = createTheme({
  typography: { fontFamily: 'inherit' },
  palette: { primary: { main: '#e8341a' } },
});

function Delta({ value, suffix = 'vs last month' }) {
  if (value === null || Number.isNaN(value)) return null;
  const up = value >= 0;
  return (
    <span className={`db-delta ${up ? 'db-delta--up' : 'db-delta--down'}`}>
      {up ? '↑' : '↓'} {Math.abs(value).toFixed(1)}% {suffix}
    </span>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [member, setMember] = useState(null);
  const [payments, setPayments] = useState([]);
  const [pendingItems, setPendingItems] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loginHistory, setLoginHistory] = useState([]);
  const [showPending, setShowPending] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payNowClicked, setPayNowClicked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [trendRange, setTrendRange] = useState('year');
  const [runTour, setRunTour] = useState(false);
  const [tourRestartToken, setTourRestartToken] = useState(0);

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showRentalsModal, setShowRentalsModal] = useState(false);
  const [showLoginHistoryModal, setShowLoginHistoryModal] = useState(false);
  const [downloadingId, setDownloadingId] = useState(false);

  const loadAll = useCallback(() => {
    if (!user?.id) return;
    setLoading(true);
    Promise.all([
      api.get(`/members/${user.id}`),
      api.get('/payments', { params: { member_id: user.id } }),
      api.get('/pending-payments', { params: { member_id: user.id, status: 'pending' } }),
      getRentals({ member_id: user.id }),
      getAttendance({ member_id: user.id }),
      getMyLoginHistory(20),
    ])
      .then(([memRes, payRes, pendRes, rentalRes, attRes, loginRes]) => {
        setMember(memRes.data.data ?? memRes.data);
        setPayments(payRes.data.data ?? []);
        setPendingItems(pendRes.data.data ?? []);
        setRentals(rentalRes.data ?? []);
        setAttendance(attRes.data ?? []);
        setLoginHistory(loginRes.data?.data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const startTour = () => {
    setTourRestartToken((t) => t + 1);
    setRunTour(true);
  };

  const toggleSelect = (id) =>
    setSelectedIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  const toggleSelectAll = () =>
    setSelectedIds((ids) =>
      ids.length === pendingItems.length ? [] : pendingItems.map((p) => p.id)
    );

  const selectedItems = pendingItems.filter((p) => selectedIds.includes(p.id));
  const selectedTotal = selectedItems.reduce((s, p) => s + Number(p.amount), 0);

  const now = new Date();
  const sumInMonth = (list, y, m) =>
    list.filter((p) => { const d = asDate(p.payment_date); return d.getMonth() === m && d.getFullYear() === y; })
      .reduce((s, p) => s + Number(p.amount), 0);
  const sumInYear = (list, y) =>
    list.filter((p) => asDate(p.payment_date).getFullYear() === y).reduce((s, p) => s + Number(p.amount), 0);

  const myTotal = payments.reduce((s, p) => s + Number(p.amount), 0);
  const myThisMonth = sumInMonth(payments, now.getFullYear(), now.getMonth());
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const myLastMonth = sumInMonth(payments, lastMonthDate.getFullYear(), lastMonthDate.getMonth());
  const myThisYear = sumInYear(payments, now.getFullYear());
  const myLastYear = sumInYear(payments, now.getFullYear() - 1);
  const outstandingDues = pendingItems.reduce((s, p) => s + Number(p.amount), 0);
  const duesCleared = payments.filter((p) => p.pending_payment_id).reduce((s, p) => s + Number(p.amount), 0);

  const thisMonthDelta = pctChange(myThisMonth, myLastMonth);
  const thisYearDelta = pctChange(myThisYear, myLastYear);

  const paymentHistory = [...payments].sort((a, b) => asDate(b.payment_date) - asDate(a.payment_date));
  const recentPayments = paymentHistory.slice(0, 5);
  const recentRentals = rentals.slice(0, 5);
  const recentAttendance = attendance.slice(0, 5);
  const activeRentals = rentals.filter((r) => r.status === 'active').length;
  const lastLogin = loginHistory.find((l) => l.status === 'success');

  // ── Payment Overview donut ──
  const paymentOverviewData = [
    { id: 0, value: myTotal, label: 'Total Paid', color: '#16a34a' },
    { id: 1, value: outstandingDues, label: 'Pending', color: '#d97706' },
  ].filter((d) => d.value > 0);

  // ── Monthly Contribution Trend ──
  const trendMonths = trendRange === 'year'
    ? Array.from({ length: now.getMonth() + 1 }, (_, i) => new Date(now.getFullYear(), i, 1))
    : Array.from({ length: 6 }, (_, i) => new Date(now.getFullYear(), now.getMonth() - 5 + i, 1));
  const trendLabels = trendMonths.map((d) => d.toLocaleDateString('en-IN', { month: 'short' }));
  const trendValues = trendMonths.map((d) => {
    const key = monthKey(d);
    return payments.filter((p) => monthKey(p.payment_date) === key).reduce((s, p) => s + Number(p.amount), 0);
  });

  // ── My Attendance donut (this month, honest metric — no fabricated
  // Absent/Half-day categories since those aren't tracked) ──
  const daysElapsedThisMonth = now.getDate();
  const presentDatesThisMonth = new Set(
    attendance
      .filter((a) => { const d = asDate(a.attendance_date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); })
      .map((a) => dateKey(a.attendance_date))
  );
  const presentCountThisMonth = presentDatesThisMonth.size;
  const notMarkedThisMonth = Math.max(daysElapsedThisMonth - presentCountThisMonth, 0);
  const attendancePct = daysElapsedThisMonth ? Math.round((presentCountThisMonth / daysElapsedThisMonth) * 100) : 0;
  const attendanceDonutData = [
    { id: 0, value: presentCountThisMonth, label: 'Present', color: '#16a34a' },
    { id: 1, value: notMarkedThisMonth, label: 'Not Marked', color: '#e5e7eb' },
  ].filter((d) => d.value > 0);

  const handleDownloadId = async () => {
    if (!member) return;
    setDownloadingId(true);
    try {
      await downloadMemberIdCard(member);
    } catch (err) {
      alert(`Could not generate ID card: ${err.message}`);
    } finally {
      setDownloadingId(false);
    }
  };

  return (
    <div className="db-root">
      {/* ── Header ── */}
      <header className="db-header">
        <div className="db-header-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <img src={logo} alt="PRMCF" className="db-header-logo" />
          <div>
            <div className="db-header-name">PRMCF</div>
            <div className="db-header-sub">Member Portal</div>
          </div>
        </div>
        <nav className="db-header-nav">
          <button className="db-nav-btn" onClick={() => navigate('/')}>Home</button>
          <button className="db-nav-btn" onClick={() => navigate('/member-search')}>Member Search</button>
          <button className="db-nav-btn" onClick={() => navigate('/services')}>Offline Services</button>
          <button className="tour-btn tour-btn--onred" onClick={() => navigate('/user-guide')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            User Guide
          </button>
          <button className="tour-btn tour-btn--onred" data-tour="member-tour-btn" onClick={startTour}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
            </svg>
            Take a Tour
          </button>
          <ProfileMenu />
        </nav>
      </header>

      <SiteTour
        tourKey="member"
        steps={MEMBER_TOUR_STEPS}
        run={runTour}
        restartToken={tourRestartToken}
        onClose={() => setRunTour(false)}
      />

      <div className="db-content">
        {loading ? (
          <div className="db-skeleton-wrap">
            <div className="db-skeleton db-skeleton--profile" />
            <div className="db-skeleton-row">
              {[1, 2, 3, 4, 5].map((i) => <div key={i} className="db-skeleton db-skeleton--card" />)}
            </div>
          </div>
        ) : (
          <div className="db-shell">
            {/* ══════════ LEFT SIDEBAR ══════════ */}
            <aside className="db-side">
              <div className="db-profile-card" data-tour="member-profile">
                <div className="db-avatar">{initials(user?.name)}</div>
                <div className="db-profile-info">
                  <div className="db-profile-name">{user?.name}</div>
                  <div className="db-profile-meta">
                    <span className="db-badge db-badge--id">{member?.member_id || user?.member_id || '—'}</span>
                    <span className="db-badge db-badge--type">{user?.type_name || 'Member'}</span>
                  </div>
                  <div className="db-profile-fields">
                    {user?.phone && (
                      <div className="db-profile-field">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.69h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                        {user.phone}
                      </div>
                    )}
                    {member?.blood_group && (
                      <div className="db-profile-field">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                        </svg>
                        {member.blood_group}
                      </div>
                    )}
                    {member?.occupation && (
                      <div className="db-profile-field">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="7" width="20" height="14" rx="2" />
                          <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                        </svg>
                        {member.occupation}
                      </div>
                    )}
                    {member?.created_at && (
                      <div className="db-profile-field">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        Member since {fmtMonthYear(member.created_at)}
                      </div>
                    )}
                    {lastLogin && (
                      <div className="db-profile-field">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                        </svg>
                        Last login {fmtDate(lastLogin.created_at)}, {fmtTime(lastLogin.created_at)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="db-section" data-tour="member-details">
                <h2 className="db-section-title">My Details</h2>
                {member ? (
                  <div className="db-personal-grid">
                    {member.gotra_name && (
                      <div className="db-personal-item">
                        <span className="db-personal-key">Gotra</span>
                        <span className="db-personal-val">{member.gotra_name}</span>
                      </div>
                    )}
                    {member.family_name && (
                      <div className="db-personal-item">
                        <span className="db-personal-key">Family</span>
                        <span className="db-personal-val">{member.family_name}</span>
                      </div>
                    )}
                    {member.branch_name && (
                      <div className="db-personal-item">
                        <span className="db-personal-key">Branch</span>
                        <span className="db-personal-val">{member.branch_name}</span>
                      </div>
                    )}
                    {member.father_name && (
                      <div className="db-personal-item">
                        <span className="db-personal-key">Father</span>
                        <span className="db-personal-val">{member.father_name}</span>
                      </div>
                    )}
                    {member.dob && (
                      <div className="db-personal-item">
                        <span className="db-personal-key">Date of Birth</span>
                        <span className="db-personal-val">{fmtDate(member.dob)}</span>
                      </div>
                    )}
                    {member.email && (
                      <div className="db-personal-item">
                        <span className="db-personal-key">Email</span>
                        <span className="db-personal-val">{member.email}</span>
                      </div>
                    )}
                    {member.whatsapp && (
                      <div className="db-personal-item">
                        <span className="db-personal-key">WhatsApp</span>
                        <span className="db-personal-val">{member.whatsapp}</span>
                      </div>
                    )}
                    {member.engagement_date && (
                      <div className="db-personal-item">
                        <span className="db-personal-key">Engagement</span>
                        <span className="db-personal-val">{fmtDate(member.engagement_date)}</span>
                      </div>
                    )}
                    {member.marriage_date && (
                      <div className="db-personal-item">
                        <span className="db-personal-key">Marriage</span>
                        <span className="db-personal-val">{fmtDate(member.marriage_date)}</span>
                      </div>
                    )}
                    {member.aadhar_number && (
                      <div className="db-personal-item">
                        <span className="db-personal-key">Aadhar</span>
                        <span className="db-personal-val">
                          {'•'.repeat(8) + member.aadhar_number.slice(-4)}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="db-empty">No details found.</p>
                )}
              </div>

              {/* ── Quick Links ── */}
              <div className="db-section" data-tour="member-quicklinks">
                <h2 className="db-section-title">Quick Links</h2>
                <div className="db-quicklinks">
                  <button className="db-quicklink-item" onClick={() => setShowEditProfile(true)}>
                    <span className="db-quicklink-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </span>
                    <span className="db-quicklink-label">Edit Profile</span>
                    <svg className="db-quicklink-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                  <button className="db-quicklink-item" onClick={() => setShowChangePassword(true)}>
                    <span className="db-quicklink-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                    <span className="db-quicklink-label">Change Password</span>
                    <svg className="db-quicklink-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                  <button className="db-quicklink-item" disabled={downloadingId || !member?.qr_code} onClick={handleDownloadId}>
                    <span className="db-quicklink-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    </span>
                    <span className="db-quicklink-label">{downloadingId ? 'Generating…' : 'Download ID Card'}</span>
                    <svg className="db-quicklink-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                  <button className="db-quicklink-item" onClick={() => navigate('/member-search')}>
                    <span className="db-quicklink-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    </span>
                    <span className="db-quicklink-label">Member Directory</span>
                    <svg className="db-quicklink-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                  <button className="db-quicklink-item" onClick={() => setShowLoginHistoryModal(true)}>
                    <span className="db-quicklink-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                      </svg>
                    </span>
                    <span className="db-quicklink-label">Login History</span>
                    <svg className="db-quicklink-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </div>
              </div>
            </aside>

            {/* ══════════ RIGHT MAIN ══════════ */}
            <div className="db-main">
              {/* ── Stat cards ── */}
              <div className="db-stats-row" data-tour="member-stats">
                <div className="db-stat-card db-stat-card--accent">
                  <div className="db-stat-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="1" x2="12" y2="23" />
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  </div>
                  <div className="db-stat-value">₹{fmt(myTotal)}</div>
                  <div className="db-stat-label">Total Contributed</div>
                  <Delta value={thisMonthDelta} />
                </div>

                <div className="db-stat-card db-stat-card--warning">
                  <div className="db-stat-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </div>
                  <div className="db-stat-value">₹{fmt(outstandingDues)}</div>
                  <div className="db-stat-label">Outstanding Dues</div>
                  {outstandingDues === 0 ? (
                    <span className="db-delta db-delta--up">No pending dues</span>
                  ) : (
                    <span className="db-delta db-delta--down">{pendingItems.length} due{pendingItems.length !== 1 ? 's' : ''} pending</span>
                  )}
                </div>

                <div className="db-stat-card">
                  <div className="db-stat-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                  </div>
                  <div className="db-stat-value">{payments.length}</div>
                  <div className="db-stat-label">My Transactions</div>
                  <button className="db-stat-link" onClick={() => setShowPaymentModal(true)}>View all transactions</button>
                </div>

                <div className="db-stat-card">
                  <div className="db-stat-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                  <div className="db-stat-value">₹{fmt(myThisMonth)}</div>
                  <div className="db-stat-label">This Month</div>
                  <Delta value={thisMonthDelta} />
                </div>

                <div className="db-stat-card">
                  <div className="db-stat-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                      <polyline points="17 6 23 6 23 12" />
                    </svg>
                  </div>
                  <div className="db-stat-value">₹{fmt(myThisYear)}</div>
                  <div className="db-stat-label">This Year</div>
                  <Delta value={thisYearDelta} suffix="vs last year" />
                </div>
              </div>

              {/* ── Pending amount (unpaid dues only) ── */}
              <button className="db-pending-btn" data-tour="member-pending" onClick={() => setShowPending((s) => !s)}>
                <span className="db-pending-left">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>
                    <span className="db-pending-title">Pending Amount</span>
                    <span className="db-pending-sub">{outstandingDues === 0 ? "You have no pending dues. Great!" : `${pendingItems.length} due${pendingItems.length !== 1 ? 's' : ''} awaiting payment`}</span>
                  </span>
                </span>
                <span className="db-pending-right">
                  <span className="db-pending-value">₹{fmt(outstandingDues)}</span>
                  <svg className={`db-pending-chevron ${showPending ? 'db-pending-chevron--open' : ''}`}
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </span>
              </button>

              {showPending && (
                <div className="db-pending-panel">
                  {pendingItems.length === 0 ? (
                    <p className="db-empty">No pending dues. You're all settled!</p>
                  ) : (
                    <>
                      <div className="db-due-list-head">
                        <label className="db-due-selectall">
                          <input
                            type="checkbox"
                            className="db-checkbox"
                            checked={selectedIds.length === pendingItems.length && pendingItems.length > 0}
                            onChange={toggleSelectAll}
                          />
                          Select all
                        </label>
                      </div>
                      <ul className="db-due-list">
                        {pendingItems.map((p) => (
                          <li
                            key={p.id}
                            className={`db-due-item ${selectedIds.includes(p.id) ? 'db-due-item--selected' : ''}`}
                            onClick={() => toggleSelect(p.id)}
                          >
                            <input
                              type="checkbox"
                              className="db-checkbox"
                              checked={selectedIds.includes(p.id)}
                              onChange={() => toggleSelect(p.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="db-due-info">
                              <span className="db-due-title">{p.title}</span>
                              <span className="db-due-meta">
                                {p.category_name && <span className="db-due-chip">{p.category_name}</span>}
                                {p.due_date && `Due ${fmtDate(p.due_date)}`}
                              </span>
                            </div>
                            <span className="db-amount">₹{fmt(p.amount)}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="db-pending-footer">
                        <div className="db-pending-total">
                          <span className="db-pending-total-label">
                            {selectedIds.length} of {pendingItems.length} selected
                          </span>
                          <span className="db-pending-total-value">Total: ₹{fmt(selectedTotal)}</span>
                        </div>
                        <button
                          className="db-pay-btn"
                          disabled={selectedIds.length === 0}
                          onClick={() => {
                            setPayNowClicked(false);
                            setShowPayModal(true);
                          }}
                        >
                          Pay ₹{fmt(selectedTotal)}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ── Payment details modal ── */}
              {showPayModal && (
                <div className="db-modal-overlay" onClick={() => setShowPayModal(false)}>
                  <div className="db-modal" onClick={(e) => e.stopPropagation()}>
                    <button className="db-modal-close" onClick={() => setShowPayModal(false)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>

                    <div className="db-modal-header">
                      <div className="db-modal-title">
                        {selectedItems.length} Payment{selectedItems.length > 1 ? 's' : ''} Selected
                      </div>
                      <div className="db-modal-amount">₹{fmt(selectedTotal)}</div>
                      <span className="db-modal-status">Pending</span>
                    </div>

                    <div className="db-modal-body">
                      <h3 className="db-section-title">Payment Details</h3>
                      <table className="db-table">
                        <thead>
                          <tr>
                            <th>Payment For</th>
                            <th>Due Date</th>
                            <th>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedItems.map((p) => (
                            <tr key={p.id}>
                              <td>{p.title}</td>
                              <td className="db-td-meta">{fmtDate(p.due_date)}</td>
                              <td className="db-amount">₹{fmt(p.amount)}</td>
                            </tr>
                          ))}
                          <tr className="db-modal-total-row">
                            <td colSpan={2}>Total Payment</td>
                            <td className="db-amount">₹{fmt(selectedTotal)}</td>
                          </tr>
                        </tbody>
                      </table>

                      <h3 className="db-section-title" style={{ marginTop: 20 }}>Member Details</h3>
                      <div className="db-personal-grid">
                        <div className="db-personal-item">
                          <span className="db-personal-key">Name</span>
                          <span className="db-personal-val">{user?.name}</span>
                        </div>
                        <div className="db-personal-item">
                          <span className="db-personal-key">Member ID</span>
                          <span className="db-personal-val">{member?.member_id || user?.member_id || '—'}</span>
                        </div>
                        {user?.phone && (
                          <div className="db-personal-item">
                            <span className="db-personal-key">Phone</span>
                            <span className="db-personal-val">{user.phone}</span>
                          </div>
                        )}
                        {member?.family_name && (
                          <div className="db-personal-item">
                            <span className="db-personal-key">Family</span>
                            <span className="db-personal-val">{member.family_name}</span>
                          </div>
                        )}
                      </div>

                      {payNowClicked && (
                        <p className="db-modal-note">
                          Online payment is coming soon. For now, please pay this amount at the
                          office, or contact the committee for assistance.
                        </p>
                      )}

                      <button className="db-paynow-btn" onClick={() => setPayNowClicked(true)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="1" y="4" width="22" height="16" rx="2" />
                          <line x1="1" y1="10" x2="23" y2="10" />
                        </svg>
                        Pay Now ₹{fmt(selectedTotal)}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <ThemeProvider theme={chartTheme}>
                {/* ── Row: Payment Overview | Payment History | Monthly Trend ── */}
                <div className="db-grid-3">
                  <div className="db-section" data-tour="member-payment-overview">
                    <h2 className="db-section-title">Payment Overview</h2>
                    {paymentOverviewData.length === 0 ? (
                      <p className="db-empty">No payment data yet.</p>
                    ) : (
                      <>
                        <div className="db-donut-wrap">
                          <div className="db-donut-box">
                            <PieChart
                              series={[{ data: paymentOverviewData, innerRadius: 48, outerRadius: 70, paddingAngle: 2, cornerRadius: 3 }]}
                              width={150} height={150}
                              hideLegend
                            />
                            <div className="db-donut-center">
                              <div className="db-donut-center-value">₹{fmt(myTotal)}</div>
                              <div className="db-donut-center-label">Total Paid</div>
                            </div>
                          </div>
                          <ul className="db-legend-list">
                            <li className="db-legend-item">
                              <span className="db-legend-dot" style={{ background: '#16a34a' }} />
                              <span className="db-legend-label">Total Paid</span>
                              <span className="db-legend-value">₹{fmt(myTotal)}</span>
                            </li>
                            <li className="db-legend-item">
                              <span className="db-legend-dot" style={{ background: '#d97706' }} />
                              <span className="db-legend-label">Pending</span>
                              <span className="db-legend-value">₹{fmt(outstandingDues)}</span>
                            </li>
                            <li className="db-legend-item">
                              <span className="db-legend-dot" style={{ background: '#2563eb' }} />
                              <span className="db-legend-label">Due Cleared</span>
                              <span className="db-legend-value">₹{fmt(duesCleared)}</span>
                            </li>
                          </ul>
                        </div>
                        <button className="db-view-btn" onClick={() => setShowPaymentModal(true)}>View Payment History</button>
                      </>
                    )}
                  </div>

                  <div className="db-section">
                    <div className="db-section-head">
                      <h2 className="db-section-title">Payment History</h2>
                      <button className="db-section-link" onClick={() => setShowPaymentModal(true)}>View All</button>
                    </div>
                    {recentPayments.length === 0 ? (
                      <p className="db-empty">No payments recorded yet.</p>
                    ) : (
                      <div className="db-scroll-table">
                        <table className="db-table">
                          <thead>
                            <tr>
                              <th>Ref</th>
                              <th>Date</th>
                              <th>Category</th>
                              <th>Amount</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {recentPayments.map((p) => (
                              <tr key={p.id}>
                                <td><span className="db-ref">{p.payment_ref}</span></td>
                                <td className="db-td-meta">{fmtDate(p.payment_date)}</td>
                                <td>
                                  {p.category_name}
                                  {p.pending_payment_id && <span className="db-due-cleared-badge">Due Cleared</span>}
                                </td>
                                <td className="db-amount">₹{fmt(p.amount)}</td>
                                <td><span className="db-status-badge db-status-badge--cleared">Cleared</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div className="db-section">
                    <div className="db-section-head">
                      <h2 className="db-section-title">Monthly Contribution Trend</h2>
                      <select className="db-select" value={trendRange} onChange={(e) => setTrendRange(e.target.value)}>
                        <option value="year">This Year</option>
                        <option value="6m">Last 6 Months</option>
                      </select>
                    </div>
                    {trendValues.every((v) => v === 0) ? (
                      <p className="db-empty">No contributions yet.</p>
                    ) : (
                      <BarChart
                        xAxis={[{ scaleType: 'band', data: trendLabels }]}
                        series={[{ data: trendValues, label: 'Contributed', color: '#e8341a' }]}
                        height={190}
                        grid={{ horizontal: true }}
                      />
                    )}
                    <div className="db-trend-footer">
                      <span className="db-trend-footer-label">Total Contribution (This Year)</span>
                      <span className="db-trend-footer-value">₹{fmt(myThisYear)}</span>
                      <Delta value={thisYearDelta} suffix="vs last year" />
                    </div>
                  </div>
                </div>

                {/* ── Row: My Attendance | Recent Attendance | My Rentals ── */}
                <div className="db-grid-3">
                  <div className="db-section" data-tour="member-attendance">
                    <div className="db-section-head">
                      <h2 className="db-section-title">My Attendance</h2>
                      <button className="db-section-link" onClick={() => setShowAttendanceModal(true)}>View All</button>
                    </div>
                    {attendanceDonutData.length === 0 ? (
                      <p className="db-empty">No attendance recorded yet.</p>
                    ) : (
                      <div className="db-donut-wrap">
                        <div className="db-donut-box">
                          <PieChart
                            series={[{ data: attendanceDonutData, innerRadius: 48, outerRadius: 70, paddingAngle: 2, cornerRadius: 3 }]}
                            width={150} height={150}
                            hideLegend
                          />
                          <div className="db-donut-center">
                            <div className="db-donut-center-value">{attendancePct}%</div>
                            <div className="db-donut-center-label">Present</div>
                          </div>
                        </div>
                        <ul className="db-legend-list">
                          <li className="db-legend-item">
                            <span className="db-legend-dot" style={{ background: '#16a34a' }} />
                            <span className="db-legend-label">Present</span>
                            <span className="db-legend-value">{presentCountThisMonth}</span>
                          </li>
                          <li className="db-legend-item">
                            <span className="db-legend-dot" style={{ background: '#e5e7eb' }} />
                            <span className="db-legend-label">Not Marked</span>
                            <span className="db-legend-value">{notMarkedThisMonth}</span>
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="db-section">
                    <div className="db-section-head">
                      <h2 className="db-section-title">Recent Attendance</h2>
                      <button className="db-section-link" onClick={() => setShowAttendanceModal(true)}>View All</button>
                    </div>
                    {recentAttendance.length === 0 ? (
                      <p className="db-empty">No attendance recorded yet.</p>
                    ) : (
                      <div className="db-scroll-table">
                        <table className="db-table">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Check-in</th>
                              <th>Check-out</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {recentAttendance.map((a) => (
                              <tr key={a.id}>
                                <td className="db-td-meta">{fmtDate(a.attendance_date)}</td>
                                <td>{fmtTime(a.check_in_time)}</td>
                                <td>{a.check_out_time ? fmtTime(a.check_out_time) : '—'}</td>
                                <td>
                                  {!a.check_out_time ? (
                                    <span className="db-rental-badge db-rental-badge--active">Still In</span>
                                  ) : a.auto_checked_out ? (
                                    <span className="db-status-badge db-status-badge--auto" title={`Auto-checked out at ${fmtTime(a.check_out_time)}`}>
                                      Checked out by system
                                    </span>
                                  ) : (
                                    <span className="db-status-badge db-status-badge--cleared">Present</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div className="db-section" data-tour="member-rentals">
                    <div className="db-section-head">
                      <h2 className="db-section-title">
                        My Rentals {activeRentals > 0 && <span className="db-title-count">{activeRentals} active</span>}
                      </h2>
                      {rentals.length > 0 && <button className="db-section-link" onClick={() => setShowRentalsModal(true)}>View All</button>}
                    </div>
                    {rentals.length === 0 ? (
                      <div className="db-empty-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 13V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6" />
                          <path d="M2 13h20l-1.6 7.2a2 2 0 0 1-2 1.8H5.6a2 2 0 0 1-2-1.8L2 13z" />
                        </svg>
                        <p className="db-empty-state-title">No rentals on record.</p>
                        <p className="db-empty-state-sub">When you rent any asset, it will appear here.</p>
                      </div>
                    ) : (
                      <div className="db-scroll-table">
                        <table className="db-table">
                          <thead>
                            <tr>
                              <th>Ref</th>
                              <th>Item</th>
                              <th>Period</th>
                              <th>Status</th>
                              <th>Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {recentRentals.map((r) => (
                              <tr key={r.id}>
                                <td><span className="db-ref">{r.rental_ref}</span></td>
                                <td>{r.product_name}</td>
                                <td className="db-td-meta">{fmtDate(r.start_date)} – {fmtDate(r.end_date)}</td>
                                <td>
                                  <span className={`db-rental-badge db-rental-badge--${r.status}`}>
                                    {RENTAL_STATUS_LABEL[r.status] ?? r.status}
                                  </span>
                                </td>
                                <td className="db-amount">₹{fmt(r.amount)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </ThemeProvider>
            </div>
          </div>
        )}
      </div>

      {/* ── View All: Payment History ── */}
      {showPaymentModal && (
        <div className="db-modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="db-modal db-modal--table" onClick={(e) => e.stopPropagation()}>
            <button className="db-modal-close" onClick={() => setShowPaymentModal(false)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <div className="db-modal-body db-modal-body--table">
              <h3 className="db-section-title">Payment History</h3>
              {paymentHistory.length === 0 ? (
                <p className="db-empty">No payments recorded yet.</p>
              ) : (
                <div className="db-scroll-table db-scroll-table--tall">
                  <table className="db-table">
                    <thead>
                      <tr><th>Ref</th><th>Date</th><th>Category</th><th>Type</th><th>Amount</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {paymentHistory.map((p) => (
                        <tr key={p.id}>
                          <td><span className="db-ref">{p.payment_ref}</span></td>
                          <td className="db-td-meta">{fmtDate(p.payment_date)}</td>
                          <td>
                            {p.category_name}
                            {p.pending_payment_id && <span className="db-due-cleared-badge">Due Cleared</span>}
                          </td>
                          <td><span className={`db-type-badge db-type-badge--${p.payment_type}`}>{p.payment_type === 'qr' ? 'QR' : 'Cash'}</span></td>
                          <td className="db-amount">₹{fmt(p.amount)}</td>
                          <td><span className="db-status-badge db-status-badge--cleared">Cleared</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── View All: Attendance ── */}
      {showAttendanceModal && (
        <div className="db-modal-overlay" onClick={() => setShowAttendanceModal(false)}>
          <div className="db-modal db-modal--table" onClick={(e) => e.stopPropagation()}>
            <button className="db-modal-close" onClick={() => setShowAttendanceModal(false)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <div className="db-modal-body db-modal-body--table">
              <h3 className="db-section-title">Attendance History</h3>
              {attendance.length === 0 ? (
                <p className="db-empty">No attendance recorded yet.</p>
              ) : (
                <div className="db-scroll-table db-scroll-table--tall">
                  <table className="db-table">
                    <thead>
                      <tr><th>Date</th><th>Check-in</th><th>Check-out</th><th>Duration</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {attendance.map((a) => (
                        <tr key={a.id}>
                          <td className="db-td-meta">{fmtDate(a.attendance_date)}</td>
                          <td>{fmtTime(a.check_in_time)}</td>
                          <td>{a.check_out_time ? fmtTime(a.check_out_time) : '—'}</td>
                          <td className="db-td-meta">{a.check_out_time ? fmtDuration(new Date(a.check_out_time) - new Date(a.check_in_time)) : '—'}</td>
                          <td>
                            {!a.check_out_time ? (
                              <span className="db-rental-badge db-rental-badge--active">Still In</span>
                            ) : a.auto_checked_out ? (
                              <span className="db-status-badge db-status-badge--auto" title={`Auto-checked out at ${fmtTime(a.check_out_time)}`}>
                                Checked out by system
                              </span>
                            ) : (
                              <span className="db-status-badge db-status-badge--cleared">Present</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── View All: Rentals ── */}
      {showRentalsModal && (
        <div className="db-modal-overlay" onClick={() => setShowRentalsModal(false)}>
          <div className="db-modal db-modal--table" onClick={(e) => e.stopPropagation()}>
            <button className="db-modal-close" onClick={() => setShowRentalsModal(false)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <div className="db-modal-body db-modal-body--table">
              <h3 className="db-section-title">My Rentals</h3>
              <div className="db-scroll-table db-scroll-table--tall">
                <table className="db-table">
                  <thead>
                    <tr><th>Ref</th><th>Item</th><th>Period</th><th>Status</th><th>Amount</th></tr>
                  </thead>
                  <tbody>
                    {rentals.map((r) => (
                      <tr key={r.id}>
                        <td><span className="db-ref">{r.rental_ref}</span></td>
                        <td>{r.product_name}</td>
                        <td className="db-td-meta">{fmtDate(r.start_date)} – {fmtDate(r.end_date)}</td>
                        <td><span className={`db-rental-badge db-rental-badge--${r.status}`}>{RENTAL_STATUS_LABEL[r.status] ?? r.status}</span></td>
                        <td className="db-amount">₹{fmt(r.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── View All: Login History ── */}
      {showLoginHistoryModal && (
        <div className="db-modal-overlay" onClick={() => setShowLoginHistoryModal(false)}>
          <div className="db-modal db-modal--table" onClick={(e) => e.stopPropagation()}>
            <button className="db-modal-close" onClick={() => setShowLoginHistoryModal(false)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <div className="db-modal-body db-modal-body--table">
              <h3 className="db-section-title">Login History</h3>
              <p className="db-empty" style={{ marginBottom: 12 }}>
                If you don't recognize one of these, change your password right away.
              </p>
              {loginHistory.length === 0 ? (
                <p className="db-empty">No login activity recorded yet.</p>
              ) : (
                <div className="db-scroll-table db-scroll-table--tall">
                  <table className="db-table">
                    <thead>
                      <tr><th>Date &amp; Time</th><th>Status</th><th>IP Address</th></tr>
                    </thead>
                    <tbody>
                      {loginHistory.map((l) => (
                        <tr key={l.id}>
                          <td className="db-td-meta">{fmtDate(l.created_at)}, {fmtTime(l.created_at)}</td>
                          <td>
                            {l.status === 'success' ? (
                              <span className="db-status-badge db-status-badge--cleared">Success</span>
                            ) : (
                              <span className="db-rental-badge db-rental-badge--cancelled">Failed</span>
                            )}
                          </td>
                          <td className="db-td-meta">{l.ip_address || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showChangePassword && <ResetPasswordModal onClose={() => setShowChangePassword(false)} />}
      {showEditProfile && member && (
        <EditProfileModal
          member={member}
          onClose={() => setShowEditProfile(false)}
          onSaved={() => { setShowEditProfile(false); loadAll(); }}
        />
      )}
    </div>
  );
}

export default Dashboard;
