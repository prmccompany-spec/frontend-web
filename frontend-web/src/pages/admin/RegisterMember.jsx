import { useState, useEffect } from 'react';
import {
  USER_TYPES,
  BLOOD_GROUPS,
  toMemberPayload,
  toLocalAddressPayload,
  toOutsideAddressPayload,
  hasLocalAddress,
  hasOutsideAddress,
} from '../../types/member';
import { createMember, createAddress, uploadMemberPhoto, createPendingPayment } from '../../services/memberService';
import { getUserTypes } from '../../services/userTypeService';
import './RegisterMember.css';

const initialForm = {
  memberId: '',
  userTypeId: '',
  name: '',
  gotra: '',
  familyName: '',
  fatherName: '',
  phone: '',
  whatsapp: '',
  sameAsPhone: false,
  bloodGroup: '',
  dob: '',
  occupation: '',
  outOfRajapalayam: false,
  email: '',
  aadharNumber: '',
  engagementDate: '',
  marriageDate: '',
  localDoorNo: '',
  localArea: '',
  localCity: '',
  localPincode: '',
  localState: '',
  outsideDoorNo: '',
  outsideArea: '',
  outsideCity: '',
  outsidePincode: '',
  outsideState: '',
};

function RegisterMember() {
  const [form, setForm] = useState(initialForm);
  const [pendingItems, setPendingItems] = useState([]);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [userTypes, setUserTypes] = useState([]);

  useEffect(() => {
    getUserTypes()
      .then((res) => {
        const apiTypes = res.data.data ?? [];
        if (apiTypes.length > 0) {
          setUserTypes(apiTypes);
        } else {
          // fallback to hardcoded types if DB is empty
          setUserTypes(USER_TYPES.map((t) => ({ id: t.id, type_name: t.label })));
        }
      })
      .catch(() => {
        setUserTypes(USER_TYPES.map((t) => ({ id: t.id, type_name: t.label })));
      });
  }, []);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handlePhotoRemove = () => {
    setPhoto(null);
    setPhotoPreview('');
  };

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

  const addPendingItem = () =>
    setPendingItems((prev) => [...prev, { title: '', amount: '', dueDate: '' }]);

  const removePendingItem = (index) =>
    setPendingItems((prev) => prev.filter((_, i) => i !== index));

  const handlePendingChange = (index, field, value) =>
    setPendingItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // 1. Create member record
      const memberRes = await createMember(toMemberPayload(form));
      const memberId = memberRes.data.memberId;

      // 2. Create local address if any field is filled
      if (hasLocalAddress(form)) {
        await createAddress(toLocalAddressPayload(memberId, form));
      }

      // 3. Create outside address if member lives outside Rajapalayam
      if (form.outOfRajapalayam && hasOutsideAddress(form)) {
        await createAddress(toOutsideAddressPayload(memberId, form));
      }

      // 4. Upload photo if selected
      if (photo) {
        const fd = new FormData();
        fd.append('photo', photo);
        await uploadMemberPhoto(memberId, fd);
      }

      // 5. Create pending payment entries
      for (const item of pendingItems) {
        if (item.title.trim() && Number(item.amount) > 0) {
          await createPendingPayment({
            member_id: memberId,
            title: item.title.trim(),
            amount: Number(item.amount),
            due_date: item.dueDate || null,
          });
        }
      }

      setSuccess(`Member "${form.name}" registered successfully (ID: ${form.memberId}).`);
      setForm(initialForm);
      setPendingItems([]);
      setPhoto(null);
      setPhotoPreview('');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rm-page">
      <div className="rm-page-header">
        <div className="rm-page-header-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <div>
          <h1 className="rm-page-title">Register Member</h1>
          <p className="rm-page-subtitle">Add a new member to the PRMCF registry</p>
        </div>
      </div>

      {error && (
        <div className="rm-alert rm-alert--error">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      {success && (
        <div className="rm-alert rm-alert--success">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="rm-form">

        {/* ── Core Details ── */}
        <div className="rm-card">
          <div className="rm-section-label">Core Details</div>

          <div className="rm-grid-3">
            <div className="rm-field">
              <label className="rm-label">
                Member ID <span className="rm-required">*</span>
              </label>
              <input
                className="rm-input"
                name="memberId"
                placeholder="e.g. PRMC-0001"
                value={form.memberId}
                onChange={handleChange}
                required
              />
            </div>

            <div className="rm-field">
              <label className="rm-label">
                Full Name <span className="rm-required">*</span>
              </label>
              <input
                className="rm-input"
                name="name"
                placeholder="Full name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="rm-field">
              <label className="rm-label">
                User Type <span className="rm-required">*</span>
              </label>
              <select
                className="rm-input rm-select"
                name="userTypeId"
                value={form.userTypeId}
                onChange={handleChange}
                required
              >
                <option value="">Select type</option>
                {userTypes.map((ut) => (
                  <option key={ut.id} value={ut.id}>
                    {ut.type_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── Identity ── */}
        <div className="rm-card">
          <div className="rm-section-label">Identity</div>

          <div className="rm-grid-3">
            <div className="rm-field">
              <label className="rm-label">Gotra <span className="rm-required">*</span></label>
              <input
                className="rm-input"
                name="gotra"
                placeholder="Enter gotra"
                value={form.gotra}
                onChange={handleChange}
                required
              />
            </div>
            <div className="rm-field">
              <label className="rm-label">Family Name <span className="rm-required">*</span></label>
              <input
                className="rm-input"
                name="familyName"
                placeholder="Family / clan name"
                value={form.familyName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="rm-field">
              <label className="rm-label">Father's Name <span className="rm-required">*</span></label>
              <input
                className="rm-input"
                name="fatherName"
                placeholder="Father's full name"
                value={form.fatherName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="rm-grid-2">
            <div className="rm-field">
              <label className="rm-label">Aadhar Number <span className="rm-required">*</span></label>
              <input
                className="rm-input"
                name="aadharNumber"
                placeholder="12-digit Aadhar number"
                maxLength={12}
                value={form.aadharNumber}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </div>

        {/* ── Contact ── */}
        <div className="rm-card">
          <div className="rm-section-label">Contact</div>

          <div className="rm-grid-2">
            <div className="rm-field">
              <label className="rm-label">Phone Number <span className="rm-required">*</span></label>
              <input
                className="rm-input"
                name="phone"
                type="tel"
                placeholder="+91 XXXXX XXXXX"
                value={form.phone}
                onChange={handleChange}
                required
              />
            </div>
            <div className="rm-field">
              <label className="rm-label">
                WhatsApp Number <span className="rm-required">*</span>
                <span className="rm-same-wrap">
                  <input
                    type="checkbox"
                    name="sameAsPhone"
                    id="sameCheck"
                    checked={form.sameAsPhone}
                    onChange={handleChange}
                    className="rm-checkbox"
                  />
                  <label htmlFor="sameCheck" className="rm-same-label">Same as phone</label>
                </span>
              </label>
              <input
                className="rm-input"
                name="whatsapp"
                type="tel"
                placeholder="+91 XXXXX XXXXX"
                value={form.whatsapp}
                onChange={handleChange}
                disabled={form.sameAsPhone}
                required={!form.sameAsPhone}
              />
            </div>
          </div>

          <div className="rm-grid-2">
            <div className="rm-field">
              <label className="rm-label">Email Address</label>
              <input
                className="rm-input"
                name="email"
                type="email"
                placeholder="example@email.com"
                value={form.email}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>
  <div className="rm-card rm-card--photo">
          <div className="rm-section-label">Member Photo</div>
          <div className="rm-photo-row">
            <div
              className={`rm-photo-zone ${photoPreview ? 'rm-photo-zone--filled' : ''}`}
              onClick={() => document.getElementById('rm-photo-input').click()}
            >
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="rm-photo-preview" />
              ) : (
                <div className="rm-photo-placeholder">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="3" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <span>Click to upload</span>
                  <span className="rm-photo-hint">JPG, PNG or WebP · max 5 MB</span>
                </div>
              )}
              {photoPreview && (
                <div className="rm-photo-overlay">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Change
                </div>
              )}
            </div>
            <input
              id="rm-photo-input"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={handlePhotoChange}
            />
            <div className="rm-photo-info">
              <p className="rm-photo-info-title">
                {photoPreview ? photo?.name : 'No photo selected'}
              </p>
              <p className="rm-photo-info-sub">
                {photoPreview
                  ? `${(photo.size / 1024).toFixed(0)} KB`
                  : 'Upload a clear passport-size photo of the member (optional).'}
              </p>
              {photoPreview && (
                <button type="button" className="rm-photo-remove" onClick={handlePhotoRemove}>
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
        {/* ── Personal Details ── */}
        <div className="rm-card">
          <div className="rm-section-label">Personal Details</div>

          <div className="rm-grid-3">
            <div className="rm-field">
              <label className="rm-label">Blood Group <span className="rm-required">*</span></label>
              <select
                className="rm-input rm-select"
                name="bloodGroup"
                value={form.bloodGroup}
                onChange={handleChange}
                required
              >
                <option value="">Select</option>
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
            <div className="rm-field">
              <label className="rm-label">Date of Birth <span className="rm-required">*</span></label>
              <input
                className="rm-input"
                name="dob"
                type="date"
                value={form.dob}
                onChange={handleChange}
                required
              />
            </div>
            <div className="rm-field">
              <label className="rm-label">Occupation <span className="rm-required">*</span></label>
              <input
                className="rm-input"
                name="occupation"
                placeholder="e.g. Engineer"
                value={form.occupation}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="rm-grid-2">
            <div className="rm-field">
              <label className="rm-label">Engagement Date <span className="rm-required">*</span></label>
              <input
                className="rm-input"
                name="engagementDate"
                type="date"
                value={form.engagementDate}
                onChange={handleChange}
                required
              />
            </div>
            <div className="rm-field">
              <label className="rm-label">Marriage Date <span className="rm-required">*</span></label>
              <input
                className="rm-input"
                name="marriageDate"
                type="date"
                value={form.marriageDate}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="rm-field rm-field--checkbox">
            <label className="rm-checkbox-row">
              <input
                type="checkbox"
                name="outOfRajapalayam"
                checked={form.outOfRajapalayam}
                onChange={handleChange}
                className="rm-checkbox"
              />
              <span className="rm-checkbox-label">Member lives outside Rajapalayam</span>
            </label>
          </div>
        </div>

        {/* ── Local Address ── */}
        <div className="rm-card">
          <div className="rm-section-label">Local Address (Rajapalayam)</div>

          <div className="rm-grid-2">
            <div className="rm-field">
              <label className="rm-label">Door No. <span className="rm-required">*</span></label>
              <input
                className="rm-input"
                name="localDoorNo"
                placeholder="Door / flat number"
                value={form.localDoorNo}
                onChange={handleChange}
                required
              />
            </div>
            <div className="rm-field">
              <label className="rm-label">Area / Street <span className="rm-required">*</span></label>
              <input
                className="rm-input"
                name="localArea"
                placeholder="Area or street name"
                value={form.localArea}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="rm-grid-3">
            <div className="rm-field">
              <label className="rm-label">City <span className="rm-required">*</span></label>
              <input
                className="rm-input"
                name="localCity"
                placeholder="City"
                value={form.localCity}
                onChange={handleChange}
                required
              />
            </div>
            <div className="rm-field">
              <label className="rm-label">Pincode <span className="rm-required">*</span></label>
              <input
                className="rm-input"
                name="localPincode"
                placeholder="626117"
                value={form.localPincode}
                onChange={handleChange}
                required
              />
            </div>
            <div className="rm-field">
              <label className="rm-label">State <span className="rm-required">*</span></label>
              <input
                className="rm-input"
                name="localState"
                placeholder="Tamil Nadu"
                value={form.localState}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </div>

        {/* ── Outside Address (conditional) ── */}
        {form.outOfRajapalayam && (
          <div className="rm-card rm-card--outside">
            <div className="rm-section-label rm-section-label--outside">
              Outside Address (Current Residence)
            </div>

            <div className="rm-grid-2">
              <div className="rm-field">
                <label className="rm-label">Door No. <span className="rm-required">*</span></label>
                <input
                  className="rm-input"
                  name="outsideDoorNo"
                  placeholder="Door / flat number"
                  value={form.outsideDoorNo}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="rm-field">
                <label className="rm-label">Area / Street <span className="rm-required">*</span></label>
                <input
                  className="rm-input"
                  name="outsideArea"
                  placeholder="Area or street name"
                  value={form.outsideArea}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="rm-grid-3">
              <div className="rm-field">
                <label className="rm-label">City <span className="rm-required">*</span></label>
                <input
                  className="rm-input"
                  name="outsideCity"
                  placeholder="City"
                  value={form.outsideCity}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="rm-field">
                <label className="rm-label">Pincode <span className="rm-required">*</span></label>
                <input
                  className="rm-input"
                  name="outsidePincode"
                  placeholder="Pincode"
                  value={form.outsidePincode}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="rm-field">
                <label className="rm-label">State <span className="rm-required">*</span></label>
                <input
                  className="rm-input"
                  name="outsideState"
                  placeholder="State"
                  value={form.outsideState}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Pending Payments ── */}
        <div className="rm-card">
          <div className="rm-section-label">Pending Payments (Dues)</div>
          <p className="rm-pending-hint">
            Add any amounts this member still owes — annual fee, marriage certificate payment, etc.
          </p>

          {pendingItems.map((item, index) => (
            <div className="rm-pending-row" key={index}>
              <div className="rm-field">
                <label className="rm-label">Payment For <span className="rm-required">*</span></label>
                <input
                  className="rm-input"
                  placeholder="e.g. Annual Fee"
                  value={item.title}
                  onChange={(e) => handlePendingChange(index, 'title', e.target.value)}
                  required
                />
              </div>
              <div className="rm-field">
                <label className="rm-label">Amount (₹) <span className="rm-required">*</span></label>
                <input
                  className="rm-input"
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="0.00"
                  value={item.amount}
                  onChange={(e) => handlePendingChange(index, 'amount', e.target.value)}
                  required
                />
              </div>
              <div className="rm-field">
                <label className="rm-label">Due Date</label>
                <input
                  className="rm-input"
                  type="date"
                  value={item.dueDate}
                  onChange={(e) => handlePendingChange(index, 'dueDate', e.target.value)}
                />
              </div>
              <button
                type="button"
                className="rm-pending-remove"
                onClick={() => removePendingItem(index)}
                aria-label="Remove item"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}

          <button type="button" className="rm-pending-add" onClick={addPendingItem}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Pending Payment
          </button>

          {pendingItems.length > 0 && (
            <div className="rm-pending-total">
              Total pending: ₹
              {pendingItems
                .reduce((s, i) => s + (Number(i.amount) || 0), 0)
                .toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          )}
        </div>

        <div className="rm-actions">
          <button type="button" className="rm-btn rm-btn--secondary"
            onClick={() => { setForm(initialForm); setPendingItems([]); }}>
            Clear Form
          </button>
          <button type="submit" className="rm-btn rm-btn--primary" disabled={loading}>
            {loading ? (
              <><span className="rm-spinner" /> Registering...</>
            ) : (
              'Register Member'
            )}
          </button>
        </div>

      </form>
    </div>
  );
}

export default RegisterMember;
