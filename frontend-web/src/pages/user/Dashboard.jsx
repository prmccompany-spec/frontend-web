import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import logo from '../../assets/logo.png';
import './Dashboard.css';

const fmt = (val) =>
  Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const fmtMonthYear = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—';

function initials(name = '') {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [member, setMember] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([
      api.get(`/members/${user.id}`),
      api.get('/payments', { params: { member_id: user.id } }),
    ])
      .then(([memRes, payRes]) => {
        setMember(memRes.data.data ?? memRes.data);
        setPayments(payRes.data.data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const now = new Date();
  const myTotal = payments.reduce((s, p) => s + Number(p.amount), 0);
  const myThisMonth = payments
    .filter((p) => {
      const d = new Date(p.payment_date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((s, p) => s + Number(p.amount), 0);
  const myThisYear = payments
    .filter((p) => new Date(p.payment_date).getFullYear() === now.getFullYear())
    .reduce((s, p) => s + Number(p.amount), 0);

  const recentPayments = [...payments]
    .sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date))
    .slice(0, 5);

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
          <button className="db-nav-btn" onClick={() => navigate('/services')}>Offline Services</button>
          <button className="db-logout-btn" onClick={handleLogout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
        </nav>
      </header>

      <div className="db-content">
        {loading ? (
          <div className="db-skeleton-wrap">
            <div className="db-skeleton db-skeleton--profile" />
            <div className="db-skeleton-row">
              {[1, 2, 3, 4].map((i) => <div key={i} className="db-skeleton db-skeleton--card" />)}
            </div>
          </div>
        ) : (
          <>
            {/* ── Profile card ── */}
            <div className="db-profile-card">
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
                </div>
              </div>
            </div>

            {/* ── Stat cards ── */}
            <div className="db-stats-row">
              <div className="db-stat-card db-stat-card--accent">
                <div className="db-stat-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <div className="db-stat-value">₹{fmt(myTotal)}</div>
                <div className="db-stat-label">Total Contributed</div>
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
              </div>
            </div>

            {/* ── Two-column section ── */}
            <div className="db-two-col">
              {/* My recent payments */}
              <div className="db-section">
                <h2 className="db-section-title">My Recent Payments</h2>
                {recentPayments.length === 0 ? (
                  <p className="db-empty">No payments recorded yet.</p>
                ) : (
                  <table className="db-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Category</th>
                        <th>Type</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentPayments.map((p) => (
                        <tr key={p.id}>
                          <td className="db-td-meta">{fmtDate(p.payment_date)}</td>
                          <td>{p.category_name}</td>
                          <td>
                            <span className={`db-type-badge db-type-badge--${p.payment_type}`}>
                              {p.payment_type === 'qr' ? 'QR' : 'Cash'}
                            </span>
                          </td>
                          <td className="db-amount">₹{fmt(p.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Personal details */}
              <div className="db-section">
                <h2 className="db-section-title">My Details</h2>
                {member ? (
                  <div className="db-personal-grid">
                    {member.gotra && (
                      <div className="db-personal-item">
                        <span className="db-personal-key">Gotra</span>
                        <span className="db-personal-val">{member.gotra}</span>
                      </div>
                    )}
                    {member.family_name && (
                      <div className="db-personal-item">
                        <span className="db-personal-key">Family</span>
                        <span className="db-personal-val">{member.family_name}</span>
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
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
