import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and WebP images are allowed'), false);
  }
};

// ── Member photo upload ───────────────────────────────
const PHOTO_DIR = path.join(__dirname, '../../uploads/members');

const memberStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(PHOTO_DIR)) fs.mkdirSync(PHOTO_DIR, { recursive: true });
    cb(null, PHOTO_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `member_${req.params.id}_${Date.now()}${ext}`);
  },
});

export const uploadPhoto = multer({
  storage: memberStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ── Event image upload ────────────────────────────────
const EVENT_IMG_DIR = path.join(__dirname, '../../uploads/events');

const eventStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(EVENT_IMG_DIR)) fs.mkdirSync(EVENT_IMG_DIR, { recursive: true });
    cb(null, EVENT_IMG_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const id = req.params.id || Date.now();
    cb(null, `event_${id}_${Date.now()}${ext}`);
  },
});

export const uploadEventImage = multer({
  storage: eventStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ── Service offline form template upload (admin) ──────
const SERVICE_FORM_DIR = path.join(__dirname, '../../uploads/services');

const serviceFormFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed for the offline form'), false);
  }
};

const serviceFormStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(SERVICE_FORM_DIR)) fs.mkdirSync(SERVICE_FORM_DIR, { recursive: true });
    cb(null, SERVICE_FORM_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, `service_${req.params.id}_${Date.now()}.pdf`);
  },
});

export const uploadServiceForm = multer({
  storage: serviceFormStorage,
  fileFilter: serviceFormFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// ── Service request document uploads (member submission) ──
const REQUEST_DOC_DIR = path.join(__dirname, '../../uploads/service-requests');

const requestDocFilter = (req, file, cb) => {
  const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, JPEG, PNG, and WebP files are allowed'), false);
  }
};

const requestDocStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(REQUEST_DOC_DIR)) fs.mkdirSync(REQUEST_DOC_DIR, { recursive: true });
    cb(null, REQUEST_DOC_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}_${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

// Field names are dynamic (offline_form, document_<service_document_id>),
// so we accept any field and let the service layer validate which ones
// are actually required for the target service.
export const uploadRequestDocuments = multer({
  storage: requestDocStorage,
  fileFilter: requestDocFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
}).any();
