import { useState } from 'react';
import { updateMember } from '../../services/memberService';
import { BLOOD_GROUPS } from '../../types/member';
import '../../components/ProfileMenu/ProfileMenu.css';

function EditProfileModal({ member, onClose, onSaved }) {
  const [form, setForm] = useState({
    familyName: member.family_name ?? '',
    fatherName: member.father_name ?? '',
    phone: member.phone ?? '',
    whatsapp: member.whatsapp ?? '',
    bloodGroup: member.blood_group ?? '',
    dob: member.dob ? member.dob.split('T')[0] : '',
    occupation: member.occupation ?? '',
    email: member.email ?? '',
    aadharNumber: member.aadhar_number ?? '',
    engagementDate: member.engagement_date ? member.engagement_date.split('T')[0] : '',
    marriageDate: member.marriage_date ? member.marriage_date.split('T')[0] : '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await updateMember(member.id, {
        family_name: form.familyName || null,
        father_name: form.fatherName || null,
        phone: form.phone || null,
        whatsapp: form.whatsapp || null,
        blood_group: form.bloodGroup || null,
        dob: form.dob || null,
        occupation: form.occupation || null,
        email: form.email || null,
        aadhar_number: form.aadharNumber || null,
        engagement_date: form.engagementDate || null,
        marriage_date: form.marriageDate || null,
      });
      onSaved?.();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pm-modal-overlay" onClick={onClose}>
      <div className="pm-modal pm-modal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="pm-modal-header">
          <h2 className="pm-modal-title">Edit Profile</h2>
          <button className="pm-modal-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="pm-modal-body">
          {error && <div className="pm-alert pm-alert--error">{error}</div>}

          <div className="pm-field-grid">
            <div className="pm-field">
              <label className="pm-label">Family Name</label>
              <input className="pm-input pm-input--text" name="familyName" value={form.familyName} onChange={handleChange} disabled={loading} />
            </div>
            <div className="pm-field">
              <label className="pm-label">Father's Name</label>
              <input className="pm-input pm-input--text" name="fatherName" value={form.fatherName} onChange={handleChange} disabled={loading} />
            </div>
            <div className="pm-field">
              <label className="pm-label">Blood Group</label>
              <select className="pm-input pm-input--text" name="bloodGroup" value={form.bloodGroup} onChange={handleChange} disabled={loading}>
                <option value="">Select</option>
                {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
              </select>
            </div>
            <div className="pm-field">
              <label className="pm-label">Phone</label>
              <input className="pm-input pm-input--text" type="tel" name="phone" value={form.phone} onChange={handleChange} disabled={loading} />
            </div>
            <div className="pm-field">
              <label className="pm-label">WhatsApp</label>
              <input className="pm-input pm-input--text" type="tel" name="whatsapp" value={form.whatsapp} onChange={handleChange} disabled={loading} />
            </div>
            <div className="pm-field">
              <label className="pm-label">Email</label>
              <input className="pm-input pm-input--text" type="email" name="email" value={form.email} onChange={handleChange} disabled={loading} />
            </div>
            <div className="pm-field">
              <label className="pm-label">Occupation</label>
              <input className="pm-input pm-input--text" name="occupation" value={form.occupation} onChange={handleChange} disabled={loading} />
            </div>
            <div className="pm-field">
              <label className="pm-label">Date of Birth</label>
              <input className="pm-input pm-input--text" type="date" name="dob" value={form.dob} onChange={handleChange} disabled={loading} />
            </div>
            <div className="pm-field">
              <label className="pm-label">Aadhar Number</label>
              <input className="pm-input pm-input--text" name="aadharNumber" maxLength={12} value={form.aadharNumber} onChange={handleChange} disabled={loading} />
            </div>
            <div className="pm-field">
              <label className="pm-label">Engagement Date</label>
              <input className="pm-input pm-input--text" type="date" name="engagementDate" value={form.engagementDate} onChange={handleChange} disabled={loading} />
            </div>
            <div className="pm-field">
              <label className="pm-label">Marriage Date</label>
              <input className="pm-input pm-input--text" type="date" name="marriageDate" value={form.marriageDate} onChange={handleChange} disabled={loading} />
            </div>
          </div>

          <button type="submit" className="pm-submit" disabled={loading}>
            {loading ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default EditProfileModal;
