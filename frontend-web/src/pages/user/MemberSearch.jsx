import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMembers, getMemberAddresses } from '../../services/memberService';
import { getUserTypes } from '../../services/userTypeService';
import { USER_TYPES } from '../../types/member';
import ProfileMenu from '../../components/ProfileMenu/ProfileMenu';
import logo from '../../assets/logo.png';
import { resolveFileUrl } from '../../utils/fileUrl';
import { matchesIdOrText, sortByMemberId } from '../../utils/memberSearch';
import './MemberSearch.css';

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// ── Full details modal ──────────────────────────────────────────────────────
function DetailsModal({ member, typeMap, onClose }) {
  const [addresses, setAddresses] = useState([]);

  useEffect(() => {
    getMemberAddresses(member.id)
      .then((res) => setAddresses(res.data.data ?? []))
      .catch(() => setAddresses([]));
  }, [member.id]);

  const local = addresses.find((a) => a.type === 'local');
  const outside = addresses.find((a) => a.type === 'outside');

  const row = (label, value) =>
    value ? (
      <div className="ms-row">
        <span className="ms-row-label">{label}</span>
        <span className="ms-row-value">{value}</span>
      </div>
    ) : null;

  const addressBlock = (addr) =>
    addr ? [addr.door_no, addr.area, addr.city, addr.pincode, addr.state].filter(Boolean).join(', ') : null;

  return (
    <div className="ms-modal-backdrop" onClick={onClose}>
      <div className="ms-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ms-profile-header">
          <button className="ms-modal-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <div className="ms-profile-photo">
            {member.photo
              ? <img src={resolveFileUrl(member.photo)} alt={member.name} className="ms-profile-img" />
              : <span className="ms-profile-initial">{(member.name || '?')[0].toUpperCase()}</span>}
          </div>
          <h2 className="ms-profile-name">{member.name}</h2>
          <div className="ms-profile-meta">
            <span className="ms-badge">{typeMap[member.user_type_id] ?? `Type ${member.user_type_id}`}</span>
            {member.member_id && <span className="ms-profile-id">#{member.member_id}</span>}
          </div>
        </div>

        <div className="ms-modal-body">
          <div className="ms-section-label">Identity</div>
          {row('Gotra', member.gotra)}
          {row('Family Name', member.family_name)}
          {row("Father's Name", member.father_name)}

          <div className="ms-section-label">Contact</div>
          {member.phone && (
            <div className="ms-row">
              <span className="ms-row-label">Phone</span>
              <a className="ms-row-value ms-row-link" href={`tel:${member.phone}`}>{member.phone}</a>
            </div>
          )}
          {row('WhatsApp', member.whatsapp)}
          {row('Email', member.email)}

          <div className="ms-section-label">Personal</div>
          {row('Blood Group', member.blood_group)}
          {row('Date of Birth', member.dob ? fmtDate(member.dob) : null)}
          {row('Occupation', member.occupation)}
          {row('Engagement Date', member.engagement_date ? fmtDate(member.engagement_date) : null)}
          {row('Marriage Date', member.marriage_date ? fmtDate(member.marriage_date) : null)}
          {row('Outside Rajapalayam', member.out_of_rajapalayam ? 'Yes' : null)}

          {(local || outside) && <div className="ms-section-label">Addresses</div>}
          {row('Local Address', addressBlock(local))}
          {row('Outside Address', addressBlock(outside))}

          <div className="ms-section-label">Membership</div>
          {row('Status', member.is_active ? 'Active' : 'Inactive')}
          {row('Date of Joining', member.created_at ? fmtDate(member.created_at) : null)}
        </div>
      </div>
    </div>
  );
}

// ── Main MemberSearch page ──────────────────────────────────────────────────
function MemberSearch() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [members, setMembers] = useState([]);
  const [userTypes, setUserTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [viewMember, setViewMember] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const typeMap = Object.fromEntries(userTypes.map((t) => [t.id, t.type_name]));

  const loadMembers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [membersRes, typesRes] = await Promise.all([getMembers(), getUserTypes()]);
      const allMembers = membersRes.data.data ?? [];
      setMembers(allMembers.filter((m) => (m.status_name ? m.status_name.toLowerCase() === 'active' : m.is_active)));
      const apiTypes = typesRes.data.data ?? [];
      setUserTypes(
        apiTypes.length > 0
          ? apiTypes
          : USER_TYPES.map((t) => ({ id: t.id, type_name: t.label }))
      );
    } catch {
      setError('Failed to load members. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const filtered = sortByMemberId(
    members.filter((m) => matchesIdOrText(m.member_id, [m.name], search, m.phone))
  );

  return (
    <div className="ms-root">
      <header className="ms-header">
        <div className="ms-header-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <img src={logo} alt="PRMCF" className="ms-header-logo" />
          <div>
            <div className="ms-header-name">PRMCF</div>
            <div className="ms-header-sub">Member Portal</div>
          </div>
        </div>
        <nav className="ms-header-nav">
          <button className="ms-nav-btn" onClick={() => navigate('/dashboard')}>Dashboard</button>
          <button className="ms-nav-btn" onClick={() => navigate('/services')}>Offline Services</button>
          <ProfileMenu />
        </nav>
      </header>

      <div className="ms-content">
        <div className="ms-page-head">
          <div>
            <h1 className="ms-page-title">Member Search</h1>
            <p className="ms-page-subtitle">
              {members.length} registered member{members.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="ms-search-wrap">
            <svg className="ms-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className="ms-search"
              placeholder="Search by name, ID or phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="ms-alert">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        {loading ? (
          <div className="ms-loading">
            <span className="ms-spinner" />
            Loading members…
          </div>
        ) : filtered.length === 0 ? (
          <div className="ms-empty">
            {search ? 'No members match your search.' : 'No members registered yet.'}
          </div>
        ) : (
          <div className="ms-grid">
            {filtered.map((m) => (
              <div className="ms-card" key={m.id}>
                <div className="ms-card-photo">
                  {m.photo
                    ? <img src={resolveFileUrl(m.photo)} alt={m.name} className="ms-card-img" />
                    : <span className="ms-card-initial">{(m.name || '?')[0].toUpperCase()}</span>}
                </div>
                <div className="ms-card-body">
                  <div className="ms-card-name">{m.name}</div>
                  <span className="ms-card-type">{typeMap[m.user_type_id] ?? `Type ${m.user_type_id}`}</span>
                  <div className="ms-card-meta">
                    <span className="ms-card-meta-row">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.69h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                      {m.phone ? (
                        <a
                          className="ms-phone-link"
                          href={`tel:${m.phone}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {m.phone}
                        </a>
                      ) : '—'}
                    </span>
                    <span className="ms-card-meta-row">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      Joined {fmtDate(m.created_at)}
                    </span>
                  </div>
                </div>
                <button className="ms-card-view-btn" onClick={() => setViewMember(m)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  View Full Details
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {viewMember && (
        <DetailsModal member={viewMember} typeMap={typeMap} onClose={() => setViewMember(null)} />
      )}
    </div>
  );
}

export default MemberSearch;
