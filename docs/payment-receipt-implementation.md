# Payment Receipt Implementation Plan

> [!NOTE]
> This document covers the end-to-end plan for adding a **PRMCF Payment Receipt** to the web app — a receipt icon on every transaction row in `PaymentHistory`, an auto-popup after `PaymentEntry` succeeds, and a full print mode — based on the design in `docs/prmcf-common-payment-receipt.html`.

---

## 1. Overview

| Touch-point | Trigger | Behaviour |
|---|---|---|
| **PaymentHistory** table | Click receipt icon (🧾) on any row | Opens `ReceiptModal` populated with that row's data |
| **PaymentEntry** form | After `createPayment` / `collectDues` succeeds | Auto-opens `ReceiptModal` with the new payment(s) |
| **ReceiptModal** | "Print receipt" button inside modal | Calls `window.print()` with scoped print styles |

---

## 2. Files to Create

```
frontend-web/src/
└── components/
    └── ReceiptModal/
        ├── ReceiptModal.jsx        ← modal wrapper + print trigger
        ├── ReceiptSlip.jsx         ← the actual receipt layout (matches HTML design)
        └── ReceiptModal.css        ← modal overlay + receipt + print styles
```

---

## 3. Data Contract

The receipt needs one **`payment` object** — the same shape already returned by `GET /payments/:id` and the list endpoint:

```js
// Fields used by the receipt
{
  id,
  payment_ref,       // "PAY-20261117-4521"  → maps to Receipt No
  payment_date,      // ISO date string       → maps to Date
  member_name,       // string               → "Received from"
  member_code,       // "PRM00125"            → Member ID
  category_name,     // "Annual Maintenance"  → Payment for
  notes,             // optional             → Description
  amount,            // number               → Amount
  payment_type,      // "cash" | "qr"        → Payment Mode
  collected_by_name, // string               → shown in footer
}
```

> [!IMPORTANT]
> `PaymentEntry.createPayment()` currently returns only `{ id, payment_ref }`. After recording, call `getPaymentById(result.id)` to fetch the full object for the receipt. See §6 for the exact change.

---

## 4. `ReceiptSlip.jsx` — The Receipt Layout

**Path:** `src/components/ReceiptModal/ReceiptSlip.jsx`

Mirrors the HTML design exactly (Tamil invocation, org name, bilingual labels, amount panel, signatures, footer).

```jsx
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-') : '—';

const fmtAmount = (n) =>
  Number(n).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

const paymentModeLabel = (m) => (m === 'qr' ? 'UPI / QR Code' : m === 'cash' ? 'Cash' : m ?? '—');

export default function ReceiptSlip({ payment, ref: fwdRef }) {
  if (!payment) return null;

  return (
    <main className="prmcf-receipt" ref={fwdRef} id="prmcf-receipt">
      {/* ── Header ── */}
      <header className="prmcf-receipt__header">
        <div className="prmcf-receipt__invocation">ஸ்ரீ ராமஜெயம்</div>
        <h1 className="prmcf-receipt__org">
          பழையபாளையம் ராஜாக்கள் முறைமை<br />பொதுப்பண்டு
        </h1>
        <div className="prmcf-receipt__address">இராஜபாளையம் – 626 117</div>
        <div className="prmcf-receipt__title-ta">பணம் பெற்றுக்கொண்ட ரசீது</div>
        <div className="prmcf-receipt__title-en">PAYMENT RECEIPT</div>
      </header>

      {/* ── Meta ── */}
      <section className="prmcf-receipt__meta">
        <div><strong>Receipt No:</strong> {payment.payment_ref}</div>
        <div><strong>Date:</strong> {fmtDate(payment.payment_date)}</div>
      </section>

      {/* ── Details ── */}
      <section className="prmcf-receipt__details">
        {[
          ['Received from', payment.member_name],
          ['Member ID',     payment.member_code],
          ['Payment for',   payment.category_name],
          ['Description',   payment.notes || payment.category_name],
        ].map(([label, value]) => (
          <div className="prmcf-receipt__row" key={label}>
            <span className="prmcf-receipt__label">{label}</span>
            <span>:</span>
            <span className="prmcf-receipt__value">{value || '—'}</span>
          </div>
        ))}
      </section>

      {/* ── Amount Panel ── */}
      <section className="prmcf-receipt__amount-panel">
        <div className="prmcf-receipt__amount-label">பெற்ற தொகை / Amount Received</div>
        <div className="prmcf-receipt__amount">{fmtAmount(payment.amount)}</div>
      </section>

      {/* ── Payment Mode ── */}
      <div className="prmcf-receipt__mode">
        <strong>Payment Mode:</strong> {paymentModeLabel(payment.payment_type)}
      </div>

      {/* ── Signatures ── */}
      <section className="prmcf-receipt__signatures">
        <div className="prmcf-receipt__sig">பெற்றவர் / Received by</div>
        <div className="prmcf-receipt__sig">அதிகாரி கையொப்பம் / Authorized Signature</div>
      </section>

      <footer className="prmcf-receipt__footer">Thank you for your contribution.</footer>
    </main>
  );
}
```

