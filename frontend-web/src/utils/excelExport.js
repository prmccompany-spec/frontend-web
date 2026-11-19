// Utility to export tabular reports to Excel-compatible CSV with UTF-8 BOM
const timestamp = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
};

/**
 * Normalizes values for Excel CSV output:
 * - Pure numbers / numeric strings (including currency formatted like "Rs. 1,000.00")
 *   are converted to clean numeric values (unquoted) so Excel treats them as numbers.
 * - Empty / null / undefined / "—" are left as blank cells.
 * - Text strings with commas/quotes are properly quoted and escaped.
 */
export const formatExcelValue = (val) => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'number') {
    return Number.isFinite(val) ? String(val) : '';
  }

  let str = String(val).trim();
  if (!str || str === '—') return '';

  // Check if it's a formatted currency string like "Rs. 1,234.56", "-Rs. 500.00", "₹ 1,000", "-₹250"
  const currencyMatch = str.match(/^(-?)\s*(?:Rs\.?|₹)\s*([\d,]+(?:\.\d+)?)$/i);
  if (currencyMatch) {
    const sign = currencyMatch[1] || '';
    const numPart = currencyMatch[2].replace(/,/g, '');
    return `${sign}${numPart}`;
  }

  // Check if it's a pure number with optional commas e.g. "1,234.56" or "-500.00"
  if (/^-?[\d,]+(?:\.\d+)?$/.test(str) && !str.startsWith('00') && !/^0\d+/.test(str)) {
    const numStr = str.replace(/,/g, '');
    if (!Number.isNaN(Number(numStr))) {
      return numStr;
    }
  }

  return str;
};

const escapeCell = (val) => {
  const formatted = formatExcelValue(val);
  if (formatted === '') return '';

  // If it's a clean number (e.g. "100.00", "-50", "0"), output unquoted for Excel numeric detection
  if (/^-?\d+(\.\d+)?$/.test(formatted)) {
    return formatted;
  }

  // Text values: quote and escape internal quotes
  return `"${formatted.replace(/"/g, '""')}"`;
};

// Normalize column header to indicate currency if it's an amount/monetary column
const normalizeHeader = (header, key = '') => {
  const h = header || '';
  const lowerH = h.toLowerCase();
  const lowerK = (key || '').toLowerCase();
  const isCurrency =
    lowerH === 'amount' ||
    lowerH === 'rate' ||
    lowerH === 'in' ||
    lowerH === 'out' ||
    lowerH === 'balance' ||
    lowerH === 'total' ||
    lowerH === 'advance' ||
    lowerH === 'net change' ||
    lowerK === 'amount' ||
    lowerK === 'rate_amount' ||
    lowerK === 'advance_amount' ||
    lowerK === 'balance';

  if (isCurrency && !h.includes('(Rs.)') && !h.includes('(₹)')) {
    return `${h} (Rs.)`;
  }
  return h;
};

export const exportTableToExcel = ({
  title,
  subtitle,
  summary = [],
  columns = [],
  rows = [],
  totalRow = null,
  filename = 'report',
}) => {
  const lines = [];

  // UTF-8 Byte Order Mark for Microsoft Excel / Sheets compatibility
  const BOM = '\uFEFF';

  // 1. Organization & Title Header
  lines.push(escapeCell("Palayapalayam Raju's Mahumai Common Fund"));
  lines.push(escapeCell(title));
  if (subtitle) lines.push(escapeCell(`Filter / Scope: ${subtitle}`));
  lines.push(escapeCell(`Generated on: ${new Date().toLocaleString('en-IN')}`));
  lines.push(''); // Blank spacer row

  // 2. Summary Section (Formatted key-value table)
  if (summary.length > 0) {
    lines.push(`"Summary Metric","Value"`);
    summary.forEach((s) => {
      let label = s.label || '';
      let val = s.value;
      // If label refers to money and doesn't mention Rs., add (Rs.)
      const lower = label.toLowerCase();
      if (
        (lower.includes('in') || lower.includes('out') || lower.includes('total') || lower.includes('change') || lower.includes('balance') || lower.includes('gross') || lower.includes('refund') || lower.includes('outstanding') || lower.includes('overdue')) &&
        !label.includes('(Rs.)') && !label.includes('(₹)')
      ) {
        label = `${label} (Rs.)`;
      }
      lines.push(`${escapeCell(label)},${escapeCell(val)}`);
    });
    lines.push(''); // Blank spacer row
  }

  // 3. Table Column Headers
  const headerLine = columns.map((c) => escapeCell(normalizeHeader(c.header, c.key))).join(',');
  lines.push(headerLine);

  // 4. Data Rows
  rows.forEach((row) => {
    const rowLine = columns.map((c) => escapeCell(row[c.key] ?? '')).join(',');
    lines.push(rowLine);
  });

  // 5. Total Footer Row (if provided)
  if (totalRow) {
    const totalLine = columns.map((c) => escapeCell(totalRow[c.key] ?? '')).join(',');
    lines.push(totalLine);
  }

  const csvContent = BOM + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}-${timestamp()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
