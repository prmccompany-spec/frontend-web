import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SiteTour from '../../components/SiteTour/SiteTour';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { PieChart } from '@mui/x-charts/PieChart';
import { BarChart } from '@mui/x-charts/BarChart';
import { Gauge, gaugeClasses } from '@mui/x-charts/Gauge';
import { SparkLineChart } from '@mui/x-charts/SparkLineChart';
import { getMembers, getPendingPayments } from '../../services/memberService';
import { getPaymentSummary, getPayments } from '../../services/paymentService';
import { getExpenses } from '../../services/expenseService';
import { getRentals, getRentalProducts } from '../../services/rentalService';
import { getAttendance } from '../../services/attendanceService';
import './AdminPanel.css';

const fmt = (val) =>
  Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtInt = (val) => Number(val || 0).toLocaleString('en-IN');

const asDate = (d) => (d instanceof Date ? d : new Date(d));

const fmtDateKey = (d) => {
  const dt = asDate(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
};

const monthKey = (d) => {
  const dt = asDate(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
};

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return fmtDateKey(d);
};

const today = () => fmtDateKey(new Date());

const pctChange = (curr, prev) => (prev ? ((curr - prev) / prev) * 100 : null);

const fmtTime = (d) => (d ? asDate(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—');
const fmtShortDate = (d) => (d ? asDate(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—');

const ATTENDANCE_TREND_DAYS = 14;
const RENTAL_STATUS_LABEL = { active: 'Active', returned: 'Returned', cancelled: 'Cancelled' };
const RENTAL_STATUS_COLOR = { active: '#2563eb', returned: '#059669', cancelled: '#b91c1c' };
const STATUS_COLOR = { active: '#16a34a', inactive: '#eab308', deceased: '#dc2626' };
const EXPENSE_CAT_COLORS = ['#dc3545', '#d97706', '#7c3aed', '#2563eb', '#059669'];

function initials(name = '') {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

// Charts inherit the app's font and pick up the brand red as MUI's primary
// color, so they read as part of the same dashboard rather than bolted-on.
const chartTheme = createTheme({
  typography: { fontFamily: 'inherit' },
  palette: { primary: { main: '#dc3545' } },
});

const ADMIN_TOUR_STEPS = [
  {
    target: '[data-tour="admin-nav-dashboard"]',
    title: 'Welcome to the Admin Panel',
    content: 'This is your Dashboard — a live overview of members, payments, dues, expenses and attendance. Let\'s walk through the key areas.',
    icon: 'grid',
    disableBeacon: true,
    placement: 'right',
  },
  {
    target: '[data-tour="admin-nav-members"]',
    title: 'Members',
    content: 'View, search, filter, edit and manage every member from here — including their branch, status and QR code.',
    icon: 'users',
    placement: 'right',
  },
  {
    target: '[data-tour="admin-nav-register"]',
    title: 'Register Member',
    content: 'Add a brand new member to the registry, complete with address, photo and any pending dues.',
    icon: 'userPlus',
    placement: 'right',
  },
  {
    target: '[data-tour="admin-nav-settings"]',
    title: 'Settings',
    content: 'Configure the lookup lists used across the app — user types, member statuses, branches, payment and expense categories.',
    icon: 'settings',
    placement: 'right',
  },
  {
    target: '[data-tour="admin-kpi-members"]',
    title: 'Total Members',
    content: 'Total member count with this month\'s growth and a quick status breakdown (Active / Inactive / etc).',
    icon: 'users',
  },
  {
    target: '[data-tour="admin-kpi-payments"]',
    title: 'Payments',
    content: 'Money received this month vs. what\'s still pending, with a 6-month trend at a glance.',
    icon: 'rupee',
  },
  {
    target: '[data-tour="admin-kpi-dues"]',
    title: 'Due Clearance',
    content: 'Tracks outstanding dues and how many members are overdue — click through to the full Due Tracker.',
    icon: 'alertCircle',
  },
  {
    target: '[data-tour="admin-chart-status"]',
    title: 'Member Status Overview',
    content: 'A breakdown of your membership by status, so you can see active vs. inactive at a glance.',
    icon: 'pieChart',
  },
  {
    target: '[data-tour="admin-chart-branch"]',
    title: 'Members by Branch',
    content: 'Ranked member counts per branch — the newest addition, so you can see how membership is distributed geographically.',
    icon: 'barChart',
  },
  {
    target: '[data-tour="admin-tour-btn"]',
    title: 'Replay Anytime',
    content: 'You can restart this tour anytime by clicking this button again.',
    icon: 'compass',
  },
];

function Delta({ value, suffixCount }) {
  if (value === null || Number.isNaN(value)) return null;
  const up = value >= 0;
  return (
    <span className={`ap-delta ${up ? 'ap-delta--up' : 'ap-delta--down'}`}>
      {up ? '▲' : '▼'} {suffixCount != null && `${suffixCount} `}({Math.abs(value).toFixed(1)}%) this month
    </span>
  );
}

function Ring({ value, total, color, size = 60 }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <Gauge
      value={pct}
      valueMax={100}
      width={size}
      height={size}
      innerRadius="75%"
      outerRadius="100%"
      text={({ value: v }) => `${v}%`}
      sx={{
        [`& .${gaugeClasses.valueArc}`]: { fill: color },
        [`& .${gaugeClasses.valueText}`]: { fontSize: 12, fontWeight: 700 },
      }}
    />
  );
}

function AdminPanel() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [paymentSummary, setPaymentSummary] = useState(null);
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [allDues, setAllDues] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [rentalProducts, setRentalProducts] = useState([]);
  const [attendanceRange, setAttendanceRange] = useState([]);
  const [runTour, setRunTour] = useState(false);
  const [tourRestartToken, setTourRestartToken] = useState(0);

  useEffect(() => {
    Promise.all([
      getMembers().then((res) => res.data?.data ?? []).catch(() => []),
      getPaymentSummary().catch(() => null),
      getPayments().then((res) => res.data ?? []).catch(() => []),
      getExpenses().then((res) => res.data ?? []).catch(() => []),
      getPendingPayments().then((res) => res.data?.data ?? []).catch(() => []),
      getRentals().then((res) => res.data ?? []).catch(() => []),
      getRentalProducts().catch(() => []),
      getAttendance({ from: daysAgo(ATTENDANCE_TREND_DAYS - 1), to: today() })
        .then((res) => res.data ?? []).catch(() => []),
    ])
      .then(([m, ps, pay, exp, dues, r, rp, att]) => {
        setMembers(m);
        setPaymentSummary(ps);
        setPayments(pay);
        setExpenses(exp);
        setAllDues(dues);
        setRentals(r);
        setRentalProducts(rp);
        setAttendanceRange(att);
      })
      .finally(() => setLoading(false));
  }, []);

  const startTour = () => {
    setTourRestartToken((t) => t + 1);
    setRunTour(true);
  };

  const now = new Date();
  const thisMonth = monthKey(now);
  const lastMonth = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));

  // ── Members ──
  const totalMembers = members.length;
  const statusCounts = members.reduce((acc, m) => {
    const label = m.status_name || (m.is_active ? 'Active' : 'Inactive');
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});
  const activeCount = Object.entries(statusCounts).find(([l]) => l.toLowerCase() === 'active')?.[1] ?? 0;
  const newMembersThisMonth = members.filter((m) => m.created_at && monthKey(m.created_at) === thisMonth).length;
  const memberGrowthPct = totalMembers ? (newMembersThisMonth / totalMembers) * 100 : null;
  const statusPieData = Object.entries(statusCounts).map(([label, count], i) => ({
    id: i, value: count, label, color: STATUS_COLOR[label.toLowerCase()] || '#64748b',
  }));

  // ── Payments ──
  const paymentsThisMonth = payments.filter((p) => monthKey(p.payment_date) === thisMonth).reduce((s, p) => s + Number(p.amount), 0);
  const paymentsLastMonth = payments.filter((p) => monthKey(p.payment_date) === lastMonth).reduce((s, p) => s + Number(p.amount), 0);
  const paymentsDelta = pctChange(paymentsThisMonth, paymentsLastMonth);
  const dueCollectedThisMonth = payments
    .filter((p) => p.pending_payment_id && monthKey(p.payment_date) === thisMonth)
    .reduce((s, p) => s + Number(p.amount), 0);

  // ── Expenses ──
  const expensesThisMonth = expenses.filter((e) => monthKey(e.created_at) === thisMonth).reduce((s, e) => s + Number(e.amount), 0);
  const expensesLastMonth = expenses.filter((e) => monthKey(e.created_at) === lastMonth).reduce((s, e) => s + Number(e.amount), 0);
  const expensesDelta = pctChange(expensesThisMonth, expensesLastMonth);
  const expensesThisYear = expenses.filter((e) => asDate(e.created_at).getFullYear() === now.getFullYear()).reduce((s, e) => s + Number(e.amount), 0);
  const totalExpensesAllTime = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const netThisMonth = paymentsThisMonth - expensesThisMonth;
  const expensesByCategory = Object.entries(
    expenses.reduce((acc, e) => {
      acc[e.category_name] = (acc[e.category_name] || 0) + Number(e.amount);
      return acc;
    }, {})
  )
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
  const expenseCatMax = expensesByCategory.length > 0 ? expensesByCategory[0].total : 1;

  // ── Members by Branch ──
  const branchCounts = Object.entries(
    members.reduce((acc, m) => {
      const label = m.branch_name || 'Unassigned';
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {})
  )
    .map(([branch, total]) => ({ branch, total }))
    .sort((a, b) => b.total - a.total);
  const branchMax = branchCounts.length > 0 ? branchCounts[0].total : 1;

  // ── Dues ──
  const pendingOnly = allDues.filter((d) => d.status === 'pending');
  const outstandingTotal = pendingOnly.reduce((s, d) => s + Number(d.amount), 0);
  const totalDueEverAssigned = allDues.reduce((s, d) => s + Number(d.amount), 0);
  const overdueDues = pendingOnly.filter((d) => d.due_date && asDate(d.due_date) < now);
  const overdueMembers = new Set(overdueDues.map((d) => d.member_id)).size;
  const overduePct = pendingOnly.length ? Math.round((overdueDues.length / pendingOnly.length) * 100) : 0;

  // ── Attendance ──
  const attendanceToday = attendanceRange.filter((a) => fmtDateKey(a.attendance_date) === today());
  const checkedInToday = new Set(attendanceToday.map((a) => a.member_id)).size;
  const notCheckedIn = Math.max(activeCount - checkedInToday, 0);
  const recentActivity = attendanceToday
    .map((a) => ({
      id: a.id,
      name: a.member_name,
      time: a.check_out_time || a.check_in_time,
      type: a.check_out_time ? 'OUT' : 'IN',
    }))
    .sort((a, b) => asDate(b.time) - asDate(a.time))
    .slice(0, 5);

  const attendanceTrend = Array.from({ length: ATTENDANCE_TREND_DAYS }, (_, i) => {
    const dateKey = daysAgo(ATTENDANCE_TREND_DAYS - 1 - i);
    const dayRecords = attendanceRange.filter((a) => fmtDateKey(a.attendance_date) === dateKey);
    return { label: fmtShortDate(dateKey), count: new Set(dayRecords.map((a) => a.member_id)).size };
  });

  // ── Rentals ──
  const activeRentalsCount = rentals.filter((r) => r.status === 'active').length;
  const rentalsThisMonth = rentals.filter((r) => monthKey(r.created_at) === thisMonth);
  const rentalRevenueThisMonth = rentalsThisMonth.reduce((s, r) => s + Number(r.amount), 0);
  const rentalRevenueLastMonth = rentals.filter((r) => monthKey(r.created_at) === lastMonth).reduce((s, r) => s + Number(r.amount), 0);
  const rentalRevenueDelta = pctChange(rentalRevenueThisMonth, rentalRevenueLastMonth);
  const rentedProductIds = new Set(rentals.filter((r) => r.status === 'active').map((r) => r.product_id));
  const availableProducts = rentalProducts.filter((p) => p.is_active && !rentedProductIds.has(p.id)).length;
  const inactiveProducts = rentalProducts.filter((p) => !p.is_active).length;
  const recentRentals = [...rentals].sort((a, b) => asDate(b.created_at) - asDate(a.created_at)).slice(0, 5);
  const rentalDailyTrend = Array.from({ length: ATTENDANCE_TREND_DAYS }, (_, i) => {
    const dateKey = daysAgo(ATTENDANCE_TREND_DAYS - 1 - i);
    return rentals.filter((r) => fmtDateKey(r.created_at) === dateKey).reduce((s, r) => s + Number(r.amount), 0);
  });

  // ── Payments Overview: Received vs Pending, last 6 months ──
  const monthsWindow = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { key: monthKey(d), label: d.toLocaleDateString('en-IN', { month: 'short' }) };
  });
  const receivedByMonth = monthsWindow.map(({ key }) => payments.filter((p) => monthKey(p.payment_date) === key).reduce((s, p) => s + Number(p.amount), 0));
  const pendingByMonth = monthsWindow.map(({ key }) => pendingOnly.filter((d) => d.due_date && monthKey(d.due_date) === key).reduce((s, d) => s + Number(d.amount), 0));
  const expensesByMonth = monthsWindow.map(({ key }) => expenses.filter((e) => monthKey(e.created_at) === key).reduce((s, e) => s + Number(e.amount), 0));

  return (
    <div className="admin-content">
      <div className="admin-page-header ap-dash-header">
        <div>
          <h1 className="admin-page-title">Dashboard</h1>
          <p className="admin-page-subtitle">Overview of members, payments, dues, expenses, rentals and attendance</p>
        </div>
        <div className="ap-dash-header-right">
          <button className="tour-btn" data-tour="admin-tour-btn" onClick={startTour}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
            </svg>
            Take a Tour
          </button>
          <div className="ap-date-chip">
            {now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>

      <SiteTour
        tourKey="admin"
        steps={ADMIN_TOUR_STEPS}
        run={runTour}
        restartToken={tourRestartToken}
        onClose={() => setRunTour(false)}
      />

      {loading ? (
        <div className="ap-skeleton-row">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="ap-skeleton" />)}
        </div>
      ) : (
        <ThemeProvider theme={chartTheme}>
          {/* ══════════ KPI ROW ══════════ */}
          <div className="ap-kpi-grid">
            <div className="ap-kpi-card" data-tour="admin-kpi-members" onClick={() => navigate('/admin/members')}>
              <div className="ap-kpi-top">
                <div>
                  <div className="ap-kpi-icon ap-kpi-icon--blue">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <div className="ap-kpi-label">Total Members</div>
                  <div className="ap-kpi-value">{fmtInt(totalMembers)}</div>
                  <Delta value={memberGrowthPct} suffixCount={newMembersThisMonth} />
                </div>
                <Ring value={activeCount} total={totalMembers} color="#2563eb" />
              </div>
              <div className="ap-kpi-breakdown">
                {Object.entries(statusCounts).slice(0, 3).map(([label, count]) => (
                  <div className="ap-kpi-breakdown-item" key={label}>
                    <span className="ap-kpi-breakdown-value" style={{ color: STATUS_COLOR[label.toLowerCase()] || '#64748b' }}>{fmtInt(count)}</span>
                    <span className="ap-kpi-breakdown-label">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="ap-kpi-card" data-tour="admin-kpi-payments" onClick={() => navigate('/admin/reports')}>
              <div className="ap-kpi-top">
                <div>
                  <div className="ap-kpi-icon ap-kpi-icon--green">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  </div>
                  <div className="ap-kpi-label">Payments (This Month)</div>
                  <div className="ap-kpi-value">₹{fmt(paymentsThisMonth)}</div>
                  <Delta value={paymentsDelta} />
                </div>
                <div className="ap-kpi-spark">
                  <SparkLineChart data={monthsWindow.map((_, i) => receivedByMonth[i])} height={48} width={90} color="#059669" area />
                </div>
              </div>
              <div className="ap-kpi-breakdown ap-kpi-breakdown--2">
                <div className="ap-kpi-breakdown-item">
                  <span className="ap-kpi-breakdown-value" style={{ color: '#059669' }}>₹{fmt(paymentsThisMonth)}</span>
                  <span className="ap-kpi-breakdown-label">Received</span>
                </div>
                <div className="ap-kpi-breakdown-item">
                  <span className="ap-kpi-breakdown-value" style={{ color: '#d97706' }}>₹{fmt(outstandingTotal)}</span>
                  <span className="ap-kpi-breakdown-label">Pending</span>
                </div>
              </div>
            </div>

            <div className="ap-kpi-card" onClick={() => navigate('/admin/expenses')}>
              <div className="ap-kpi-top">
                <div>
                  <div className="ap-kpi-icon ap-kpi-icon--rose">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                      <line x1="9" y1="7" x2="15" y2="7" /><line x1="9" y1="11" x2="15" y2="11" />
                    </svg>
                  </div>
                  <div className="ap-kpi-label">Expenses (This Month)</div>
                  <div className="ap-kpi-value">₹{fmt(expensesThisMonth)}</div>
                  <Delta value={expensesDelta} />
                </div>
                <div className="ap-kpi-spark">
                  <SparkLineChart data={monthsWindow.map((_, i) => expensesByMonth[i])} height={48} width={90} color="#dc2626" area />
                </div>
              </div>
              <div className="ap-kpi-breakdown ap-kpi-breakdown--2">
                <div className="ap-kpi-breakdown-item">
                  <span className="ap-kpi-breakdown-value" style={{ color: '#dc2626' }}>₹{fmt(expensesThisMonth)}</span>
                  <span className="ap-kpi-breakdown-label">Spent</span>
                </div>
                <div className="ap-kpi-breakdown-item">
                  <span className="ap-kpi-breakdown-value" style={{ color: netThisMonth >= 0 ? '#059669' : '#dc2626' }}>₹{fmt(Math.abs(netThisMonth))}</span>
                  <span className="ap-kpi-breakdown-label">Net {netThisMonth >= 0 ? 'Surplus' : 'Deficit'}</span>
                </div>
              </div>
            </div>

            <div className="ap-kpi-card" data-tour="admin-kpi-dues" onClick={() => navigate('/admin/payments/due-tracker')}>
              <div className="ap-kpi-top">
                <div>
                  <div className="ap-kpi-icon ap-kpi-icon--amber">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </div>
                  <div className="ap-kpi-label">Due Clearance</div>
                  <div className="ap-kpi-value">₹{fmt(outstandingTotal)}</div>
                  <span className="ap-delta-neutral">{overdueMembers} member{overdueMembers !== 1 ? 's' : ''} overdue</span>
                </div>
                <Ring value={overdueDues.length} total={pendingOnly.length} color="#d97706" />
              </div>
              <div className="ap-kpi-breakdown ap-kpi-breakdown--2">
                <div className="ap-kpi-breakdown-item">
                  <span className="ap-kpi-breakdown-value">₹{fmt(outstandingTotal)}</span>
                  <span className="ap-kpi-breakdown-label">Total Due</span>
                </div>
                <div className="ap-kpi-breakdown-item">
                  <span className="ap-kpi-breakdown-value" style={{ color: '#dc2626' }}>{overdueMembers}</span>
                  <span className="ap-kpi-breakdown-label">Overdue Members</span>
                </div>
              </div>
            </div>

            <div className="ap-kpi-card" onClick={() => navigate('/admin/attendance/report')}>
              <div className="ap-kpi-top">
                <div>
                  <div className="ap-kpi-icon ap-kpi-icon--purple">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                  <div className="ap-kpi-label">Today's Attendance</div>
                  <div className="ap-kpi-value">{checkedInToday} / {activeCount}</div>
                  <span className="ap-delta-neutral">{activeCount ? Math.round((checkedInToday / activeCount) * 100) : 0}% Present</span>
                </div>
                <Ring value={checkedInToday} total={activeCount} color="#7c3aed" />
              </div>
              <div className="ap-kpi-breakdown ap-kpi-breakdown--2">
                <div className="ap-kpi-breakdown-item">
                  <span className="ap-kpi-breakdown-value" style={{ color: '#7c3aed' }}>{checkedInToday}</span>
                  <span className="ap-kpi-breakdown-label">Checked In</span>
                </div>
                <div className="ap-kpi-breakdown-item">
                  <span className="ap-kpi-breakdown-value">{notCheckedIn}</span>
                  <span className="ap-kpi-breakdown-label">Not Checked In</span>
                </div>
              </div>
            </div>
          </div>

          {/* ══════════ ROW 2 ══════════ */}
          <div className="ap-row-3">
            <div className="ap-chart-card" data-tour="admin-chart-status">
              <div className="ap-panel-header"><span>Member Status Overview</span></div>
              <div className="ap-donut-wrap">
                <div className="ap-donut-box">
                  <PieChart
                    series={[{ data: statusPieData, innerRadius: 55, outerRadius: 80, paddingAngle: 2, cornerRadius: 3 }]}
                    width={180} height={180}
                    hideLegend
                  />
                  <div className="ap-donut-center">
                    <div className="ap-donut-center-value">{fmtInt(totalMembers)}</div>
                    <div className="ap-donut-center-label">Total Members</div>
                  </div>
                </div>
                <ul className="ap-legend-list">
                  {Object.entries(statusCounts).map(([label, count]) => (
                    <li className="ap-legend-item" key={label}>
                      <span className="ap-legend-dot" style={{ background: STATUS_COLOR[label.toLowerCase()] || '#64748b' }} />
                      <span className="ap-legend-label">{label}</span>
                      <span className="ap-legend-count">{count} ({totalMembers ? Math.round((count / totalMembers) * 1000) / 10 : 0}%)</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="ap-chart-card">
              <div className="ap-panel-header"><span>Cash Flow Overview</span><span className="ap-panel-tag">Last 6 Months</span></div>
              <BarChart
                xAxis={[{ scaleType: 'band', data: monthsWindow.map((m) => m.label) }]}
                series={[
                  { data: receivedByMonth, label: 'Received', color: '#16a34a' },
                  { data: expensesByMonth, label: 'Expenses', color: '#dc2626' },
                  { data: pendingByMonth, label: 'Pending', color: '#f59e0b' },
                ]}
                height={230}
                grid={{ horizontal: true }}
              />
            </div>

            <div className="ap-chart-card">
              <div className="ap-panel-header">
                <span>Due Clearance Summary</span>
                <button className="ap-panel-link" onClick={() => navigate('/admin/payments/due-tracker')}>View Report</button>
              </div>
              <ul className="ap-info-list">
                <li className="ap-info-row">
                  <span className="ap-info-icon ap-info-icon--amber">₹</span>
                  <span className="ap-info-label">Total Due Amount</span>
                  <span className="ap-info-value">₹{fmt(outstandingTotal)}</span>
                </li>
                <li className="ap-info-row">
                  <span className="ap-info-icon ap-info-icon--green">✓</span>
                  <span className="ap-info-label">Due Collected (This Month)</span>
                  <span className="ap-info-value">₹{fmt(dueCollectedThisMonth)}</span>
                </li>
                <li className="ap-info-row">
                  <span className="ap-info-icon ap-info-icon--red">!</span>
                  <span className="ap-info-label">Remaining Due</span>
                  <span className="ap-info-value">₹{fmt(outstandingTotal)}</span>
                </li>
                <li className="ap-info-row">
                  <span className="ap-info-icon ap-info-icon--purple">⚑</span>
                  <span className="ap-info-label">Overdue Members</span>
                  <span className="ap-info-value">{overdueMembers}</span>
                </li>
              </ul>
              <div className="ap-info-footnote">Total ever assigned: ₹{fmt(totalDueEverAssigned)} · {overduePct}% of pending dues are overdue</div>
            </div>
          </div>

          {/* ══════════ EXPENSES ROW ══════════ */}
          <div className="ap-row-2">
            <div className="ap-chart-card">
              <div className="ap-panel-header">
                <span>Expenses by Category</span>
                <button className="ap-panel-link" onClick={() => navigate('/admin/expenses')}>View Expense Book</button>
              </div>
              {expensesByCategory.length === 0 ? (
                <div className="ap-chart-empty ap-chart-empty--sm">No expenses recorded yet.</div>
              ) : (
                <div className="ap-cat-list">
                  {expensesByCategory.map((row, i) => (
                    <div key={row.category} className="ap-cat-row">
                      <div className="ap-cat-top">
                        <span className="ap-cat-name">{row.category}</span>
                        <span className="ap-cat-amount">₹{fmt(row.total)}</span>
                      </div>
                      <div className="ap-bar-track">
                        <div
                          className="ap-bar-fill"
                          style={{ width: `${(row.total / expenseCatMax) * 100}%`, background: EXPENSE_CAT_COLORS[i % EXPENSE_CAT_COLORS.length] }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="ap-chart-card">
              <div className="ap-panel-header">
                <span>Expense Summary</span>
                <button className="ap-panel-link" onClick={() => navigate('/admin/expenses')}>View Report</button>
              </div>
              <ul className="ap-info-list">
                <li className="ap-info-row">
                  <span className="ap-info-icon ap-info-icon--red">₹</span>
                  <span className="ap-info-label">This Month</span>
                  <span className="ap-info-value">₹{fmt(expensesThisMonth)}</span>
                </li>
                <li className="ap-info-row">
                  <span className="ap-info-icon ap-info-icon--amber">Σ</span>
                  <span className="ap-info-label">This Year</span>
                  <span className="ap-info-value">₹{fmt(expensesThisYear)}</span>
                </li>
                <li className="ap-info-row">
                  <span className="ap-info-icon ap-info-icon--purple">∑</span>
                  <span className="ap-info-label">All Time</span>
                  <span className="ap-info-value">₹{fmt(totalExpensesAllTime)}</span>
                </li>
                <li className="ap-info-row">
                  <span className="ap-info-icon ap-info-icon--green">#</span>
                  <span className="ap-info-label">Total Entries</span>
                  <span className="ap-info-value">{fmtInt(expenses.length)}</span>
                </li>
              </ul>
              <div className="ap-info-footnote">
                Net {netThisMonth >= 0 ? 'surplus' : 'deficit'} this month: ₹{fmt(Math.abs(netThisMonth))} (received minus spent)
              </div>
            </div>
          </div>

          {/* ══════════ MEMBERS BY BRANCH ══════════ */}
          <div className="ap-chart-card ap-full-row" data-tour="admin-chart-branch">
            <div className="ap-panel-header">
              <span>Members by Branch</span>
              <button className="ap-panel-link" onClick={() => navigate('/admin/members')}>View Members</button>
            </div>
            {branchCounts.length === 0 ? (
              <div className="ap-chart-empty ap-chart-empty--sm">No branch data available.</div>
            ) : (
              <div className="ap-cat-list ap-cat-list--scroll">
                {branchCounts.map((row, i) => (
                  <div key={row.branch} className="ap-cat-row">
                    <div className="ap-cat-top">
                      <span className="ap-cat-name">{row.branch}</span>
                      <span className="ap-cat-amount">{fmtInt(row.total)}</span>
                    </div>
                    <div className="ap-bar-track">
                      <div
                        className="ap-bar-fill"
                        style={{ width: `${(row.total / branchMax) * 100}%`, background: EXPENSE_CAT_COLORS[i % EXPENSE_CAT_COLORS.length] }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ══════════ ROW 3 ══════════ */}
          <div className="ap-row-3">
            <div className="ap-chart-card">
              <div className="ap-panel-header">
                <span>Today's Attendance</span>
                <button className="ap-panel-link" onClick={() => navigate('/admin/attendance/report')}>View All</button>
              </div>
              <div className="ap-attendance-top">
                <Gauge
                  value={activeCount ? Math.round((checkedInToday / activeCount) * 100) : 0}
                  valueMax={100} width={100} height={100}
                  innerRadius="75%" outerRadius="100%"
                  text={({ value }) => `${value}%`}
                  sx={{ [`& .${gaugeClasses.valueArc}`]: { fill: '#7c3aed' }, [`& .${gaugeClasses.valueText}`]: { fontSize: 18, fontWeight: 800 } }}
                />
                <div className="ap-attendance-counts">
                  <div><span className="ap-attendance-num" style={{ color: '#7c3aed' }}>{checkedInToday}</span> Checked In</div>
                  <div><span className="ap-attendance-num">{notCheckedIn}</span> Not Checked In</div>
                </div>
              </div>
              <div className="ap-panel-subheader">Recent Check-ins</div>
              {recentActivity.length === 0 ? (
                <div className="ap-chart-empty ap-chart-empty--sm">No activity yet today.</div>
              ) : (
                <ul className="ap-checkin-list">
                  {recentActivity.map((a) => (
                    <li className="ap-checkin-item" key={a.id}>
                      <span className="ap-checkin-avatar">{initials(a.name)}</span>
                      <span className="ap-checkin-name">{a.name}</span>
                      <span className="ap-checkin-time">{fmtTime(a.time)}</span>
                      <span className={`ap-badge ap-badge--${a.type === 'IN' ? 'in' : 'out'}`}>{a.type}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="ap-chart-card">
              <div className="ap-panel-header">
                <span>Assets on Rent</span>
                <button className="ap-panel-link" onClick={() => navigate('/admin/rentals/products')}>View All Assets</button>
              </div>
              <div className="ap-asset-tiles">
                <div className="ap-asset-tile">
                  <span className="ap-asset-tile-icon ap-asset-tile-icon--blue">▣</span>
                  <span className="ap-asset-tile-value">{rentalProducts.length}</span>
                  <span className="ap-asset-tile-label">Total Assets</span>
                </div>
                <div className="ap-asset-tile">
                  <span className="ap-asset-tile-icon ap-asset-tile-icon--green">↗</span>
                  <span className="ap-asset-tile-value">{activeRentalsCount}</span>
                  <span className="ap-asset-tile-label">Rented Out</span>
                </div>
                <div className="ap-asset-tile">
                  <span className="ap-asset-tile-icon ap-asset-tile-icon--amber">◷</span>
                  <span className="ap-asset-tile-value">{availableProducts}</span>
                  <span className="ap-asset-tile-label">Available</span>
                </div>
                <div className="ap-asset-tile">
                  <span className="ap-asset-tile-icon ap-asset-tile-icon--red">✕</span>
                  <span className="ap-asset-tile-value">{inactiveProducts}</span>
                  <span className="ap-asset-tile-label">Inactive</span>
                </div>
              </div>
              <div className="ap-panel-subheader">Recent Rentals</div>
              {recentRentals.length === 0 ? (
                <div className="ap-chart-empty ap-chart-empty--sm">No rentals recorded yet.</div>
              ) : (
                <div className="ap-mini-table-wrap">
                  <table className="ap-mini-table">
                    <thead>
                      <tr><th>Asset</th><th>Rented To</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {recentRentals.map((r) => (
                        <tr key={r.id}>
                          <td>{r.product_name}</td>
                          <td>{r.member_name}</td>
                          <td>
                            <span className={`ap-rental-badge ap-rental-badge--${r.status}`}>
                              {RENTAL_STATUS_LABEL[r.status] ?? r.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="ap-chart-card">
              <div className="ap-panel-header">
                <span>Rental Revenue (This Month)</span>
                <button className="ap-panel-link" onClick={() => navigate('/admin/rentals/history')}>View Report</button>
              </div>
              <div className="ap-kpi-value ap-kpi-value--lg">₹{fmt(rentalRevenueThisMonth)}</div>
              <Delta value={rentalRevenueDelta} />
              <div className="ap-sparkline-wrap">
                <SparkLineChart
                  data={rentalDailyTrend}
                  height={140}
                  color="#0d9488"
                  area
                  xAxis={{ data: attendanceTrend.map((d) => d.label), scaleType: 'point' }}
                  showTooltip
                />
              </div>
            </div>
          </div>
        </ThemeProvider>
      )}
    </div>
  );
}

export default AdminPanel;
