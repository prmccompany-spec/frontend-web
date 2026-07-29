import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { PieChart } from '@mui/x-charts/PieChart';
import { BarChart } from '@mui/x-charts/BarChart';
import { getPayments } from '../../services/paymentService';
import { getRentals } from '../../services/rentalService';
import { getExpenses } from '../../services/expenseService';
import { getRealizedRentalIncome } from '../../utils/rentalIncome';
import { exportTableToPdf } from '../../utils/pdfExport';
import ExportPdfButton from '../../components/ExportPdfButton/ExportPdfButton';
import './Reports.css';

const fmt = (val) =>
  Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const asDate = (d) => (d instanceof Date ? d : new Date(d));

const fmtDate = (d) =>
  d ? asDate(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const fmtDateTime = (d) =>
  d ? asDate(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const monthKey = (d) => {
  const dt = asDate(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
};

const inRange = (d, from, to) => {
  const dt = asDate(d);
  if (from && dt < new Date(from)) return false;
  if (to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    if (dt > end) return false;
  }
  return true;
};

const INCOME_TYPES = ['Payment', 'Due Collection', 'Rental'];
const INCOME_TYPE_COLOR = { Payment: '#2563eb', 'Due Collection': '#d97706', Rental: '#7c3aed' };
const EXPENSE_CAT_COLORS = ['#dc3545', '#d97706', '#7c3aed', '#2563eb', '#059669'];

const chartTheme = createTheme({
  typography: { fontFamily: 'inherit' },
  palette: { primary: { main: '#dc3545' } },
});

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'income', label: 'Income' },
  { key: 'expenses', label: 'Expenses' },
  { key: 'tally', label: 'Tally Book' },
];

function StatCard({ label, value, sub, accent, color }) {
  return (
    <div className={`rp-stat-card${accent ? ' rp-stat-card--accent' : ''}`}>
      <div className="rp-stat-value" style={color ? { color } : undefined}>{value}</div>
      <div className="rp-stat-label">{label}</div>
      {sub && <div className="rp-stat-sub">{sub}</div>}
    </div>
  );
}

function TypeBadge({ type }) {
  return (
    <span className={`rp-type-badge rp-type-badge--${type.toLowerCase().replace(/\s+/g, '-')}`}>
      {type}
    </span>
  );
}

function ProgressBar({ percent, color }) {
  return (
    <div className="rp-bar-track">
      <div className="rp-bar-fill" style={{ width: `${Math.min(percent, 100)}%`, background: color }} />
    </div>
  );
}

function Reports() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    Promise.all([
      getPayments().then((res) => res.data ?? []).catch(() => []),
      getRentals().then((res) => res.data ?? []).catch(() => []),
      getExpenses().then((res) => res.data ?? []).catch(() => []),
    ])
      .then(([pay, rent, exp]) => {
        setPayments(pay);
        setRentals(rent);
        setExpenses(exp);
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Unified income ledger: payments + due collections + rentals ──
  const incomeEntries = useMemo(() => {
    const fromPayments = payments.map((p) => ({
      id: `pay-${p.id}`,
      date: p.payment_date,
      type: p.pending_payment_id ? 'Due Collection' : 'Payment',
      label: p.category_name,
      ref: p.payment_ref,
      party: p.member_name,
      partyCode: p.member_code,
      amount: Number(p.amount),
      mode: p.payment_type,
      handledBy: p.collected_by_name,
    }));
    // A rental's advance is booked as income when collected; the balance
    // only counts once the rental is actually returned and settled — an
    // active rental's uncollected balance is not income yet, and a
    // cancelled rental never generated any (see getRealizedRentalIncome).
    const rentalById = new Map(rentals.map((r) => [r.id, r]));
    const fromRentals = getRealizedRentalIncome(rentals).map((entry) => {
      const r = rentalById.get(entry.rentalId);
      const isOutsider = !r.member_name;
      return {
        id: `rental-${entry.rentalId}-${entry.stage}`,
        date: entry.date,
        type: 'Rental',
        label: r.product_name,
        ref: r.rental_ref,
        meta: `${fmtDate(r.start_date)} – ${fmtDate(r.end_date)} (${entry.stage === 'advance' ? 'Advance' : 'Balance'})`,
        party: r.member_name || r.renter_name,
        partyCode: isOutsider ? 'Non-member' : r.member_code,
        amount: entry.amount,
        mode: entry.mode,
        handledBy: r.collected_by_name,
      };
    });
    return [...fromPayments, ...fromRentals].sort((a, b) => asDate(b.date) - asDate(a.date));
  }, [payments, rentals]);

  const expenseEntries = useMemo(() => (
    expenses.map((e) => ({
      id: `exp-${e.id}`,
      date: e.created_at,
      category: e.category_name,
      reason: e.reason,
      amount: Number(e.amount),
      recordedBy: e.created_by_name,
    })).sort((a, b) => asDate(b.date) - asDate(a.date))
  ), [expenses]);

  // ── Tally book: chronological ledger with a running balance ──
  const tallyWithBalance = useMemo(() => {
    const merged = [
      ...incomeEntries.map((e) => ({ id: e.id, date: e.date, kind: 'in', label: `${e.type} — ${e.label}`, party: e.party, amount: e.amount })),
      ...expenseEntries.map((e) => ({ id: e.id, date: e.date, kind: 'out', label: `Expense — ${e.category}`, party: e.recordedBy, amount: e.amount })),
    ].sort((a, b) => asDate(a.date) - asDate(b.date));

    let balance = 0;
    return merged.map((t) => {
      balance += t.kind === 'in' ? t.amount : -t.amount;
      return { ...t, balance };
    });
  }, [incomeEntries, expenseEntries]);

  // ══════════ OVERVIEW ══════════
  const now = new Date();
  const thisMonth = monthKey(now);

  const totalIncomeAllTime = incomeEntries.reduce((s, e) => s + e.amount, 0);
  const totalExpensesAllTime = expenseEntries.reduce((s, e) => s + e.amount, 0);
  const netAllTime = totalIncomeAllTime - totalExpensesAllTime;
  const incomeThisMonth = incomeEntries.filter((e) => monthKey(e.date) === thisMonth).reduce((s, e) => s + e.amount, 0);
  const expensesThisMonth = expenseEntries.filter((e) => monthKey(e.date) === thisMonth).reduce((s, e) => s + e.amount, 0);
  const netThisMonth = incomeThisMonth - expensesThisMonth;

  const monthsWindow = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { key: monthKey(d), label: d.toLocaleDateString('en-IN', { month: 'short' }) };
  });
  const incomeByMonth = monthsWindow.map(({ key }) => incomeEntries.filter((e) => monthKey(e.date) === key).reduce((s, e) => s + e.amount, 0));
  const expenseByMonth = monthsWindow.map(({ key }) => expenseEntries.filter((e) => monthKey(e.date) === key).reduce((s, e) => s + e.amount, 0));

  const incomeBySource = INCOME_TYPES
    .map((type, i) => ({ id: i, label: type, value: incomeEntries.filter((e) => e.type === type).reduce((s, e) => s + e.amount, 0), color: INCOME_TYPE_COLOR[type] }))
    .filter((d) => d.value > 0);

  const expensesByCategory = Object.entries(
    expenseEntries.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {})
  ).map(([category, total]) => ({ category, total })).sort((a, b) => b.total - a.total);
  const expenseCatMax = expensesByCategory.length > 0 ? expensesByCategory[0].total : 1;

  // ══════════ INCOME TAB ══════════
  const [incomeFilters, setIncomeFilters] = useState({ search: '', type: '', label: '', mode: '', date_from: '', date_to: '' });
  const incomeLabelOptions = useMemo(() => [...new Set(incomeEntries.map((e) => e.label).filter(Boolean))].sort(), [incomeEntries]);
  const filteredIncome = useMemo(() => {
    const q = incomeFilters.search.trim().toLowerCase();
    return incomeEntries.filter((e) => {
      if (incomeFilters.type && e.type !== incomeFilters.type) return false;
      if (incomeFilters.label && e.label !== incomeFilters.label) return false;
      if (incomeFilters.mode && e.mode !== incomeFilters.mode) return false;
      if (!inRange(e.date, incomeFilters.date_from, incomeFilters.date_to)) return false;
      if (q) {
        const hay = `${e.party} ${e.partyCode} ${e.label} ${e.meta} ${e.ref}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [incomeEntries, incomeFilters]);
  const incomeHasFilters = !!(incomeFilters.search || incomeFilters.type || incomeFilters.label || incomeFilters.mode || incomeFilters.date_from || incomeFilters.date_to);
  const incomeTotal = filteredIncome.reduce((s, e) => s + e.amount, 0);

  const incomeFilterParts = [];
  if (incomeFilters.type) incomeFilterParts.push(`Type: ${incomeFilters.type}`);
  if (incomeFilters.label) incomeFilterParts.push(incomeFilters.label);
  if (incomeFilters.mode) incomeFilterParts.push(incomeFilters.mode === 'qr' ? 'QR' : 'Cash');
  if (incomeFilters.date_from) incomeFilterParts.push(`From ${incomeFilters.date_from}`);
  if (incomeFilters.date_to) incomeFilterParts.push(`To ${incomeFilters.date_to}`);
  if (incomeFilters.search) incomeFilterParts.push(`Search "${incomeFilters.search}"`);

  const handleExportIncome = () => exportTableToPdf({
    title: 'Income Ledger',
    subtitle: incomeFilterParts.length ? incomeFilterParts.join(' · ') : 'All income entries',
    summary: [
      { label: 'Entries', value: filteredIncome.length },
      { label: 'Total', value: `Rs. ${fmt(incomeTotal)}` },
    ],
    columns: [
      { header: 'Ref', key: 'ref' },
      { header: 'Date', key: 'date' },
      { header: 'Type', key: 'type' },
      { header: 'Member', key: 'member' },
      { header: 'Category / Product', key: 'label' },
      { header: 'Amount', key: 'amount', align: 'right' },
      { header: 'Mode', key: 'mode' },
      { header: 'Collected By', key: 'collectedBy' },
    ],
    rows: filteredIncome.map((e) => ({
      ref: e.ref || '—',
      date: fmtDate(e.date),
      type: e.type,
      member: `${e.party}${e.partyCode ? ` (${e.partyCode})` : ''}`,
      label: `${e.label}${e.meta ? ` — ${e.meta}` : ''}`,
      amount: `Rs. ${fmt(e.amount)}`,
      mode: e.mode === 'qr' ? 'QR' : 'Cash',
      collectedBy: e.handledBy || '—',
    })),
    filename: 'income-ledger',
    orientation: 'landscape',
  });

  // ══════════ EXPENSES TAB ══════════
  const [expenseFilters, setExpenseFilters] = useState({ search: '', category: '', date_from: '', date_to: '' });
  const expenseCatOptions = useMemo(() => [...new Set(expenseEntries.map((e) => e.category).filter(Boolean))].sort(), [expenseEntries]);
  const filteredExpenses = useMemo(() => {
    const q = expenseFilters.search.trim().toLowerCase();
    return expenseEntries.filter((e) => {
      if (expenseFilters.category && e.category !== expenseFilters.category) return false;
      if (!inRange(e.date, expenseFilters.date_from, expenseFilters.date_to)) return false;
      if (q) {
        const hay = `${e.category} ${e.reason} ${e.recordedBy}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [expenseEntries, expenseFilters]);
  const expenseHasFilters = !!(expenseFilters.search || expenseFilters.category || expenseFilters.date_from || expenseFilters.date_to);
  const expenseTotal = filteredExpenses.reduce((s, e) => s + e.amount, 0);

  const expenseFilterParts = [];
  if (expenseFilters.category) expenseFilterParts.push(expenseFilters.category);
  if (expenseFilters.date_from) expenseFilterParts.push(`From ${expenseFilters.date_from}`);
  if (expenseFilters.date_to) expenseFilterParts.push(`To ${expenseFilters.date_to}`);
  if (expenseFilters.search) expenseFilterParts.push(`Search "${expenseFilters.search}"`);

  const handleExportExpenses = () => exportTableToPdf({
    title: 'Expenses Report',
    subtitle: expenseFilterParts.length ? expenseFilterParts.join(' · ') : 'All expense entries',
    summary: [
      { label: 'Expenses', value: filteredExpenses.length },
      { label: 'Total', value: `Rs. ${fmt(expenseTotal)}` },
    ],
    columns: [
      { header: 'Date & Time', key: 'date' },
      { header: 'Category', key: 'category' },
      { header: 'Reason', key: 'reason' },
      { header: 'Amount', key: 'amount', align: 'right' },
      { header: 'Recorded By', key: 'recordedBy' },
    ],
    rows: filteredExpenses.map((e) => ({
      date: fmtDateTime(e.date),
      category: e.category,
      reason: e.reason,
      amount: `Rs. ${fmt(e.amount)}`,
      recordedBy: e.recordedBy,
    })),
    filename: 'expenses-report',
  });

  // ══════════ TALLY TAB ══════════
  const [tallyFilters, setTallyFilters] = useState({ search: '', kind: '', date_from: '', date_to: '' });
  const filteredTally = useMemo(() => {
    const q = tallyFilters.search.trim().toLowerCase();
    return tallyWithBalance.filter((t) => {
      if (tallyFilters.kind && t.kind !== tallyFilters.kind) return false;
      if (!inRange(t.date, tallyFilters.date_from, tallyFilters.date_to)) return false;
      if (q) {
        const hay = `${t.label} ${t.party}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [tallyWithBalance, tallyFilters]);
  const tallyHasFilters = !!(tallyFilters.search || tallyFilters.kind || tallyFilters.date_from || tallyFilters.date_to);
  const tallyIn = filteredTally.filter((t) => t.kind === 'in').reduce((s, t) => s + t.amount, 0);
  const tallyOut = filteredTally.filter((t) => t.kind === 'out').reduce((s, t) => s + t.amount, 0);
  const tallyDisplayed = [...filteredTally].reverse();

  const tallyFilterParts = [];
  if (tallyFilters.kind) tallyFilterParts.push(tallyFilters.kind === 'in' ? 'Income Only' : 'Expenses Only');
  if (tallyFilters.date_from) tallyFilterParts.push(`From ${tallyFilters.date_from}`);
  if (tallyFilters.date_to) tallyFilterParts.push(`To ${tallyFilters.date_to}`);
  if (tallyFilters.search) tallyFilterParts.push(`Search "${tallyFilters.search}"`);

  const handleExportTally = () => exportTableToPdf({
    title: 'Tally Book',
    subtitle: tallyFilterParts.length ? tallyFilterParts.join(' · ') : 'All ledger entries',
    summary: [
      { label: 'Entries', value: filteredTally.length },
      { label: 'In', value: `Rs. ${fmt(tallyIn)}` },
      { label: 'Out', value: `Rs. ${fmt(tallyOut)}` },
      { label: 'Net', value: `Rs. ${fmt(Math.abs(tallyIn - tallyOut))}` },
    ],
    columns: [
      { header: 'Date', key: 'date' },
      { header: 'Description', key: 'description' },
      { header: 'Party', key: 'party' },
      { header: 'In', key: 'in', align: 'right' },
      { header: 'Out', key: 'out', align: 'right' },
      { header: 'Balance', key: 'balance', align: 'right' },
    ],
    rows: tallyDisplayed.map((t) => ({
      date: fmtDate(t.date),
      description: t.label,
      party: t.party || '—',
      in: t.kind === 'in' ? `Rs. ${fmt(t.amount)}` : '',
      out: t.kind === 'out' ? `Rs. ${fmt(t.amount)}` : '',
      balance: `Rs. ${fmt(t.balance)}`,
    })),
    filename: 'tally-book',
  });

  if (loading) {
    return (
      <div className="admin-content">
        <div className="admin-page-header"><h1 className="admin-page-title">Reports</h1></div>
        <div className="rp-loading">Loading reports…</div>
      </div>
    );
  }

  return (
    <div className="admin-content rp-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Reports</h1>
        <p className="admin-page-subtitle">Book-keeping across payments, due collections, rentals and expenses</p>
      </div>

      <div className="rp-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`rp-tab-btn${activeTab === t.key ? ' rp-tab-btn--active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ══════════ OVERVIEW ══════════ */}
      {activeTab === 'overview' && (
        <ThemeProvider theme={chartTheme}>
          <div className="rp-stats-row">
            <StatCard accent label="Total Income" value={`₹${fmt(totalIncomeAllTime)}`} sub="All time" color="#059669" />
            <StatCard label="Total Expenses" value={`₹${fmt(totalExpensesAllTime)}`} sub="All time" color="#dc2626" />
            <StatCard label="Net Position" value={`₹${fmt(Math.abs(netAllTime))}`} sub={netAllTime >= 0 ? 'Surplus, all time' : 'Deficit, all time'} color={netAllTime >= 0 ? '#059669' : '#dc2626'} />
            <StatCard label="Net (This Month)" value={`₹${fmt(Math.abs(netThisMonth))}`} sub={netThisMonth >= 0 ? 'Surplus this month' : 'Deficit this month'} color={netThisMonth >= 0 ? '#059669' : '#dc2626'} />
          </div>

          <div className="rp-row-3">
            <div className="rp-card rp-card--span2">
              <div className="rp-panel-header"><span>Income vs Expenses</span><span className="rp-panel-tag">Last 6 Months</span></div>
              <BarChart
                xAxis={[{ scaleType: 'band', data: monthsWindow.map((m) => m.label) }]}
                series={[
                  { data: incomeByMonth, label: 'Income', color: '#16a34a' },
                  { data: expenseByMonth, label: 'Expenses', color: '#dc2626' },
                ]}
                height={260}
                grid={{ horizontal: true }}
              />
            </div>

            <div className="rp-card">
              <div className="rp-panel-header"><span>Income by Source</span></div>
              {incomeBySource.length === 0 ? (
                <div className="rp-empty-sm">No income recorded yet.</div>
              ) : (
                <div className="rp-donut-wrap">
                  <PieChart
                    series={[{ data: incomeBySource, innerRadius: 45, outerRadius: 70, paddingAngle: 2, cornerRadius: 3 }]}
                    width={150} height={150}
                    hideLegend
                  />
                  <ul className="rp-legend-list">
                    {incomeBySource.map((s) => (
                      <li className="rp-legend-item" key={s.label}>
                        <span className="rp-legend-dot" style={{ background: s.color }} />
                        <span className="rp-legend-label">{s.label}</span>
                        <span className="rp-legend-count">₹{fmt(s.value)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="rp-row-1">
            <div className="rp-card">
              <div className="rp-panel-header">
                <span>Expenses by Category</span>
                <button className="rp-panel-link" onClick={() => navigate('/admin/expenses')}>Manage Expenses</button>
              </div>
              {expensesByCategory.length === 0 ? (
                <div className="rp-empty-sm">No expenses recorded yet.</div>
              ) : (
                <div className="rp-cat-list">
                  {expensesByCategory.map((row, i) => (
                    <div key={row.category} className="rp-cat-row">
                      <div className="rp-cat-top">
                        <span className="rp-cat-name">{row.category}</span>
                        <span className="rp-cat-amount">₹{fmt(row.total)}</span>
                      </div>
                      <ProgressBar percent={(row.total / expenseCatMax) * 100} color={EXPENSE_CAT_COLORS[i % EXPENSE_CAT_COLORS.length]} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ThemeProvider>
      )}

      {/* ══════════ INCOME ══════════ */}
      {activeTab === 'income' && (
        <>
          <div className="rp-filters">
            <input
              className="rp-filter-input rp-filter-input--grow"
              placeholder="Search member, category, ref…"
              value={incomeFilters.search}
              onChange={(e) => setIncomeFilters((f) => ({ ...f, search: e.target.value }))}
            />
            <select className="rp-filter-input" value={incomeFilters.type} onChange={(e) => setIncomeFilters((f) => ({ ...f, type: e.target.value }))}>
              <option value="">All Types</option>
              {INCOME_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select className="rp-filter-input" value={incomeFilters.label} onChange={(e) => setIncomeFilters((f) => ({ ...f, label: e.target.value }))}>
              <option value="">All Categories/Products</option>
              {incomeLabelOptions.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            <select className="rp-filter-input" value={incomeFilters.mode} onChange={(e) => setIncomeFilters((f) => ({ ...f, mode: e.target.value }))}>
              <option value="">All Modes</option>
              <option value="cash">Cash</option>
              <option value="qr">QR</option>
            </select>
            <input type="date" className="rp-filter-input" value={incomeFilters.date_from} title="From date"
              onChange={(e) => setIncomeFilters((f) => ({ ...f, date_from: e.target.value }))} />
            <input type="date" className="rp-filter-input" value={incomeFilters.date_to} title="To date"
              onChange={(e) => setIncomeFilters((f) => ({ ...f, date_to: e.target.value }))} />
            {incomeHasFilters && (
              <button className="rp-filter-clear" onClick={() => setIncomeFilters({ search: '', type: '', label: '', mode: '', date_from: '', date_to: '' })}>Clear</button>
            )}
            <ExportPdfButton onExport={handleExportIncome} disabled={filteredIncome.length === 0} />
          </div>

          {filteredIncome.length === 0 ? (
            <div className="rp-empty">No income entries match your search or filters.</div>
          ) : (
            <>
              <div className="rp-summary-bar">
                <span>{filteredIncome.length} entr{filteredIncome.length !== 1 ? 'ies' : 'y'}</span>
                <span className="rp-summary-total">Total: <strong>₹{fmt(incomeTotal)}</strong></span>
              </div>
              <div className="rp-table-wrap">
                <table className="rp-table">
                  <thead>
                    <tr>
                      <th>Ref</th>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Member</th>
                      <th>Category / Product</th>
                      <th>Amount</th>
                      <th>Mode</th>
                      <th>Collected By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIncome.map((e) => (
                      <tr key={e.id}>
                        <td><span className="rp-ref">{e.ref}</span></td>
                        <td className="rp-td-meta">{fmtDate(e.date)}</td>
                        <td><TypeBadge type={e.type} /></td>
                        <td>
                          <div className="rp-bold">{e.party}</div>
                          <div className="rp-td-meta">{e.partyCode}</div>
                        </td>
                        <td>
                          <div>{e.label}</div>
                          <div className="rp-td-meta">{e.meta}</div>
                        </td>
                        <td className="rp-amount rp-amount--in">₹{fmt(e.amount)}</td>
                        <td>
                          <span className={`rp-mode-badge rp-mode-badge--${e.mode}`}>{e.mode === 'qr' ? 'QR' : 'Cash'}</span>
                        </td>
                        <td className="rp-td-meta">{e.handledBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      {/* ══════════ EXPENSES ══════════ */}
      {activeTab === 'expenses' && (
        <>
          <div className="rp-filters">
            <input
              className="rp-filter-input rp-filter-input--grow"
              placeholder="Search reason, category, recorded by…"
              value={expenseFilters.search}
              onChange={(e) => setExpenseFilters((f) => ({ ...f, search: e.target.value }))}
            />
            <select className="rp-filter-input" value={expenseFilters.category} onChange={(e) => setExpenseFilters((f) => ({ ...f, category: e.target.value }))}>
              <option value="">All Categories</option>
              {expenseCatOptions.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="date" className="rp-filter-input" value={expenseFilters.date_from} title="From date"
              onChange={(e) => setExpenseFilters((f) => ({ ...f, date_from: e.target.value }))} />
            <input type="date" className="rp-filter-input" value={expenseFilters.date_to} title="To date"
              onChange={(e) => setExpenseFilters((f) => ({ ...f, date_to: e.target.value }))} />
            {expenseHasFilters && (
              <button className="rp-filter-clear" onClick={() => setExpenseFilters({ search: '', category: '', date_from: '', date_to: '' })}>Clear</button>
            )}
            <ExportPdfButton onExport={handleExportExpenses} disabled={filteredExpenses.length === 0} />
            <button className="rp-manage-btn" onClick={() => navigate('/admin/expenses')}>Manage in Expense Book</button>
          </div>

          {filteredExpenses.length === 0 ? (
            <div className="rp-empty">No expenses match your search or filters.</div>
          ) : (
            <>
              <div className="rp-summary-bar">
                <span>{filteredExpenses.length} expense{filteredExpenses.length !== 1 ? 's' : ''}</span>
                <span className="rp-summary-total">Total: <strong>₹{fmt(expenseTotal)}</strong></span>
              </div>
              <div className="rp-table-wrap">
                <table className="rp-table">
                  <thead>
                    <tr>
                      <th>Date &amp; Time</th>
                      <th>Category</th>
                      <th>Reason</th>
                      <th>Amount</th>
                      <th>Recorded By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.map((e) => (
                      <tr key={e.id}>
                        <td className="rp-td-meta">{fmtDateTime(e.date)}</td>
                        <td><span className="rp-cat-pill">{e.category}</span></td>
                        <td className="rp-reason">{e.reason}</td>
                        <td className="rp-amount rp-amount--out">₹{fmt(e.amount)}</td>
                        <td className="rp-td-meta">{e.recordedBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      {/* ══════════ TALLY BOOK ══════════ */}
      {activeTab === 'tally' && (
        <>
          <div className="rp-filters">
            <input
              className="rp-filter-input rp-filter-input--grow"
              placeholder="Search description or party…"
              value={tallyFilters.search}
              onChange={(e) => setTallyFilters((f) => ({ ...f, search: e.target.value }))}
            />
            <select className="rp-filter-input" value={tallyFilters.kind} onChange={(e) => setTallyFilters((f) => ({ ...f, kind: e.target.value }))}>
              <option value="">Income &amp; Expenses</option>
              <option value="in">Income Only</option>
              <option value="out">Expenses Only</option>
            </select>
            <input type="date" className="rp-filter-input" value={tallyFilters.date_from} title="From date"
              onChange={(e) => setTallyFilters((f) => ({ ...f, date_from: e.target.value }))} />
            <input type="date" className="rp-filter-input" value={tallyFilters.date_to} title="To date"
              onChange={(e) => setTallyFilters((f) => ({ ...f, date_to: e.target.value }))} />
            {tallyHasFilters && (
              <button className="rp-filter-clear" onClick={() => setTallyFilters({ search: '', kind: '', date_from: '', date_to: '' })}>Clear</button>
            )}
            <ExportPdfButton onExport={handleExportTally} disabled={filteredTally.length === 0} />
          </div>

          {filteredTally.length === 0 ? (
            <div className="rp-empty">No ledger entries match your search or filters.</div>
          ) : (
            <>
              <div className="rp-summary-bar">
                <span>{filteredTally.length} entr{filteredTally.length !== 1 ? 'ies' : 'y'}</span>
                <span className="rp-summary-total">
                  In: <strong className="rp-text-in">₹{fmt(tallyIn)}</strong> · Out: <strong className="rp-text-out">₹{fmt(tallyOut)}</strong> · Net: <strong className={tallyIn - tallyOut >= 0 ? 'rp-text-in' : 'rp-text-out'}>₹{fmt(Math.abs(tallyIn - tallyOut))}</strong>
                </span>
              </div>
              <div className="rp-table-wrap">
                <table className="rp-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Party</th>
                      <th>In</th>
                      <th>Out</th>
                      <th>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tallyDisplayed.map((t) => (
                      <tr key={t.id}>
                        <td className="rp-td-meta">{fmtDate(t.date)}</td>
                        <td className="rp-bold">{t.label}</td>
                        <td className="rp-td-meta">{t.party}</td>
                        <td className="rp-amount rp-amount--in">{t.kind === 'in' ? `₹${fmt(t.amount)}` : ''}</td>
                        <td className="rp-amount rp-amount--out">{t.kind === 'out' ? `₹${fmt(t.amount)}` : ''}</td>
                        <td className={`rp-balance ${t.balance >= 0 ? 'rp-text-in' : 'rp-text-out'}`}>₹{fmt(t.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default Reports;