> [!NOTE]
> Pass a `ref` if you ever need to target the DOM node directly (e.g., for `html2canvas`). For the browser print flow, `window.print()` with scoped CSS is enough — no ref needed.

---

## 6. `ReceiptModal.jsx` — Modal Wrapper

**Path:** `src/components/ReceiptModal/ReceiptModal.jsx`

```jsx
import ReceiptSlip from './ReceiptSlip';
import './ReceiptModal.css';

export default function ReceiptModal({ payment, onClose }) {
  if (!payment) return null;

  const handlePrint = () => window.print();

  return (
    <div className="rm-overlay" onClick={onClose}>
      <div className="rm-dialog" onClick={(e) => e.stopPropagation()}>
        {/* ── Toolbar (hidden on print) ── */}
        <div className="rm-toolbar rm-no-print">
          <button className="rm-btn rm-btn--ghost" onClick={onClose}>✕ Close</button>
          <button className="rm-btn rm-btn--primary" onClick={handlePrint}>🖨 Print Receipt</button>
        </div>

        <ReceiptSlip payment={payment} />
      </div>
    </div>
  );
}
```

---

## 7. `ReceiptModal.css` — Styles + Print Mode

**Path:** `src/components/ReceiptModal/ReceiptModal.css`

Key sections:

```css
/* ── Modal overlay ── */
.rm-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.55);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
}
.rm-dialog {
  background: #eef1f5;
  border-radius: 10px;
  padding: 16px;
  max-height: 92vh;
  overflow-y: auto;
  width: min(480px, 96vw);
}

/* ── Toolbar ── */
.rm-toolbar { display: flex; justify-content: flex-end; gap: 10px; margin-bottom: 14px; }
.rm-btn { border: 0; border-radius: 6px; padding: 9px 16px; cursor: pointer; font-weight: 700; }
.rm-btn--ghost   { background: #fff; color: #142b55; border: 1.5px solid #142b55; }
.rm-btn--primary { background: #142b55; color: #fff; }

/* ── Receipt card — mirrors prmcf-common-payment-receipt.html ── */
.prmcf-receipt {
  width: 100%; max-width: 430px; margin: 0 auto;
  padding: 20px 22px 18px;
  background: #fff;
  border: 1.5px solid #142b55;
  box-shadow: 0 4px 18px rgba(20,43,85,.10);
  font-family: Arial, "Noto Sans Tamil", "Latha", sans-serif;
  color: #172033;
}
.prmcf-receipt__header { text-align: center; color: #142b55; padding-bottom: 14px; border-bottom: 1px solid #142b55; }
.prmcf-receipt__invocation { font-size: 13px; font-weight: 700; margin-bottom: 7px; }
.prmcf-receipt__org   { margin: 0; font-size: 19px; font-weight: 800; line-height: 1.35; }
.prmcf-receipt__address { margin-top: 5px; font-size: 12px; }
.prmcf-receipt__title-ta {
  display: inline-block; margin-top: 12px;
  padding: 6px 18px; border-radius: 5px;
  background: #142b55; color: #fff;
  font-size: 16px; font-weight: 700;
}
.prmcf-receipt__title-en { margin-top: 5px; font-size: 18px; font-weight: 800; letter-spacing: .8px; }

.prmcf-receipt__meta {
  display: flex; justify-content: space-between; gap: 12px;
  padding: 12px 0; border-bottom: 1px solid #aab6c8; font-size: 12px;
}
.prmcf-receipt__meta strong { color: #142b55; }

.prmcf-receipt__details { padding: 12px 0 10px; }
.prmcf-receipt__row {
  display: grid; grid-template-columns: 126px 10px minmax(0,1fr);
  gap: 5px; margin: 0 0 10px; font-size: 12px; line-height: 1.4;
}
.prmcf-receipt__label { color: #52627b; }
.prmcf-receipt__value { font-weight: 700; overflow-wrap: anywhere; }

.prmcf-receipt__amount-panel {
  margin: 5px 0 12px; padding: 12px; text-align: center;
  border: 1px solid #d7e1f2; border-radius: 7px; background: #f1f5fc;
}
.prmcf-receipt__amount-label { color: #142b55; font-size: 12px; font-weight: 700; }
.prmcf-receipt__amount       { margin-top: 3px; color: #142b55; font-size: 30px; font-weight: 800; }

.prmcf-receipt__mode { padding: 9px 0 12px; border-bottom: 1px solid #aab6c8; font-size: 12px; }

.prmcf-receipt__signatures {
  display: flex; justify-content: space-between; gap: 20px;
  padding: 30px 4px 0; text-align: center; color: #52627b; font-size: 11px;
}
.prmcf-receipt__sig { width: 48%; border-top: 1px solid #65738a; padding-top: 7px; }

.prmcf-receipt__footer { margin-top: 15px; text-align: center; color: #52627b; font-size: 10px; }

/* ── Print styles ── */
@media print {
  /* Hide everything except the receipt */
  body > *                      { display: none !important; }
  .rm-overlay, .rm-dialog       { display: block !important; position: static !important;
                                   background: none !important; padding: 0 !important; }
  .rm-no-print                  { display: none !important; }
  .prmcf-receipt {
    max-width: none; width: 100%; margin: 0;
    border: 1px solid #142b55; box-shadow: none;
    padding: 14px 15px 12px;
  }
  @page { size: 3.5in 5.5in; margin: 0.12in; }
}
```

