import { useState } from 'react';
import { showToast } from '../Toast/toastBus';

// Shared across every admin table/report page — styled via the global
// .pdf-export-btn class in index.css so every export button in the app
// looks and behaves identically. `onExport` should be the async function
// that actually builds and saves the PDF (see utils/pdfExport.js).
function ExportPdfButton({ onExport, disabled, label = 'Export PDF' }) {
  const [exporting, setExporting] = useState(false);

  const handleClick = async () => {
    setExporting(true);
    try {
      await onExport();
    } catch {
      showToast('Failed to export PDF. Please try again.', 'error');
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      type="button"
      className="pdf-export-btn"
      onClick={handleClick}
      disabled={disabled || exporting}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="12" y1="18" x2="12" y2="12" />
        <polyline points="9 15 12 18 15 15" />
      </svg>
      {exporting ? 'Exporting…' : label}
    </button>
  );
}

export default ExportPdfButton;
