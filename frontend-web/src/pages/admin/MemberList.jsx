import { useState, useEffect, useCallback } from 'react';
import {
  getMembers,
  getMemberAddresses,
  updateMember,
  updateAddress,
  createAddress,
  uploadMemberPhoto,
  getPendingPayments,
  resetMemberPassword,
} from '../../services/memberService';
import { USER_TYPES, BLOOD_GROUPS, toMemberPayload } from '../../types/member';
import { getUserTypes } from '../../services/userTypeService';
import { getMemberStatuses } from '../../services/memberStatusService';
import { getBranches } from '../../services/branchService';
import { downloadMemberIdCard } from '../../utils/downloadIdCard';
import { resolveFileUrl } from '../../utils/fileUrl';
import AssignDueModal from './payments/AssignDueModal';
import './MemberList.css';

// ── View Modal ────────────────────────────────────────────────────────────────
function ViewModal({ member, typeMap, onClose }) {
  const [addresses, setAddresses] = useState([]);
  const [pendings, setPendings] = useState([]);

  useEffect(() => {
    getMemberAddresses(member.id)
      .then((res) => setAddresses(res.data.data ?? []))
      .catch(() => setAddresses([]));
    getPendingPayments(member.id, 'pending')
      .then((res) => setPendings(res.data.data ?? []))
      .catch(() => setPendings([]));
  }, [member.id]);

  const local = addresses.find((a) => a.type === 'local');
  const outside = addresses.find((a) => a.type === 'outside');

  const row = (label, value) =>
    value ? (
      <div className="vm-row">
        <span className="vm-row-label">{label}</span>
        <span className="vm-row-value">{value}</span>
      </div>
    ) : null;

  const addressBlock = (addr) =>
    addr ? (
      [addr.door_no, addr.area, addr.city, addr.pincode, addr.state]
        .filter(Boolean)
        .join(', ')
    ) : null;

  return (
    <div className="ml-modal-backdrop" onClick={onClose}>
      <div className="ml-modal" onClick={(e) => e.stopPropagation()}>
        <div className="vm-profile-header">
          <button className="ml-modal-close vm-close-btn" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <div className="vm-profile-photo">
            {member.photo
              ? <img src={resolveFileUrl(member.photo)} alt={member.name} className="vm-profile-img" />
              : <span className="vm-profile-initial">{(member.name || '?')[0].toUpperCase()}</span>}
          </div>
          <h2 className="vm-profile-name">{member.name}</h2>
          <div className="vm-profile-meta">
            <span className="ml-modal-badge">{typeMap[member.user_type_id] ?? `Type ${member.user_type_id}`}</span>
            {member.member_id && <span className="vm-profile-id">#{member.member_id}</span>}
          </div>
        </div>

        <div className="ml-modal-body">
          <div className="vm-section-label">Identity</div>
          {row('Gotra', member.gotra)}
          {row('Family Name', member.family_name)}
          {row("Father's Name", member.father_name)}
          {row('Aadhar Number', member.aadhar_number)}
          {row('Branch', member.branch_name)}

          <div className="vm-section-label">Contact</div>
          {row('Phone', member.phone)}
          {row('WhatsApp', member.whatsapp)}
          {row('Email', member.email)}

          <div className="vm-section-label">Personal</div>
          {row('Blood Group', member.blood_group)}
          {row('Date of Birth', member.dob ? new Date(member.dob).toLocaleDateString('en-IN') : null)}
          {row('Occupation', member.occupation)}
          {row('Engagement Date', member.engagement_date ? new Date(member.engagement_date).toLocaleDateString('en-IN') : null)}
          {row('Marriage Date', member.marriage_date ? new Date(member.marriage_date).toLocaleDateString('en-IN') : null)}
          {row('Outside Rajapalayam', member.out_of_rajapalayam ? 'Yes' : null)}

          {pendings.length > 0 && (
            <>
              <div className="vm-section-label">Pending Payments</div>
              {pendings.map((p) => row(p.title,
                `₹${Number(p.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`))}
              {row('Total Pending',
                `₹${pendings.reduce((s, p) => s + Number(p.amount), 0)
                  .toLocaleString('en-IN', { minimumFractionDigits: 2 })}`)}
            </>
          )}

          {(local || outside) && <div className="vm-section-label">Addresses</div>}
          {row('Local Address', addressBlock(local))}
          {row('Outside Address', addressBlock(outside))}

          <div className="vm-section-label">Meta</div>
          {row('Member Table ID', member.member_table_id)}
          {row('Status', member.status_name || (member.is_active ? 'Active' : 'Inactive'))}
          {row('Registered', member.created_at ? new Date(member.created_at).toLocaleDateString('en-IN') : null)}

          {member.qr_code && (
            <>
              <div className="vm-section-label">QR Code</div>
              <div className="vm-qr-wrap">
                <img
                  className="vm-qr-img"
                  src={resolveFileUrl(member.qr_code)}
                  alt={`QR code for ${member.name}`}
                />
                <a
                  className="vm-qr-download"
                  href={resolveFileUrl(member.qr_code)}
                  download
                  target="_blank"
                  rel="noreferrer"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download QR
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Edit Modal ────────────────────────────────────────────────────────────────
function EditModal({ member, userTypes, statuses, branches, onClose, onSaved }) {
  const [form, setForm] = useState({
    memberId: member.member_id ?? '',
    userTypeId: member.user_type_id ?? '',
    statusId: member.status_id ?? '',
    branchId: member.branch_id ?? '',
    name: member.name ?? '',
    gotra: member.gotra ?? '',
    familyName: member.family_name ?? '',
    fatherName: member.father_name ?? '',
    phone: member.phone ?? '',
    whatsapp: member.whatsapp ?? '',
    sameAsPhone: member.phone === member.whatsapp && !!member.phone,
    bloodGroup: member.blood_group ?? '',
    dob: member.dob ? member.dob.split('T')[0] : '',
    occupation: member.occupation ?? '',
    outOfRajapalayam: !!member.out_of_rajapalayam,
    email: member.email ?? '',
    aadharNumber: member.aadhar_number ?? '',
    engagementDate: member.engagement_date ? member.engagement_date.split('T')[0] : '',
    marriageDate: member.marriage_date ? member.marriage_date.split('T')[0] : '',
    // local address
    localDoorNo: '', localArea: '', localCity: '', localPincode: '', localState: '',
    // outside address
    outsideDoorNo: '', outsideArea: '', outsideCity: '', outsidePincode: '', outsideState: '',
  });
  const [localAddressId, setLocalAddressId] = useState(null);
  const [outsideAddressId, setOutsideAddressId] = useState(null);
  const [newPhoto, setNewPhoto] = useState(null);
  const [newPhotoPreview, setNewPhotoPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resettingPw, setResettingPw] = useState(false);
  const [resetPwError, setResetPwError] = useState('');
  const [resetPwSuccess, setResetPwSuccess] = useState('');

  const handleResetPassword = async () => {
    setResetPwError('');
    setResetPwSuccess('');
    setResettingPw(true);
    try {
      await resetMemberPassword(member.id, newPassword);
      setResetPwSuccess('Password reset successfully.');
      setNewPassword('');
    } catch (err) {
      setResetPwError(err.response?.data?.message ?? 'Failed to reset password.');
    } finally {
      setResettingPw(false);
    }
  };

  const currentPhotoUrl = member.photo ? resolveFileUrl(member.photo) : '';

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setNewPhoto(file);
    setNewPhotoPreview(URL.createObjectURL(file));
  };

  // Pre-fill address fields from existing addresses
  useEffect(() => {
    getMemberAddresses(member.id)
      .then((res) => {
        const addrs = res.data.data ?? [];
        const local = addrs.find((a) => a.type === 'local');
        const outside = addrs.find((a) => a.type === 'outside');
        if (local) {
          setLocalAddressId(local.id);
          setForm((p) => ({
            ...p,
            localDoorNo: local.door_no ?? '',
            localArea: local.area ?? '',
            localCity: local.city ?? '',
            localPincode: local.pincode ?? '',
            localState: local.state ?? '',
          }));
        }
        if (outside) {
          setOutsideAddressId(outside.id);
          setForm((p) => ({
            ...p,
            outsideDoorNo: outside.door_no ?? '',
            outsideArea: outside.area ?? '',
            outsideCity: outside.city ?? '',
            outsidePincode: outside.pincode ?? '',
            outsideState: outside.state ?? '',
          }));
        }
      })
      .catch(() => {});
  }, [member.id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'sameAsPhone') {
      setForm((p) => ({ ...p, sameAsPhone: checked, whatsapp: checked ? p.phone : '' }));
      return;
    }
    if (name === 'phone' && form.sameAsPhone) {
      setForm((p) => ({ ...p, phone: value, whatsapp: value }));
      return;
    }
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const saveAddress = async (type, idRef, fields) => {
    const hasData = Object.values(fields).some((v) => v);
    if (!hasData) return;
    const payload = { member_id: member.id, type, ...fields };
    if (idRef) {
      await updateAddress(idRef, payload);
    } else {
      await createAddress(payload);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await updateMember(member.id, toMemberPayload(form));
      if (newPhoto) {
        const fd = new FormData();
        fd.append('photo', newPhoto);
        await uploadMemberPhoto(member.id, fd);
      }
      await saveAddress('local', localAddressId, {
        door_no: form.localDoorNo || null,
        area: form.localArea || null,
        city: form.localCity || null,
        pincode: form.localPincode || null,
        state: form.localState || null,
      });
      if (form.outOfRajapalayam) {
        await saveAddress('outside', outsideAddressId, {
          door_no: form.outsideDoorNo || null,
          area: form.outsideArea || null,
          city: form.outsideCity || null,
          pincode: form.outsidePincode || null,
          state: form.outsideState || null,
        });
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Update failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ml-modal-backdrop" onClick={onClose}>
      <div className="ml-modal ml-modal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="ml-modal-header">
          <div className="ml-modal-header-left">
            <div className="ml-modal-avatar ml-modal-avatar--edit">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </div>
            <div>
              <h2 className="ml-modal-title">Edit Member</h2>
              <p className="ml-modal-subtitle">{member.member_id}</p>
            </div>
          </div>
          <button className="ml-modal-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSave}>
          <div className="ml-modal-body ml-modal-body--form">

            {error && (
              <div className="ml-form-error">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            {/* Photo */}
            <div className="ml-form-section">Member Photo</div>
            <div className="ml-photo-row">
              <div
                className="ml-photo-zone"
                onClick={() => document.getElementById('ml-photo-input').click()}
              >
                {newPhotoPreview || currentPhotoUrl ? (
                  <img
                    src={newPhotoPreview || currentPhotoUrl}
                    alt="Member"
                    className="ml-photo-preview"
                  />
                ) : (
                  <div className="ml-photo-placeholder">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                      strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="3" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <span>No photo</span>
                  </div>
                )}
                <div className="ml-photo-overlay">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Change
                </div>
              </div>
              <input
                id="ml-photo-input"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={handlePhotoChange}
              />
              <p className="ml-photo-note">
                {newPhoto ? `New: ${newPhoto.name}` : currentPhotoUrl ? 'Click photo to change' : 'Click to upload a photo (optional)'}
              </p>
            </div>

            {/* Reset Password */}
            <div className="ml-form-section">Reset Password</div>
            {resetPwError && <div className="ml-form-error ml-form-error--inline">{resetPwError}</div>}
            {resetPwSuccess && <div className="ml-form-success">{resetPwSuccess}</div>}
            <div className="ml-reset-pw-row">
              <div className="ml-form-field">
                <label className="ml-form-label">New Password (6 digits)</label>
                <input
                  className="ml-form-input"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="e.g. 543210"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <button
                type="button"
                className="ml-reset-pw-btn"
                disabled={resettingPw || !/^\d{6}$/.test(newPassword)}
                onClick={handleResetPassword}
              >
                {resettingPw ? 'Resetting…' : 'Reset Password'}
              </button>
            </div>

            {/* Core */}
            <div className="ml-form-section">Core Details</div>
            <div className="ml-form-grid-3">
              <div className="ml-form-field">
                <label className="ml-form-label">Member ID <span className="ml-required">*</span></label>
                <input className="ml-form-input" name="memberId" value={form.memberId}
                  onChange={handleChange} required />
              </div>
              <div className="ml-form-field">
                <label className="ml-form-label">Full Name <span className="ml-required">*</span></label>
                <input className="ml-form-input" name="name" value={form.name}
                  onChange={handleChange} required />
              </div>
              <div className="ml-form-field">
                <label className="ml-form-label">User Type <span className="ml-required">*</span></label>
                <select className="ml-form-input ml-form-select" name="userTypeId"
                  value={form.userTypeId} onChange={handleChange} required>
                  <option value="">Select</option>
                  {userTypes.map((ut) => (
                    <option key={ut.id} value={ut.id}>{ut.type_name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="ml-form-grid-2">
              <div className="ml-form-field">
                <label className="ml-form-label">Status <span className="ml-required">*</span></label>
                <select className="ml-form-input ml-form-select" name="statusId"
                  value={form.statusId} onChange={handleChange} required>
                  <option value="">Select</option>
                  {statuses.map((s) => (
                    <option key={s.id} value={s.id}>{s.status_name}</option>
                  ))}
                </select>
              </div>
              <div className="ml-form-field">
                <label className="ml-form-label">Branch</label>
                <select className="ml-form-input ml-form-select" name="branchId"
                  value={form.branchId} onChange={handleChange}>
                  <option value="">Select</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Identity */}
            <div className="ml-form-section">Identity</div>
            <div className="ml-form-grid-3">
              <div className="ml-form-field">
                <label className="ml-form-label">Gotra <span className="ml-required">*</span></label>
                <input className="ml-form-input" name="gotra" value={form.gotra} onChange={handleChange} required />
              </div>
              <div className="ml-form-field">
                <label className="ml-form-label">Family Name <span className="ml-required">*</span></label>
                <input className="ml-form-input" name="familyName" value={form.familyName} onChange={handleChange} required />
              </div>
              <div className="ml-form-field">
                <label className="ml-form-label">Father's Name <span className="ml-required">*</span></label>
                <input className="ml-form-input" name="fatherName" value={form.fatherName} onChange={handleChange} required />
              </div>
            </div>
            <div className="ml-form-grid-2">
              <div className="ml-form-field">
                <label className="ml-form-label">Aadhar Number <span className="ml-required">*</span></label>
                <input className="ml-form-input" name="aadharNumber" maxLength={12}
                  placeholder="12-digit Aadhar number" value={form.aadharNumber} onChange={handleChange} required />
              </div>
            </div>

            {/* Contact */}
            <div className="ml-form-section">Contact</div>
            <div className="ml-form-grid-2">
              <div className="ml-form-field">
                <label className="ml-form-label">Phone <span className="ml-required">*</span></label>
                <input className="ml-form-input" name="phone" type="tel"
                  value={form.phone} onChange={handleChange} required />
              </div>
              <div className="ml-form-field">
                <label className="ml-form-label">
                  WhatsApp <span className="ml-required">*</span>
                  <span className="ml-same-wrap">
                    <input type="checkbox" name="sameAsPhone" id="editSameCheck"
                      checked={form.sameAsPhone} onChange={handleChange} className="ml-form-checkbox" />
                    <label htmlFor="editSameCheck" className="ml-same-label">Same as phone</label>
                  </span>
                </label>
                <input className="ml-form-input" name="whatsapp" type="tel"
                  value={form.whatsapp} onChange={handleChange} disabled={form.sameAsPhone}
                  required={!form.sameAsPhone} />
              </div>
            </div>
            <div className="ml-form-grid-2">
              <div className="ml-form-field">
                <label className="ml-form-label">Email</label>
                <input className="ml-form-input" name="email" type="email"
                  placeholder="example@email.com" value={form.email} onChange={handleChange} />
              </div>
            </div>

            {/* Personal */}
            <div className="ml-form-section">Personal Details</div>
            <div className="ml-form-grid-3">
              <div className="ml-form-field">
                <label className="ml-form-label">Blood Group <span className="ml-required">*</span></label>
                <select className="ml-form-input ml-form-select" name="bloodGroup"
                  value={form.bloodGroup} onChange={handleChange} required>
                  <option value="">Select</option>
                  {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
                </select>
              </div>
              <div className="ml-form-field">
                <label className="ml-form-label">Date of Birth <span className="ml-required">*</span></label>
                <input className="ml-form-input" name="dob" type="date"
                  value={form.dob} onChange={handleChange} required />
              </div>
              <div className="ml-form-field">
                <label className="ml-form-label">Occupation <span className="ml-required">*</span></label>
                <input className="ml-form-input" name="occupation" value={form.occupation} onChange={handleChange} required />
              </div>
            </div>

            <div className="ml-form-grid-2">
              <div className="ml-form-field">
                <label className="ml-form-label">Engagement Date <span className="ml-required">*</span></label>
                <input className="ml-form-input" name="engagementDate" type="date"
                  value={form.engagementDate} onChange={handleChange} required />
              </div>
              <div className="ml-form-field">
                <label className="ml-form-label">Marriage Date <span className="ml-required">*</span></label>
                <input className="ml-form-input" name="marriageDate" type="date"
                  value={form.marriageDate} onChange={handleChange} required />
              </div>
            </div>

            <div className="ml-form-field">
              <label className="ml-form-checkbox-row">
                <input type="checkbox" name="outOfRajapalayam" checked={form.outOfRajapalayam}
                  onChange={handleChange} className="ml-form-checkbox" />
                <span>Lives outside Rajapalayam</span>
              </label>
            </div>

            {/* Local Address */}
            <div className="ml-form-section">Local Address (Rajapalayam)</div>
            <div className="ml-form-grid-2">
              <div className="ml-form-field">
                <label className="ml-form-label">Door No. <span className="ml-required">*</span></label>
                <input className="ml-form-input" name="localDoorNo" placeholder="Door / flat number"
                  value={form.localDoorNo} onChange={handleChange} required />
              </div>
              <div className="ml-form-field">
                <label className="ml-form-label">Area / Street <span className="ml-required">*</span></label>
                <input className="ml-form-input" name="localArea" placeholder="Area or street"
                  value={form.localArea} onChange={handleChange} required />
              </div>
            </div>
            <div className="ml-form-grid-3">
              <div className="ml-form-field">
                <label className="ml-form-label">City <span className="ml-required">*</span></label>
                <input className="ml-form-input" name="localCity" placeholder="City"
                  value={form.localCity} onChange={handleChange} required />
              </div>
              <div className="ml-form-field">
                <label className="ml-form-label">Pincode <span className="ml-required">*</span></label>
                <input className="ml-form-input" name="localPincode" placeholder="626117"
                  value={form.localPincode} onChange={handleChange} required />
              </div>
              <div className="ml-form-field">
                <label className="ml-form-label">State <span className="ml-required">*</span></label>
                <input className="ml-form-input" name="localState" placeholder="Tamil Nadu"
                  value={form.localState} onChange={handleChange} required />
              </div>
            </div>

            {/* Outside Address */}
            {form.outOfRajapalayam && (
              <>
                <div className="ml-form-section">Outside Address (Current Residence)</div>
                <div className="ml-form-grid-2">
                  <div className="ml-form-field">
                    <label className="ml-form-label">Door No. <span className="ml-required">*</span></label>
                    <input className="ml-form-input" name="outsideDoorNo" placeholder="Door / flat number"
                      value={form.outsideDoorNo} onChange={handleChange} required />
                  </div>
                  <div className="ml-form-field">
                    <label className="ml-form-label">Area / Street <span className="ml-required">*</span></label>
                    <input className="ml-form-input" name="outsideArea" placeholder="Area or street"
                      value={form.outsideArea} onChange={handleChange} required />
                  </div>
                </div>
                <div className="ml-form-grid-3">
                  <div className="ml-form-field">
                    <label className="ml-form-label">City <span className="ml-required">*</span></label>
                    <input className="ml-form-input" name="outsideCity" placeholder="City"
                      value={form.outsideCity} onChange={handleChange} required />
                  </div>
                  <div className="ml-form-field">
                    <label className="ml-form-label">Pincode <span className="ml-required">*</span></label>
                    <input className="ml-form-input" name="outsidePincode" placeholder="Pincode"
                      value={form.outsidePincode} onChange={handleChange} required />
                  </div>
                  <div className="ml-form-field">
                    <label className="ml-form-label">State <span className="ml-required">*</span></label>
                    <input className="ml-form-input" name="outsideState" placeholder="State"
                      value={form.outsideState} onChange={handleChange} required />
                  </div>
                </div>
              </>
            )}

          </div>

          <div className="ml-modal-footer">
            <button type="button" className="ml-btn ml-btn--ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="ml-btn ml-btn--primary" disabled={loading}>
              {loading ? <><span className="ml-spinner" /> Saving...</> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main MemberList ───────────────────────────────────────────────────────────
function MemberList() {
  const [members, setMembers] = useState([]);
  const [userTypes, setUserTypes] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState('active');
  const [filterUserType, setFilterUserType] = useState('');
  const [filterBloodGroup, setFilterBloodGroup] = useState('');
  const [filterOutside, setFilterOutside] = useState('');
  const [viewMember, setViewMember] = useState(null);
  const [editMember, setEditMember] = useState(null);
  const [assignDueMember, setAssignDueMember] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const handleDownloadId = async (member) => {
    setDownloadingId(member.id);
    try {
      await downloadMemberIdCard(member);
    } catch (err) {
      alert(`Could not generate ID card: ${err.message}`);
    } finally {
      setDownloadingId(null);
    }
  };

  // id → type_name lookup used in table and view modal
  const typeMap = Object.fromEntries(userTypes.map((t) => [t.id, t.type_name]));

  const loadMembers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [membersRes, typesRes, statusesRes, branchesRes] = await Promise.all([
        getMembers(),
        getUserTypes(),
        getMemberStatuses(),
        getBranches(),
      ]);
      setMembers(membersRes.data.data ?? []);
      const apiTypes = typesRes.data.data ?? [];
      setUserTypes(
        apiTypes.length > 0
          ? apiTypes
          : USER_TYPES.map((t) => ({ id: t.id, type_name: t.label }))
      );
      setStatuses(statusesRes.data.data ?? []);
      setBranches(branchesRes.data.data ?? []);
    } catch {
      setError('Failed to load members. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const isActiveMember = (m) => (m.status_name ? m.status_name.toLowerCase() === 'active' : !!m.is_active);

  const tabMembers = members.filter((m) => (statusTab === 'active' ? isActiveMember(m) : !isActiveMember(m)));

  const hasActiveFilters = !!(filterUserType || filterBloodGroup || filterOutside);

  const filtered = tabMembers
    .filter((m) => {
      const q = search.toLowerCase();
      return (
        m.name?.toLowerCase().includes(q) ||
        m.member_id?.toLowerCase().includes(q) ||
        m.phone?.includes(q)
      );
    })
    .filter((m) => !filterUserType || String(m.user_type_id) === filterUserType)
    .filter((m) => !filterBloodGroup || m.blood_group === filterBloodGroup)
    .filter((m) => !filterOutside || (filterOutside === 'yes' ? !!m.out_of_rajapalayam : !m.out_of_rajapalayam))
    .sort((a, b) => (a.member_id || '').localeCompare(b.member_id || '', undefined, { numeric: true }));

  const clearFilters = () => {
    setFilterUserType('');
    setFilterBloodGroup('');
    setFilterOutside('');
  };

  const handleEditSaved = () => {
    setEditMember(null);
    loadMembers();
  };

  return (
    <div className="ml-page">
      <div className="ml-page-header">
        <div className="ml-page-header-left">
          <div className="ml-page-header-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <h1 className="ml-page-title">Members</h1>
            <p className="ml-page-subtitle">
              {filtered.length === tabMembers.length
                ? `${tabMembers.length} member${tabMembers.length !== 1 ? 's' : ''} in this tab`
                : `${filtered.length} of ${tabMembers.length} member${tabMembers.length !== 1 ? 's' : ''} matching`}
            </p>
          </div>
        </div>

        <div className="ml-search-wrap">
          <svg className="ml-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="ml-search"
            placeholder="Search by name, ID or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="ml-tabs">
        <button
          className={`ml-tab-btn${statusTab === 'active' ? ' ml-tab-btn--active' : ''}`}
          onClick={() => setStatusTab('active')}
        >
          Active
        </button>
        <button
          className={`ml-tab-btn${statusTab === 'other' ? ' ml-tab-btn--active' : ''}`}
          onClick={() => setStatusTab('other')}
        >
          Other Statuses
        </button>
      </div>

      <div className="ml-filters">
        <select
          className="ml-filter-select"
          value={filterUserType}
          onChange={(e) => setFilterUserType(e.target.value)}
        >
          <option value="">All User Types</option>
          {userTypes.map((t) => (
            <option key={t.id} value={t.id}>{t.type_name}</option>
          ))}
        </select>
        <select
          className="ml-filter-select"
          value={filterBloodGroup}
          onChange={(e) => setFilterBloodGroup(e.target.value)}
        >
          <option value="">All Blood Groups</option>
          {BLOOD_GROUPS.map((bg) => (
            <option key={bg} value={bg}>{bg}</option>
          ))}
        </select>
        <select
          className="ml-filter-select"
          value={filterOutside}
          onChange={(e) => setFilterOutside(e.target.value)}
        >
          <option value="">All Locations</option>
          <option value="no">In Rajapalayam</option>
          <option value="yes">Outside Rajapalayam</option>
        </select>
        {hasActiveFilters && (
          <button type="button" className="ml-filter-clear" onClick={clearFilters}>
            Clear Filters
          </button>
        )}
      </div>

      {error && (
        <div className="ml-alert ml-alert--error">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      <div className="ml-table-wrap">
        {loading ? (
          <div className="ml-loading">
            <span className="ml-loading-spinner" />
            Loading members…
          </div>
        ) : filtered.length === 0 ? (
          <div className="ml-empty">
            {search || hasActiveFilters
              ? 'No members match your search or filters.'
              : statusTab === 'active'
                ? 'No active members found.'
                : 'No members with other statuses found.'}
          </div>
        ) : (
          <table className="ml-table">
            <thead>
              <tr>
                <th>Member ID</th>
                <th>Name</th>
                <th>User Type</th>
                <th>Phone</th>
                <th>Blood Group</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id}>
                  <td className="ml-td-id">{m.member_id}</td>
                  <td className="ml-td-name">
                    <div className="ml-name-cell">
                      <div className="ml-avatar">
                        {m.photo
                          ? <img src={resolveFileUrl(m.photo)} alt={m.name} className="ml-avatar-img" />
                          : (m.name || '?')[0].toUpperCase()}
                      </div>
                      <span>{m.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className="ml-type-badge">{typeMap[m.user_type_id] ?? `Type ${m.user_type_id}`}</span>
                  </td>
                  <td className="ml-td-phone">{m.phone || <span className="ml-nil">—</span>}</td>
                  <td>{m.blood_group || <span className="ml-nil">—</span>}</td>
                  <td>
                    {(() => {
                      const label = m.status_name || (m.is_active ? 'Active' : 'Inactive');
                      const isActiveLabel = label.toLowerCase() === 'active';
                      return (
                        <span className={`ml-status-badge ${isActiveLabel ? 'ml-status-badge--active' : 'ml-status-badge--inactive'}`}>
                          {label}
                        </span>
                      );
                    })()}
                  </td>
                  <td>
                    <div className="ml-actions">
                      <button
                        className="ml-action-btn ml-action-btn--view"
                        onClick={() => setViewMember(m)}
                        title="View details"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                          strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        View
                      </button>
                      <button
                        className="ml-action-btn ml-action-btn--edit"
                        onClick={() => setEditMember(m)}
                        title="Edit member"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                          strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        Edit
                      </button>
                      <button
                        className="ml-action-btn ml-action-btn--assign-due"
                        onClick={() => setAssignDueMember(m)}
                        title="View and assign dues"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                          strokeLinecap="round" strokeLinejoin="round">
                          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                          <rect x="8" y="2" width="8" height="4" rx="1" />
                          <line x1="12" y1="11" x2="12" y2="17" />
                          <line x1="9" y1="14" x2="15" y2="14" />
                        </svg>
                        Dues
                      </button>
                      <button
                        className="ml-action-btn ml-action-btn--download"
                        onClick={() => handleDownloadId(m)}
                        disabled={downloadingId === m.id}
                        title="Download ID Card"
                      >
                        {downloadingId === m.id ? (
                          <span className="ml-spinner ml-spinner--dark" />
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                            strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                        )}
                        {downloadingId === m.id ? 'Generating…' : 'ID Card'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {viewMember && (
        <ViewModal member={viewMember} typeMap={typeMap} onClose={() => setViewMember(null)} />
      )}
      {editMember && (
        <EditModal
          member={editMember}
          userTypes={userTypes}
          statuses={statuses}
          branches={branches}
          onClose={() => setEditMember(null)}
          onSaved={handleEditSaved}
        />
      )}
      {assignDueMember && (
        <AssignDueModal
          member={assignDueMember}
          onClose={() => setAssignDueMember(null)}
        />
      )}
    </div>
  );
}

export default MemberList;
