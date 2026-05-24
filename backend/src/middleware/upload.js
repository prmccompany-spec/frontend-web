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
