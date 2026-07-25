const BACKEND_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api').replace(/\/api$/, '');

// Cloudinary URLs are stored in full already; only legacy rows created
// before the Cloudinary migration hold a relative local-disk path.
export const resolveFileUrl = (path) => {
  if (!path) return '';
  return path.startsWith('http') ? path : `${BACKEND_BASE}/${path}`;
};