> [!TIP]
> The `@media print` rule suppresses every other element on the page and renders only the receipt slip — identical to the standalone HTML design.

---

## 8. Changes to Existing Files

### 8.1 `PaymentHistory.jsx` — Add receipt icon column

```jsx
// 1. Import at top
import ReceiptModal from '../../../components/ReceiptModal/ReceiptModal';
import { getPaymentById } from '../../../services/paymentService';

// 2. Add state
const [receiptPayment, setReceiptPayment] = useState(null);

// 3. Handler
const openReceipt = async (payment) => {
  try {
    // The list row already has all needed fields; use it directly
    setReceiptPayment(payment);
  } catch {
    showToast('Could not load receipt.', 'error');
  }
};

// 4. In the <th> row add:
<th>Receipt</th>

// 5. In each <tr> add alongside the Edit button:
<button
  type="button"
  className="ph-row-btn ph-row-btn--receipt"
  title="View receipt"
  onClick={() => openReceipt(p)}
>
  🧾
</button>

// 6. At the bottom of the return, before closing </div>:
{receiptPayment && (
  <ReceiptModal
    payment={receiptPayment}
    onClose={() => setReceiptPayment(null)}
  />
)}
```

### 8.2 `PaymentEntry.jsx` — Auto-open receipt after payment

