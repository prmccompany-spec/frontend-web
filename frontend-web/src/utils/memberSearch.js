// Shared search/sort behavior for every member list, dropdown and picker in
// the app. member_id is typically typed or scanned as a raw number (QR
// codes, manual entry) — a fuzzy substring match on it is wrong, since "1"
// would also match "10", "11", "171", etc. When the query is purely numeric
// we match the id exactly instead; otherwise we fall back to a fuzzy
// substring match on the given text fields (name, etc).
//
// A phone number is also all-digits, so it can't just be folded into
// textValues — under the numeric branch that would only ever get compared
// against the id (never matching, since a phone number is never equal to a
// member_id) and it would never be reached under the text branch (a phone
// query is never non-numeric). It gets its own parameter instead.
//
// A naive substring match against phone at any query length re-creates the
// exact collision problem this module exists to avoid: "1" is a substring
// of nearly every 10-digit phone number, so a short id-length query would
// spuriously match almost everyone's phone. member_ids here are short
// sequential numbers (currently up to ~4 digits) while phone numbers are
// always 10 digits, so a query can't plausibly be both — only queries too
// long to be an id (5+ digits) are eligible to match against phone.

export const isNumericQuery = (query) => /^\d+$/.test(query.trim());

const MIN_PHONE_QUERY_LENGTH = 5;

export const matchesIdOrText = (idValue, textValues, query, phoneValue) => {
  const q = query.trim();
  if (!q) return true;
  if (isNumericQuery(q)) {
    if (String(idValue ?? '') === q) return true;
    if (q.length < MIN_PHONE_QUERY_LENGTH) return false;
    return !!phoneValue && phoneValue.includes(q);
  }
  const lower = q.toLowerCase();
  return textValues.some((value) => value?.toLowerCase().includes(lower));
};

export const sortByMemberId = (list, idKey = 'member_id') =>
  [...list].sort((a, b) => Number(a[idKey]) - Number(b[idKey]));
