// Maps frontend form state to DB column names for members and addresses tables.

export const USER_TYPES = [
  { id: 1, label: 'Admin' },
  { id: 2, label: 'Member' },
  { id: 3, label: 'Committee' },
  { id: 4, label: 'President' },
];

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

/**
 * @typedef {Object} MemberFormState
 * @property {string} memberId        - Unique member identifier (e.g. PRMC-0001)
 * @property {string} userTypeId      - FK to user_types.id
 * @property {string} name            - Full name
 * @property {string} gotraId         - FK to gotras.id
 * @property {string} familyName      - Family / clan name
 * @property {string} fatherName      - Father's full name
 * @property {string} phone           - Phone number
 * @property {string} whatsapp        - WhatsApp number
 * @property {boolean} sameAsPhone    - Whether whatsapp === phone
 * @property {string} bloodGroup      - Blood group
 * @property {string} dob             - Date of birth (YYYY-MM-DD)
 * @property {string} occupation      - Occupation
 * @property {boolean} outOfRajapalayam - Lives outside Rajapalayam
 * @property {string} email           - Email address
 * @property {string} aadharNumber    - Aadhar card number (12 digits)
 * @property {string} engagementDate  - Engagement date (YYYY-MM-DD)
 * @property {string} marriageDate    - Marriage date (YYYY-MM-DD)
 * @property {string} localDoorNo     - Local address: door number
 * @property {string} localArea       - Local address: area
 * @property {string} localCity       - Local address: city
 * @property {string} localPincode    - Local address: pincode
 * @property {string} localState      - Local address: state
 * @property {string} outsideDoorNo   - Outside address: door number
 * @property {string} outsideArea     - Outside address: area
 * @property {string} outsideCity     - Outside address: city
 * @property {string} outsidePincode  - Outside address: pincode
 * @property {string} outsideState    - Outside address: state
 */

/** Converts form state to POST /members request body. */
export function toMemberPayload(form) {
  return {
    member_id: form.memberId,
    user_type_id: Number(form.userTypeId),
    name: form.name,
    family_name: form.familyName || null,
    father_name: form.fatherName || null,
    phone: form.phone || null,
    whatsapp: form.whatsapp || null,
    blood_group: form.bloodGroup || null,
    dob: form.dob || null,
    occupation: form.occupation || null,
    out_of_rajapalayam: Boolean(form.outOfRajapalayam),
    email: form.email || null,
    aadhar_number: form.aadharNumber || null,
    engagement_date: form.engagementDate || null,
    marriage_date: form.marriageDate || null,
    status_id: form.statusId ? Number(form.statusId) : null,
    gotra_id: form.gotraId ? Number(form.gotraId) : null,
    branch_id: form.branchId ? Number(form.branchId) : null,
  };
}

/** Converts form state to POST /addresses request body for local address. */
export function toLocalAddressPayload(memberId, form) {
  return {
    member_id: memberId,
    type: 'local',
    door_no: form.localDoorNo || null,
    area: form.localArea || null,
    city: form.localCity || null,
    pincode: form.localPincode || null,
    state: form.localState || null,
  };
}

/** Converts form state to POST /addresses request body for outside address. */
export function toOutsideAddressPayload(memberId, form) {
  return {
    member_id: memberId,
    type: 'outside',
    door_no: form.outsideDoorNo || null,
    area: form.outsideArea || null,
    city: form.outsideCity || null,
    pincode: form.outsidePincode || null,
    state: form.outsideState || null,
  };
}

/** Returns true if any local address field is filled. */
export function hasLocalAddress(form) {
  return !!(form.localDoorNo || form.localArea || form.localCity || form.localPincode || form.localState);
}

/** Returns true if any outside address field is filled. */
export function hasOutsideAddress(form) {
  return !!(form.outsideDoorNo || form.outsideArea || form.outsideCity || form.outsidePincode || form.outsideState);
}
