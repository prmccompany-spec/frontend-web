import React from 'react';

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

const formatAmount = (val) => {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: num % 1 === 0 ? 0 : 2,
  }).format(num);
};

const getPaymentModeLabel = (mode) => {
  if (!mode) return '—';
  const m = String(mode).toLowerCase();
  if (m === 'qr') return 'UPI / QR Code';
  if (m === 'cash') return 'Cash';
  return mode;
};

const computeItemCost = (item, startDate, endDate) => {
  if (item.amount && Number(item.amount) > 0) {
    return Number(item.amount);
  }
  const qty = Math.max(1, Number(item.quantity) || 1);
  const rate = Number(item.rate_amount) || 0;
  if (!startDate || !endDate) return qty * rate;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const ms = Math.max(0, end - start);
  const msPerUnit = item.rate_type === 'month' ? 1000 * 60 * 60 * 24 * 30 : item.rate_type === 'year' ? 1000 * 60 * 60 * 24 * 365 : 1000 * 60 * 60 * 24;
  const units = Math.max(Math.ceil(ms / msPerUnit), 1);
  return units * rate * qty;
};

function ReceiptSlip({ payment, rental }) {
  const data = rental || payment;
  if (!data) return null;

  const isRental = Boolean(
    rental ||
    data.rental_ref ||
    data.start_date ||
    data.items ||
    data.items_summary
  );

  const memberName = data.member_name || data.renter_name || '—';
  const memberCode = data.member_code
    ? data.member_code
    : (data.member_id ? `Member #${data.member_id}` : (data.renter_name ? 'Non-member / Guest' : '—'));

  const receiptRef = data.rental_ref || data.payment_ref || '—';
  const receiptDate = formatDate(
    data.status === 'returned'
      ? (data.returned_at || data.end_date || data.updated_at || data.created_at)
      : (data.payment_date || data.start_date || data.created_at || new Date())
  );

  // Rental specific derivations
  const isReturned = isRental && data.status === 'returned';

  // Extract all rental items: check data.items, or parse from notes metadata fallback
  let rentalItems = [];
  if (isRental) {
    if (Array.isArray(data.items) && data.items.length > 1) {
      rentalItems = data.items;
    } else if (data.notes && data.notes.includes('[[ITEMS:')) {
      try {
        const match = data.notes.match(/\[\[ITEMS:(.*?)\]\]/);
        if (match && match[1]) {
          const parsed = JSON.parse(match[1]);
          if (Array.isArray(parsed) && parsed.length > 0) {
            rentalItems = parsed;
          }
        }
      } catch {}
    }

    if (rentalItems.length === 0) {
      rentalItems = Array.isArray(data.items) && data.items.length > 0
        ? data.items
        : data.product_name
        ? [{
            product_name: data.product_name,
            quantity: data.quantity || data.total_quantity || 1,
            rate_amount: data.rate_amount,
            rate_type: data.rate_type,
            amount: data.amount,
          }]
        : [];
    }
  }

  const rawNotes = data.notes || '';
  const cleanNotes = (() => {
    if (!rawNotes) return '';
    const stripped = rawNotes.replace(/\[\[ITEMS:[\s\S]*?\]\]+/g, '').trim();
    if (!stripped || stripped.replace(/[\[\]\s]/g, '') === '') return '';
    return stripped;
  })();

  // Amounts & Payment modes
  const totalAmount = Number(data.amount) || 0;
  const advanceAmount = Number(data.advance_amount) || 0;
  const diff = totalAmount - advanceAmount;
  const isRefund = diff < 0;
  const refundAmount = Math.abs(diff);
  const balanceDue = Math.max(0, diff);

  let amountDisplay = formatAmount(data.amount);
  let amountLabel = 'பெற்ற தொகை / Amount Received';
  let amountSub = null;
  let paymentModeDisplay = getPaymentModeLabel(data.payment_type);

  if (isRental) {
    if (isReturned) {
      amountDisplay = formatAmount(totalAmount);
      if (isRefund) {
        amountLabel = 'பயன்பாட்டு மொத்த வாடகை / Total Rent Charged';
        amountSub = `முன்பணம் / Advance Paid: ${formatAmount(advanceAmount)}  |  திருப்பியளித்த தொகை / Refund Given: ${formatAmount(refundAmount)}`;
        const advMode = getPaymentModeLabel(data.advance_payment_type);
        const refMode = getPaymentModeLabel(data.settlement_payment_type || 'cash');
        paymentModeDisplay = `Advance: ${advMode} | Refund: ${refMode}`;
      } else if (balanceDue > 0) {
        amountLabel = 'பெற்ற மொத்த தொகை / Total Settled Amount';
        amountSub = `முன்பணம் / Advance: ${formatAmount(advanceAmount)}  |  பெறப்பட்ட மீதி / Balance Settled: ${formatAmount(balanceDue)}`;
        const advMode = getPaymentModeLabel(data.advance_payment_type);
        const setMode = getPaymentModeLabel(data.settlement_payment_type || 'cash');
        paymentModeDisplay = advMode === setMode ? advMode : `Advance: ${advMode} | Settlement: ${setMode}`;
      } else {
        amountLabel = 'பெற்ற மொத்த தொகை / Total Settled Amount';
        amountSub = advanceAmount > 0 ? `முன்பணம் / Advance Paid: ${formatAmount(advanceAmount)} (முழுவதும் நேர் செய்யப்பட்டது)` : null;
        paymentModeDisplay = getPaymentModeLabel(data.settlement_payment_type || data.advance_payment_type || 'cash');
      }
    } else {
      // Active / Not yet returned
      if (advanceAmount > 0) {
        amountLabel = 'பெற்ற முன்பணம் / Advance Amount Received';
        amountDisplay = formatAmount(advanceAmount);
        amountSub = `மொத்த வாடகை / Total Booking: ${formatAmount(totalAmount)}  |  மீதம் / Balance Due: ${formatAmount(balanceDue)}`;
        paymentModeDisplay = getPaymentModeLabel(data.advance_payment_type);
      } else {
        amountLabel = 'மொத்த வாடகை கட்டணம் / Total Booking Amount';
        amountDisplay = formatAmount(totalAmount);
        amountSub = `முன்பணம் / Advance: ₹0  |  ஒப்படைக்கும்போது செலுத்தவும் / Payable on Return: ${formatAmount(totalAmount)}`;
        paymentModeDisplay = 'Payable on Return (ஒப்படைக்கும்போது)';
      }
    }
  }

  return (
    <div className="prmcf-receipt prmcf-receipt-printable" id="prmcf-receipt-slip">
      <header className="prmcf-receipt__header">
        <div className="prmcf-receipt__invocation">ஸ்ரீ ராமஜெயம்</div>
        <h1 className="prmcf-receipt__org-name">
          பழையபாளையம் ராஜாக்கள் முறைமை<br />பொதுப்பண்டு
        </h1>
        <div className="prmcf-receipt__address">இராஜபாளையம் – 626 117</div>
        <div className="prmcf-receipt__title-ta">
          {isRental ? 'வாடகை ரசீது' : 'பணம் பெற்றுக்கொண்ட ரசீது'}
        </div>
        <div className="prmcf-receipt__title-en">
          {isRental ? 'RENTAL RECEIPT' : 'PAYMENT RECEIPT'}
        </div>
      </header>

      <section className="prmcf-receipt__meta">
        <div>
          <strong>Receipt No:</strong> <span>{receiptRef}</span>
        </div>
        <div>
          <strong>Date:</strong> <span>{receiptDate}</span>
        </div>
      </section>

      <section className="prmcf-receipt__details">
        <div className="prmcf-receipt__detail-row">
          <span className="prmcf-receipt__label">Received from</span>
          <span>:</span>
          <span className="prmcf-receipt__value">{memberName}</span>
        </div>
        <div className="prmcf-receipt__detail-row">
          <span className="prmcf-receipt__label">Member ID</span>
          <span>:</span>
          <span className="prmcf-receipt__value">{memberCode}</span>
        </div>

        {isRental ? (
          <>
            <div className="prmcf-receipt__detail-row">
              <span className="prmcf-receipt__label">Rental Status</span>
              <span>:</span>
              <span className="prmcf-receipt__value">
                {isReturned ? (
                  <span className="prmcf-receipt__badge prmcf-receipt__badge--returned">
                    திரும்ப ஒப்படைக்கப்பட்டது / Returned &amp; Settled
                  </span>
                ) : (
                  <span className="prmcf-receipt__badge prmcf-receipt__badge--active">
                    ஒப்படைக்கப்படவில்லை / Not Yet Returned
                  </span>
                )}
              </span>
            </div>
            <div className="prmcf-receipt__detail-row">
              <span className="prmcf-receipt__label">Rental Period</span>
              <span>:</span>
              <span className="prmcf-receipt__value">
                {formatDate(data.start_date)} to {formatDate(isReturned ? (data.returned_at || data.end_date) : data.end_date)}
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="prmcf-receipt__detail-row">
              <span className="prmcf-receipt__label">Payment for</span>
              <span>:</span>
              <span className="prmcf-receipt__value">{data.category_name || 'Payment'}</span>
            </div>
            <div className="prmcf-receipt__detail-row">
              <span className="prmcf-receipt__label">Description</span>
              <span>:</span>
              <span className="prmcf-receipt__value">{cleanNotes || data.category_name || '—'}</span>
            </div>
          </>
        )}

        {isRental && cleanNotes && (
          <div className="prmcf-receipt__detail-row">
            <span className="prmcf-receipt__label">Remarks</span>
            <span>:</span>
            <span className="prmcf-receipt__value">{cleanNotes}</span>
          </div>
        )}
      </section>

      {/* Itemized Rented Products, Quantities and Aligned Totals */}
      {isRental && (
        <section className="prmcf-receipt__table-section">
          <table className="prmcf-receipt__items-table">
            <thead>
              <tr>
                <th className="prmcf-th-num">#</th>
                <th className="prmcf-th-name">பொருட்கள் / Product</th>
                <th className="prmcf-th-rate">வாடகை / Rate</th>
                <th className="prmcf-th-qty">அளவு / Qty</th>
                <th className="prmcf-th-total">தொகை / Total</th>
              </tr>
            </thead>
            <tbody>
              {rentalItems.length > 0 ? (
                rentalItems.map((item, idx) => {
                  const itemTotal = computeItemCost(item, data.start_date, isReturned ? (data.returned_at || data.end_date) : data.end_date);
                  const rateUnit = item.rate_type === 'month' ? 'mo' : item.rate_type === 'year' ? 'yr' : 'day';
                  const rateLabel = item.rate_amount
                    ? `₹${Number(item.rate_amount).toLocaleString('en-IN')}/${rateUnit}`
                    : '—';
                  return (
                    <tr key={idx}>
                      <td className="prmcf-td-num">{idx + 1}</td>
                      <td className="prmcf-td-name">
                        <span className="prmcf-item-title">{item.product_name || item.name || 'Product'}</span>
                      </td>
                      <td className="prmcf-td-rate">{rateLabel}</td>
                      <td className="prmcf-td-qty">{item.quantity || 1}</td>
                      <td className="prmcf-td-total">{formatAmount(itemTotal)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className="prmcf-td-num">1</td>
                  <td className="prmcf-td-name">
                    <span className="prmcf-item-title">{data.items_summary || data.product_name || 'Rental Equipment'}</span>
                  </td>
                  <td className="prmcf-td-rate">₹{data.rate_amount || 0}/{data.rate_type || 'day'}</td>
                  <td className="prmcf-td-qty">{data.total_quantity || data.quantity || 1}</td>
                  <td className="prmcf-td-total">{formatAmount(totalAmount)}</td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="prmcf-tfoot-row prmcf-tfoot-row--subtotal">
                <td colSpan={4} className="prmcf-tfoot-label">
                  மொத்த வாடகை / Total Rent Charged
                </td>
                <td className="prmcf-tfoot-val">{formatAmount(totalAmount)}</td>
              </tr>

              {advanceAmount > 0 && (
                <tr className="prmcf-tfoot-row">
                  <td colSpan={4} className="prmcf-tfoot-label">
                    முன்பணம் / Advance Paid
                  </td>
                  <td className="prmcf-tfoot-val">{formatAmount(advanceAmount)}</td>
                </tr>
              )}

              {isReturned ? (
                isRefund ? (
                  <tr className="prmcf-tfoot-row prmcf-tfoot-row--refund">
                    <td colSpan={4} className="prmcf-tfoot-label">
                      வாடகைதாரருக்கு திருப்பியளித்த தொகை / Refund Given to Renter
                    </td>
                    <td className="prmcf-tfoot-val prmcf-text-refund">- {formatAmount(refundAmount)}</td>
                  </tr>
                ) : balanceDue > 0 ? (
                  <tr className="prmcf-tfoot-row prmcf-tfoot-row--balance">
                    <td colSpan={4} className="prmcf-tfoot-label">
                      பெறப்பட்ட மீதி / Balance Settled
                    </td>
                    <td className="prmcf-tfoot-val prmcf-text-balance">+ {formatAmount(balanceDue)}</td>
                  </tr>
                ) : (
                  <tr className="prmcf-tfoot-row">
                    <td colSpan={4} className="prmcf-tfoot-label">
                      மீதி தொகை / Balance Due
                    </td>
                    <td className="prmcf-tfoot-val">₹0.00</td>
                  </tr>
                )
              ) : (
                <tr className="prmcf-tfoot-row prmcf-tfoot-row--due">
                  <td colSpan={4} className="prmcf-tfoot-label">
                    ஒப்படைக்கும்போது செலுத்த வேண்டிய மீதி / Balance Due on Return
                  </td>
                  <td className="prmcf-tfoot-val">{formatAmount(balanceDue)}</td>
                </tr>
              )}
            </tfoot>
          </table>
        </section>
      )}

      {/* Prominent Amount Panel */}
      <section className="prmcf-receipt__amount-panel">
        <div className="prmcf-receipt__amount-label">{amountLabel}</div>
        <div className="prmcf-receipt__amount">{amountDisplay}</div>
      </section>

      <div className="prmcf-receipt__payment-mode">
        <strong>Payment Mode:</strong> <span>{paymentModeDisplay}</span>
      </div>
    </div>
  );
}

export default ReceiptSlip;
