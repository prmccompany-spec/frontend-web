import { jsPDF } from 'jspdf';
import idFront from '../assets/ID_front.png';
import idBack from '../assets/ID_Back.png';

const BACKEND_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api').replace(/\/api$/, '');

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

function imageToDataURL(img) {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL('image/png');
}

/**
 * Downloads a two-page PDF ID card for the given member.
 * Page 1: front template with QR code + member name overlaid.
 * Page 2: back template as-is.
 */
export async function downloadMemberIdCard(member) {
  if (!member) throw new Error('No member provided');

  const qrPath = member.qr_code || member.qrCode;
  if (!qrPath) throw new Error('Member has no QR code');

  const qrSrc = qrPath.startsWith('http') ? qrPath : `${BACKEND_BASE}/${qrPath}`;

  // Load all images in parallel
  const [frontImg, backImg, qrImg] = await Promise.all([
    loadImage(idFront),
    loadImage(idBack),
    loadImage(qrSrc),
  ]);

  const frontDataURL = imageToDataURL(frontImg);
  const backDataURL = imageToDataURL(backImg);
  const qrDataURL = imageToDataURL(qrImg);

  // Use front image's natural dimensions to preserve aspect ratio
  const imgW = frontImg.naturalWidth;
  const imgH = frontImg.naturalHeight;

  // CR80 card dimensions at 300 DPI → use mm for jsPDF
  // We'll make the PDF page exactly match the template's aspect ratio.
  // Standard credit-card ratio ≈ 85.6 × 54 mm; use A6 landscape or custom.
  // Here we set a custom page size matching the image ratio (max 160 mm wide).
  const PAGE_W = 160; // mm
  const PAGE_H = Math.round((imgH / imgW) * PAGE_W * 10) / 10;

  const pdf = new jsPDF({
    orientation: PAGE_W >= PAGE_H ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [PAGE_W, PAGE_H],
  });

  // ── Page 1: Front ──────────────────────────────────────────────────────────
  pdf.addImage(frontDataURL, 'PNG', 0, 0, PAGE_W, PAGE_H, undefined, 'FAST');

  // Bottom red section layout (side-by-side):
  //   LEFT  → Member Name + Member ID (white text, left-aligned)
  //   RIGHT → QR Code
  const RED_TOP    = PAGE_H * 0.50;          // start of red section
  const RED_H      = PAGE_H - RED_TOP;       // height of red section
  const MARGIN     = PAGE_W * 0.05;          // edge padding

  // QR: sized to fit comfortably inside the red section with padding
  const QR_SIZE    = Math.min(RED_H * 0.78, PAGE_W * 0.20);
  const qrX        = PAGE_W - QR_SIZE - MARGIN;
  const qrY        = RED_TOP + (RED_H - QR_SIZE) / 2;   // vertically centred in red section

  pdf.addImage(qrDataURL, 'PNG', qrX, qrY, QR_SIZE, QR_SIZE, undefined, 'FAST');

  const memberName = member.name || member.memberName || '';
  const memberId   = member.member_id || member.memberId || '';

  // Text block vertically centred in the red section, left side
  const fontSize   = 11;                               // pt — single size for both lines
  const lineGap    = 7;                                // mm between the two lines
  const ptToMm     = 0.352;
  const lineH      = fontSize * ptToMm;
  const blockH     = lineH + lineGap + lineH;
  const line1Y     = RED_TOP + (RED_H - blockH) / 2 + lineH;
  const line2Y     = line1Y + lineGap;
  const textX      = MARGIN;
  const maxTextW   = qrX - MARGIN * 2;                // never overlaps QR

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(fontSize);

  // Label in normal weight, value in bold — on the same line
  pdf.setFont('helvetica', 'normal');
  pdf.text('Member Name : ', textX, line1Y);
  const labelNameW = pdf.getTextWidth('Member Name : ');
  pdf.setFont('helvetica', 'bold');
  pdf.text(memberName, textX + labelNameW, line1Y, { maxWidth: maxTextW - labelNameW });

  pdf.setFont('helvetica', 'normal');
  pdf.text('Member ID : ', textX, line2Y);
  const labelIdW = pdf.getTextWidth('Member ID : ');
  pdf.setFont('helvetica', 'bold');
  pdf.text(memberId, textX + labelIdW, line2Y, { maxWidth: maxTextW - labelIdW });

  // ── Page 2: Back ──────────────────────────────────────────────────────────
  pdf.addPage([PAGE_W, PAGE_H], PAGE_W >= PAGE_H ? 'landscape' : 'portrait');
  pdf.addImage(backDataURL, 'PNG', 0, 0, PAGE_W, PAGE_H, undefined, 'FAST');

  const safeName = memberName.replace(/[^a-zA-Z0-9 _-]/g, '').trim().replace(/\s+/g, '_');
  pdf.save(`${safeName || 'Member'}_ID_Card.pdf`);
}
