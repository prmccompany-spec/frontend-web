import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const QR_DIR = path.join(__dirname, '../../uploads/qrcodes');

export const generateMemberQR = async ({ memberTableId, memberId, name }) => {
  if (!fs.existsSync(QR_DIR)) {
    fs.mkdirSync(QR_DIR, { recursive: true });
  }

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const safeName = name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
  const filename = `${memberId}_${dateStr}_${safeName}.png`;
  const filepath = path.join(QR_DIR, filename);

  await QRCode.toFile(filepath, String(memberTableId), {
    width: 300,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' },
  });

  return `uploads/qrcodes/${filename}`;
};