```jsx
// 1. Import
import ReceiptModal from '../../../components/ReceiptModal/ReceiptModal';
import { getPaymentById } from '../../../services/paymentService';

// 2. Replace the existing `result` state with receipt state
const [receiptPayment, setReceiptPayment] = useState(null);

// 3. In handleSubmit, replace `setResult(res)` with:
const full = await getPaymentById(res.id);
setReceiptPayment(full);

// 4. In handleCollectDues, after showToast add:
// (collectDues returns an array; show receipt for the first payment)
// If the backend returns payment ids, fetch the first:
// const full = await getPaymentById(result.ids[0]);
// setReceiptPayment(full);
// (Adjust once collectDues API response shape is confirmed — see §9)

// 5. Remove the old <div className="pe-success"> banner (receipt replaces it)

// 6. Add at the bottom of return:
{receiptPayment && (
  <ReceiptModal
    payment={receiptPayment}
    onClose={() => setReceiptPayment(null)}
  />
)}
```

---

## 9. Backend — Confirm `collectDues` Response

The service at `POST /payments/collect-dues` should return the IDs (or full objects) of the payments it created, so the frontend can fetch the receipt.

Verify `paymentService.collectDues` returns something like:

```json
{ "success": true, "message": "Dues cleared", "ids": [42, 43] }
```

If it only returns a count today, add `ids` to the response in `paymentService.js` (backend) so the frontend can call `getPaymentById(ids[0])`.

> [!WARNING]
> Until `collectDues` returns payment IDs, skip the auto-receipt for dues and show only the toast. The receipt icon in `PaymentHistory` already handles viewing any cleared-due payment.

---

## 10. Backend — `GET /payments/:id` Endpoint

Already implemented in `paymentController.js` → `getPayment`. Confirm it is registered in routes:

```js
// backend/src/routes/paymentRoutes.js
router.get('/:id', authenticate, getPayment);
```

The returned object must include `member_name`, `member_code`, `category_name`, and `collected_by_name` (all present in the existing `getPaymentById` SQL join).

---

## 11. Receipt Number Mapping

| Receipt field | Source field |
|---|---|
| Receipt No | `payment.payment_ref` (e.g. `PAY-20261117-4521`) |
| Date | `payment.payment_date` |
| Received from | `payment.member_name` |
| Member ID | `payment.member_code` |
| Payment for | `payment.category_name` |
| Description | `payment.notes` (falls back to `category_name`) |
| Amount | `payment.amount` |
| Payment Mode | `payment.payment_type` → "Cash" / "UPI / QR Code" |

---

## 12. Implementation Order

```
1. Create  src/components/ReceiptModal/ReceiptSlip.jsx
2. Create  src/components/ReceiptModal/ReceiptModal.jsx
3. Create  src/components/ReceiptModal/ReceiptModal.css
4. Edit    PaymentHistory.jsx  — add icon + modal mount
5. Edit    PaymentEntry.jsx    — auto-popup after record
6. Verify  backend GET /payments/:id returns all required fields
7. Verify  collectDues response includes payment IDs (nice-to-have)
8. Manual test: print dialog, Tamil fonts render correctly
```

---

## 13. Edge Cases

| Scenario | Handling |
|---|---|
| `payment.notes` is null | Falls back to `category_name` in Description row |
| Amount has paise (e.g. ₹700.50) | Displayed as-is; `maximumFractionDigits: 0` rounds to nearest rupee in the amount panel |
| Tamil fonts not installed on printer | Font stack includes `"Noto Sans Tamil"`, `"Latha"` as fallbacks |
| Very long member name | `overflow-wrap: anywhere` on `.prmcf-receipt__value` prevents layout break |
| `collectDues` clears multiple dues | Show receipt for the first created payment; list all in the notes if needed |
| Modal opened on mobile | `max-height: 92vh` + `overflow-y: auto` on `.rm-dialog` handles scroll |

---

## 14. No New Dependencies

This implementation uses only what is already in the project:

- **React state** for modal open/close
- **`window.print()`** for printing (native browser API — no library needed)
- **CSS `@media print`** for isolating the receipt during print
- **`getPaymentById`** — already exists in `paymentService.js`
