import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import logo from '../assets/logo.png';
import { loadImage, imageToDataURL } from './imageUtils';

const ORG_NAME = "Palayapalayam Raju's Mahumai Common Fund";
const BRAND_RED = [220, 53, 69];

const fmt = (val) =>
  Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const paymentModeLabel = (m) => (m === 'qr' ? 'QR Code' : m === 'cash' ? 'Cash' : '—');

/**
 * Downloads a one-page settlement receipt for a single returned rental.
 * Only meaningful once a rental is settled (status 'returned') — an
 * active rental has no final amount/settlement to receipt yet.
 */
export async function downloadRentalReceipt(rental) {
  if (!rental) throw new Error('No rental provided');
  if (rental.status !== 'returned') {
    throw new Error('A receipt is only available for a settled (returned) rental');
  }

  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 48;
  let y = margin;

  let logoDataUrl = null;
  try {
    logoDataUrl = imageToDataURL(await loadImage(logo));
  } catch {
    // Logo is decorative — a receipt without it is still valid.
  }

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', margin, y - 6, 38, 38);
  }
  const textX = logoDataUrl ? margin + 48 : margin;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(20, 20, 20);
  doc.text(ORG_NAME, textX, y + 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(130, 130, 130);
  doc.text('Rental Asset Settlement Receipt', textX, y + 22);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...BRAND_RED);
  doc.text(rental.rental_ref || '—', pageWidth - margin, y + 8, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(130, 130, 130);
  doc.text(`Issued ${fmtDateTime(new Date())}`, pageWidth - margin, y + 22, { align: 'right' });

  y += 48;
  doc.setDrawColor(...BRAND_RED);
  doc.setLineWidth(1.4);
  doc.line(margin, y, pageWidth - margin, y);
  y += 28;

  const renterName = rental.member_name || rental.renter_name || '—';
  const renterCode = rental.member_code ? `Member #${rental.member_code}` : 'Non-member';

  const labelValue = (label, value, x, valueY) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(150, 150, 150);
    doc.text(label.toUpperCase(), x, valueY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    doc.text(String(value ?? '—'), x, valueY + 15);
  };

  const colW = (pageWidth - margin * 2) / 2;
  labelValue('Rented To', renterName, margin, y);
  labelValue('Member Status', renterCode, margin + colW, y);
  y += 40;
  labelValue('Asset', rental.product_name, margin, y);
  labelValue('Rate', `₹${fmt(rental.rate_amount)} / ${rental.rate_type}`, margin + colW, y);
  y += 40;
  labelValue('Rented From', fmtDateTime(rental.start_date), margin, y);
  labelValue('Returned On', fmtDateTime(rental.end_date), margin + colW, y);
  y += 40;
  labelValue('Collected By', rental.collected_by_name || '—', margin, y);
  labelValue('Settled At', fmtDateTime(rental.returned_at), margin + colW, y);
  y += 34;

  autoTable(doc, {
    startY: y,
    head: [['Description', 'Payment Mode', 'Amount (₹)']],
    body: [
      ['Advance (collected at booking)', paymentModeLabel(rental.advance_payment_type), Number(rental.advance_amount) > 0 ? fmt(rental.advance_amount) : '—'],
      ['Balance (collected at return)', paymentModeLabel(rental.settlement_payment_type), fmt(Number(rental.amount) - Number(rental.advance_amount))],
    ],
    foot: [['Total Settled', '', fmt(rental.amount)]],
    styles: { font: 'helvetica', fontSize: 10, cellPadding: 8 },
    headStyles: { fillColor: BRAND_RED, textColor: 255, fontStyle: 'bold' },
    footStyles: { fillColor: [40, 40, 40], textColor: 255, fontStyle: 'bold' },
    columnStyles: { 2: { halign: 'right' } },
    margin: { left: margin, right: margin },
  });

  y = doc.lastAutoTable.finalY + 24;

  if (rental.notes) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('NOTES', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(60, 60, 60);
    const lines = doc.splitTextToSize(rental.notes, pageWidth - margin * 2);
    doc.text(lines, margin, y + 14);
    y += 14 + lines.length * 12 + 14;
  }

  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.line(margin, pageHeight - 60, pageWidth - margin, pageHeight - 60);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`${ORG_NAME} — This is a system-generated receipt.`, margin, pageHeight - 44);

  doc.save(`receipt-${rental.rental_ref || rental.id}.pdf`);
}
