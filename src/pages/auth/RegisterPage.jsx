import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';
import './RegisterPage.css';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const initialForm = {
  memberId: '',
  gotra: '',
  familyName: '',
  name: '',
  fatherName: '',
  address: '',
  phone: '',
  whatsapp: '',
  sameAsPhone: false,
  bloodGroup: '',
  dob: '',
  occupation: '',
  addressProof: null,
  outOfRajapalayam: '',
};

function RegisterPage() {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'sameAsPhone') {
      setForm((prev) => ({ ...prev, sameAsPhone: checked, whatsapp: checked ? prev.phone : '' }));
      return;
    }
    if (name === 'phone' && form.sameAsPhone) {
      setForm((prev) => ({ ...prev, phone: value, whatsapp: value }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm((prev) => ({ ...prev, addressProof: file }));
      setFileName(file.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      navigate('/login');
    } catch {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rp-page">

      {/* Top header bar */}
      <div className="rp-topbar">
        <img src={logo} alt="PRMCF" className="rp-topbar-logo" onClick={() => navigate('/')} />
        <div className="rp-topbar-text">
          <span className="rp-topbar-brand">PRMCF</span>
          <span className="rp-topbar-sub">Palayapalayam Rajapalayam Raju's Common Fund</span>
        </div>
      </div>

      {/* Form card */}
      <div className="rp-wrapper">
        <div className="rp-card">

          {/* Card title */}
          <div className="rp-card-header">
            <div className="rp-card-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div>
              <h2 className="rp-title">Member Registration</h2>
              <p className="rp-subtitle">Fill in your details to join PRMCF</p>
            </div>
          </div>

          {error && (
            <div className="rp-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="rp-form">

            {/* ── Identity ── */}
            <div className="rp-section-label">Identity</div>
            <div className="rp-grid-2">
              <div className="rp-field">
                <label className="rp-label">Members ID</label>
                <input className="rp-input" name="memberId" placeholder="e.g. PRMC-0001"
                  value={form.memberId} onChange={handleChange} required />
              </div>
              <div className="rp-field">
                <label className="rp-label">Gotra</label>
                <input className="rp-input" name="gotra" placeholder="Enter gotra"
                  value={form.gotra} onChange={handleChange} />
              </div>
            </div>

            <div className="rp-grid-2">
              <div className="rp-field">
                <label className="rp-label">Family Name</label>
                <input className="rp-input" name="familyName" placeholder="Family / Clan name"
                  value={form.familyName} onChange={handleChange} required />
              </div>
              <div className="rp-field">
                <label className="rp-label">Full Name</label>
                <input className="rp-input" name="name" placeholder="Your full name"
                  value={form.name} onChange={handleChange} required />
              </div>
            </div>

            <div className="rp-field">
              <label className="rp-label">Father's Name</label>
              <input className="rp-input" name="fatherName" placeholder="Father's full name"
                value={form.fatherName} onChange={handleChange} required />
            </div>

            {/* ── Contact ── */}
            <div className="rp-section-label">Contact</div>
            <div className="rp-field">
              <label className="rp-label">Address</label>
              <textarea className="rp-textarea" name="address" rows={3}
                placeholder="Door no, Street, Area, City"
                value={form.address} onChange={handleChange} required />
            </div>

            <div className="rp-grid-2">
              <div className="rp-field">
                <label className="rp-label">Phone Number</label>
                <input className="rp-input" name="phone" type="tel"
                  placeholder="+91 XXXXX XXXXX"
                  value={form.phone} onChange={handleChange} required />
              </div>
              <div className="rp-field">
                <label className="rp-label">
                  WhatsApp Number
                  <span className="rp-same-wrap">
                    <input type="checkbox" name="sameAsPhone" id="sameCheck"
                      checked={form.sameAsPhone} onChange={handleChange} className="rp-checkbox" />
                    <label htmlFor="sameCheck" className="rp-same-label">Same as phone</label>
                  </span>
                </label>
                <input className="rp-input" name="whatsapp" type="tel"
                  placeholder="+91 XXXXX XXXXX"
                  value={form.whatsapp} onChange={handleChange}
                  disabled={form.sameAsPhone} />
              </div>
            </div>

            {/* ── Personal Details ── */}
            <div className="rp-section-label">Personal Details</div>
            <div className="rp-grid-3">
              <div className="rp-field">
                <label className="rp-label">Blood Group</label>
                <select className="rp-input rp-select" name="bloodGroup"
                  value={form.bloodGroup} onChange={handleChange} required>
                  <option value="">Select</option>
                  {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
                </select>
              </div>
              <div className="rp-field">
                <label className="rp-label">Date of Birth</label>
                <input className="rp-input" name="dob" type="date"
                  value={form.dob} onChange={handleChange} required />
              </div>
              <div className="rp-field">
                <label className="rp-label">Occupation</label>
                <input className="rp-input" name="occupation" placeholder="e.g. Engineer"
                  value={form.occupation} onChange={handleChange} required />
              </div>
            </div>

            {/* ── Documents ── */}
            <div className="rp-section-label">Documents</div>
            <div className="rp-field">
              <label className="rp-label">Address Proof <span className="rp-hint">(Aadhaar / Voter ID / Passport)</span></label>
              <label className="rp-file-label">
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFile} className="rp-file-input" />
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <span>{fileName || 'Click to upload file'}</span>
              </label>
            </div>

            <div className="rp-field">
              <label className="rp-label">Living Address <span className="rp-hint">(if outside Rajapalayam)</span></label>
              <textarea className="rp-textarea" name="outOfRajapalayam" rows={3}
                placeholder="Current living address if you reside outside Rajapalayam"
                value={form.outOfRajapalayam} onChange={handleChange} />
            </div>

            <button type="submit" className="rp-submit" disabled={loading}>
              {loading ? (<><span className="rp-spinner" /> Submitting...</>) : 'Register as Member'}
            </button>

            <p className="rp-login-text">
              Already a member?{' '}
              <button type="button" className="rp-login-link" onClick={() => navigate('/login')}>Sign in</button>
            </p>

          </form>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
