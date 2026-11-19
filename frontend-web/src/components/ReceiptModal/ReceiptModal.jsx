import { useEffect, useRef } from 'react';
import ReceiptSlip from './ReceiptSlip';
import './ReceiptModal.css';

function ReceiptModal({ payment, rental, onClose }) {
  const bodyRef = useRef(null);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = 0;
    }
  }, [payment, rental]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const target = rental || payment;
  if (!target) return null;

  const handlePrint = () => {
    const slipEl = document.getElementById('prmcf-receipt-slip');
    if (!slipEl) {
      window.print();
      return;
    }

    let printIframe = document.getElementById('prmcf-print-frame');
    if (!printIframe) {
      printIframe = document.createElement('iframe');
      printIframe.id = 'prmcf-print-frame';
      printIframe.style.position = 'fixed';
      printIframe.style.right = '0';
      printIframe.style.bottom = '0';
      printIframe.style.width = '0';
      printIframe.style.height = '0';
      printIframe.style.border = '0';
      document.body.appendChild(printIframe);
    }

    const doc = printIframe.contentDocument || printIframe.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 4mm;
            }
            * { box-sizing: border-box; }
            body {
              margin: 0;
              padding: 0;
              background: #ffffff;
              color: #172033;
              font-family: Arial, "Noto Sans Tamil", "Latha", sans-serif;
            }
            ${Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
              .map((tag) => tag.outerHTML)
              .join('\n')}
            .prmcf-receipt {
              width: 100% !important;
              max-width: none !important;
              margin: 0 !important;
              box-shadow: none !important;
              border: 1.5px solid #142b55 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          </style>
        </head>
        <body>
          ${slipEl.outerHTML}
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      printIframe.contentWindow.focus();
      printIframe.contentWindow.print();
    }, 250);
  };

  return (
    <div className="rm-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="rm-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="rm-toolbar rm-no-print">
          <div className="rm-toolbar-left">
            <span className="rm-toolbar-badge">Receipt Preview</span>
          </div>
          <div className="rm-toolbar-actions">
            <button
              type="button"
              className="rm-btn rm-btn--print"
              onClick={handlePrint}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              Print Receipt
            </button>
            <button
              type="button"
              className="rm-btn rm-btn--close"
              onClick={onClose}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="rm-body" ref={bodyRef}>
          <ReceiptSlip payment={payment} rental={rental} />
        </div>
      </div>
    </div>
  );
}

export default ReceiptModal;
