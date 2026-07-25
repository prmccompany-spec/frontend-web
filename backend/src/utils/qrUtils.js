import QRCode from 'qrcode';
import { uploadBuffer } from './cloudinaryUtils.js';

export const generateMemberQR = async ({ memberTableId, memberId, name }) => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const safeName = name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
  const publicId = `${memberId}_${dateStr}_${safeName}`;

  const buffer = await QRCode.toBuffer(String(memberTableId), {
    width: 300,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' },
  });

  const result = await uploadBuffer(buffer, {
    folder: 'org/qrcodes',
    public_id: publicId,
    resource_type: 'image',
  });

  return result.secure_url;
};
