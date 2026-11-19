import { useState, useRef, useEffect } from 'react';
import './RentalProductsBadge.css';

/**
 * Renders rental products compactly with an interactive hover/click popover
 * for multi-product rentals.
 *
 * @param {Array} items - List of rental items [{ product_name, quantity, rate_type, rate_amount }]
 * @param {string} fallback - Fallback text if items array is empty (e.g. single product_name)
 * @param {number} fallbackQty - Fallback quantity if items array is empty
 */
export default function RentalProductsBadge({ items, fallback, fallbackQty = 1 }) {
  const [open, setOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const containerRef = useRef(null);
  const closeTimer = useRef(null);

  // Normalize items array
  const hasMultiple = Array.isArray(items) && items.length > 1;
  const singleItem = Array.isArray(items) && items.length === 1 ? items[0] : null;

  const handleMouseEnter = () => {
    if (!hasMultiple) return;
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUp(spaceBelow < 200 && rect.top > 200);
    }
    setOpen(true);
  };

  const handleMouseLeave = () => {
    if (!hasMultiple) return;
    closeTimer.current = setTimeout(() => {
      setOpen(false);
    }, 150);
  };

  const handleClick = (e) => {
    if (!hasMultiple) return;
    e.stopPropagation();
    if (!open && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUp(spaceBelow < 200 && rect.top > 200);
    }
    setOpen((prev) => !prev);
  };

  // Close when clicked outside
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [open]);

  // 1. Single product or fallback
  if (!hasMultiple) {
    if (singleItem) {
      return (
        <span className="rpb-single">
          <span className="rpb-name">{singleItem.product_name || 'Equipment'}</span>
          <span className="rpb-qty">({singleItem.quantity || 1})</span>
        </span>
      );
    }
    return (
      <span className="rpb-single">
        <span className="rpb-name">{fallback || '—'}</span>
        {fallback && fallbackQty ? <span className="rpb-qty">({fallbackQty})</span> : null}
      </span>
    );
  }

  // 2. Multi-product rental: First product + interactive popover badge
  const firstItem = items[0];
  const moreCount = items.length - 1;
  const totalUnits = items.reduce((sum, it) => sum + (Number(it.quantity) || 1), 0);

  return (
    <div
      className="rpb-wrapper"
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="rpb-inline" onClick={handleClick} role="button" tabIndex={0} title="Click or hover to view all products">
        <span className="rpb-primary-item">
          {firstItem.product_name} <span className="rpb-qty">({firstItem.quantity || 1})</span>
        </span>
        <span className={`rpb-pill${open ? ' rpb-pill--active' : ''}`}>
          +{moreCount} more ▾
        </span>
      </div>

      {open && (
        <div className={`rpb-popover ${openUp ? 'rpb-popover--up' : 'rpb-popover--down'}`} onClick={(e) => e.stopPropagation()}>
          <div className="rpb-popover__header">
            <span className="rpb-popover__title">Rented Products</span>
            <span className="rpb-popover__count">{items.length} items · {totalUnits} total units</span>
          </div>

          <div className="rpb-popover__list">
            {items.map((it, idx) => (
              <div key={idx} className="rpb-popover__item">
                <span className="rpb-popover__qty">{it.quantity || 1}×</span>
                <span className="rpb-popover__name">{it.product_name || 'Product'}</span>
                {it.rate_amount ? (
                  <span className="rpb-popover__rate">
                    ₹{Number(it.rate_amount).toLocaleString('en-IN', { minimumFractionDigits: 0 })} / {it.rate_type || 'day'}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
