const DEFAULT_COUNTRY_CODE = process.env.DEFAULT_COUNTRY_CODE || '+91';

export const toE164 = (phone) => {
  const digits = String(phone).replace(/\D/g, '');
  if (String(phone).trim().startsWith('+')) {
    return `+${digits}`;
  }
  return `${DEFAULT_COUNTRY_CODE}${digits}`;
};
