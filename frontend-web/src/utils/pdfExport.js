import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import logo from '../assets/logo.png';
import { loadImage, imageToDataURL } from './imageUtils';

const ORG_NAME = "Palayapalayam Raju's Mahumai Common Fund";
const BRAND_RED = [220, 53, 69];

// Cached across calls in the same session — the logo never changes and
// re-decoding it on every export is wasted work.
let logoDataUrlPromise = null;
const getLogoDataUrl = () => {
  if (!logoDataUrlPromise) {
    logoDataUrlPromise = loadImage(logo).then(imageToDataURL).catch(() => null);
  }
  return logoDataUrlPromise;
};

const timestamp = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
};

// Draws the branded header (logo + org name + report title + generated-at
// + active filter summary) and returns the Y position the table should
// start at. Shared by every page's export so every PDF in the app looks
// the same regardless of which table it came from.
const drawHeader = (doc, { title, subtitle, summary }, logoDataUrl) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = margin;

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', margin, y - 6, 34, 34);
  }
  const textX = logoDataUrl ? margin + 44 : margin;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(20, 20, 20);
  doc.text(ORG_NAME, textX, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(130, 130, 130);
  doc.text('Admin Panel Report', textX, y + 22);

  y += 42;
  doc.setDrawColor(...BRAND_RED);
  doc.setLineWidth(1.2);
  doc.line(margin, y, pageWidth - margin, y);
  y += 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(20, 20, 20);
  doc.text(title, margin, y);
  y += 16;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(130, 130, 130);
  const generated = `Generated ${new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
  doc.text(generated, margin, y);
  if (subtitle) {
    doc.text(subtitle, pageWidth - margin, y, { align: 'right', maxWidth: pageWidth - margin * 2 - 140 });
  }
  y += 16;

  if (summary && summary.length) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(60, 60, 60);
    doc.text(summary.map((s) => `${s.label}: ${s.value}`).join('      '), margin, y);
    y += 14;
  }

  return y + 6;
};

// Stamps "Page X of Y" + org name on every page — done as a second pass
// after autoTable finishes, since the true total page count isn't known
// until the whole table has been laid out (a mid-render callback would
// only see pages drawn so far, not the eventual total).
const stampFooters = (doc) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i += 1) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(ORG_NAME, 40, pageHeight - 20);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 40, pageHeight - 20, { align: 'right' });
  }
};

/**
 * Exports a filtered table to a nicely formatted, branded PDF.
 *
 * @param {object} opts
 * @param {string} opts.title - Report title, e.g. "Payment History"
 * @param {string} [opts.subtitle] - One-line summary of active filters
 * @param {{label:string, value:string|number}[]} [opts.summary] - Key stats
 *   shown under the title (e.g. total count, total amount)
 * @param {{header:string, key:string, align?:'left'|'right'|'center'}[]} opts.columns
 * @param {object[]} opts.rows - Already display-formatted values per column key
 * @param {string} opts.filename - Without extension
 * @param {'portrait'|'landscape'} [opts.orientation]
 */
export async function exportTableToPdf({
  title,
  subtitle = '',
  summary = [],
  columns,
  rows,
  filename,
  orientation = 'portrait',
}) {
  const doc = new jsPDF({ orientation, unit: 'pt', format: 'a4' });
  const logoDataUrl = await getLogoDataUrl();
  const startY = drawHeader(doc, { title, subtitle, summary }, logoDataUrl);
  const margin = 40;

  if (rows.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(150, 150, 150);
    doc.text('No records match the current filters.', margin, startY + 10);
  } else {
    autoTable(doc, {
      startY,
      head: [columns.map((c) => c.header)],
      body: rows.map((row) => columns.map((c) => row[c.key] ?? '')),
      columnStyles: columns.reduce((acc, c, i) => {
        if (c.align) acc[i] = { halign: c.align };
        return acc;
      }, {}),
      styles: { font: 'helvetica', fontSize: 8.5, cellPadding: 6, overflow: 'linebreak', lineColor: [235, 235, 235], lineWidth: 0.5 },
      headStyles: { fillColor: BRAND_RED, textColor: 255, fontStyle: 'bold', fontSize: 8.5 },
      alternateRowStyles: { fillColor: [250, 248, 248] },
      margin: { left: margin, right: margin, bottom: 40 },
    });
  }

  stampFooters(doc);
  doc.save(`${filename}-${timestamp()}.pdf`);
}
