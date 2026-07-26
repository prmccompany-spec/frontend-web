// Shared search/sort behavior for every member list, dropdown and picker in
// the app. member_id is typically typed or scanned as a raw number (QR
// codes, manual entry) — a fuzzy substring match on it is wrong, since "1"
// would also match "10", "11", "171", etc. When the query is purely numeric
// we match the id exactly instead; otherwise we fall back to a fuzzy
// substring match on the given text fields (name, phone, etc).

export const isNumericQuery = (query) => /^\d+$/.test(query.trim());

export const matchesIdOrText = (idValue, textValues, query) => {
  const q = query.trim();
  if (!q) return true;
  if (isNumericQuery(q)) {
    return String(idValue ?? '') === q;
  }
  const lower = q.toLowerCase();
  return textValues.some((value) => value?.toLowerCase().includes(lower));
};

export const sortByMemberId = (list, idKey = 'member_id') =>
  [...list].sort((a, b) => Number(a[idKey]) - Number(b[idKey]));
