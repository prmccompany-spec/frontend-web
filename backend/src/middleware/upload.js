import multer from 'multer';

// Files are buffered in memory and streamed to Cloudinary by the controller —
// nothing is written to local disk anymore.

const imageFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and WebP images are allowed'), false);
  }
};

// ── Member photo upload ───────────────────────────────
export const uploadPhoto = multer({
  storage: multer.memoryStorage(),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ── Event image upload ────────────────────────────────
export const uploadEventImage = multer({
  storage: multer.memoryStorage(),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ── Service offline form template upload (admin) ──────
const serviceFormFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed for the offline form'), false);
  }
};

export const uploadServiceForm = multer({
  storage: multer.memoryStorage(),
  fileFilter: serviceFormFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// ── Service request document uploads (member submission) ──
const requestDocFilter = (req, file, cb) => {
  const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, JPEG, PNG, and WebP files are allowed'), false);
  }
};

// Field names are dynamic (offline_form, document_<service_document_id>),
// so we accept any field and let the service layer validate which ones
// are actually required for the target service.
export const uploadRequestDocuments = multer({
  storage: multer.memoryStorage(),
  fileFilter: requestDocFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
}).any();
