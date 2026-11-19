import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRentalProducts, createRental } from '../../../services/rentalService';
import { getMembers } from '../../../services/memberService';
import { matchesIdOrText, sortByMemberId } from '../../../utils/memberSearch';
import { showToast } from '../../../components/Toast/toastBus';
import ReceiptModal from '../../../components/ReceiptModal/ReceiptModal';
import { useAuth } from '../../../context/AuthContext';
import './RentalEntry.css';

const nowLocal = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

const defaultEndLocal = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

const RATE_TYPES = [
  { key: 'day', label: 'Day' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
];

const MS_PER_UNIT = {
  day: 1000 * 60 * 60 * 24,
  month: 1000 * 60 * 60 * 24 * 30,
  year: 1000 * 60 * 60 * 24 * 365,
};

function RentalEntry() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [members, setMembers] = useState([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [form, setForm] = useState({
    renterType: 'member', // 'member' | 'guest'
    member_id: '',
    memberDisplay: '',
    renter_name: '',
    start_date: nowLocal(),
    end_date: defaultEndLocal(),
    advance_amount: '',
    advance_payment_type: 'cash',
    notes: '',
  });

  const [items, setItems] = useState([
    {
      id: 1,
      product_id: '',
      quantity: 1,
      rate_type: 'day',
      amount: '',
      amountTouched: false,
    },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [receiptRental, setReceiptRental] = useState(null);

  useEffect(() => {
    getRentalProducts({ active: true }).then(setProducts).catch(() => {});
    getMembers().then((res) => setMembers(res.data?.data ?? [])).catch(() => {});
  }, []);

  const collectorLabel = user?.account_type === 'staff'
    ? `${user.name} (Staff)`
    : user?.name ? `${user.name} (${user.member_id})` : '';
  const collectorType = user?.account_type === 'staff' ? 'staff' : 'member';

  const calculateItemAmount = useCallback(
    (productId, rateType, quantity) => {
      if (!form.start_date || !form.end_date || !productId) return '';
      const start = new Date(form.start_date);
      const end = new Date(form.end_date);
      if (end <= start) return '';

      const product = products.find((p) => String(p.id) === String(productId));
      if (!product) return '';

      const rate = product[`${rateType}_rate`];
      if (!rate || !product.day_rate) return '';

      const ms = end - start;
      const units = Math.max(Math.ceil(ms / MS_PER_UNIT[rateType]), 1);
      const qty = Math.max(1, Number(quantity) || 1);
      const computed = Math.max(units * Number(rate) * qty, Number(product.day_rate) * qty);
      return computed.toFixed(2);
    },
    [form.start_date, form.end_date, products]
  );

  // Auto-recalculate non-manually touched amounts when dates change
  useEffect(() => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.amountTouched || !item.product_id) return item;
        const autoAmt = calculateItemAmount(item.product_id, item.rate_type, item.quantity);
        return autoAmt ? { ...item, amount: autoAmt } : item;
      })
    );
  }, [form.start_date, form.end_date, calculateItemAmount]);

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        product_id: '',
        quantity: 1,
        rate_type: 'day',
        amount: '',
        amountTouched: false,
      },
    ]);
  };

  const removeItem = (id) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateItem = (id, field, value) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };

        if (field === 'product_id') {
          updated.quantity = 1;
          updated.amountTouched = false;
          const auto = calculateItemAmount(value, updated.rate_type, 1);
          if (auto) updated.amount = auto;
        } else if (field === 'quantity') {
          updated.amountTouched = false;
          const auto = calculateItemAmount(updated.product_id, updated.rate_type, value);
          if (auto) updated.amount = auto;
        } else if (field === 'rate_type') {
          updated.amountTouched = false;
          const auto = calculateItemAmount(updated.product_id, value, updated.quantity);
          if (auto) updated.amount = auto;
        } else if (field === 'amount') {
          updated.amountTouched = true;
        }

        return updated;
      })
    );
  };

  const adjustQty = (id, delta) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const prod = products.find((p) => String(p.id) === String(item.product_id));
    const max = prod ? (prod.available_quantity !== undefined ? Number(prod.available_quantity) : Number(prod.total_quantity || 1)) : 999;
    const current = Number(item.quantity) || 1;
    const next = Math.max(1, Math.min(max, current + delta));
    updateItem(id, 'quantity', next);
  };

  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [items]);

  const balanceAmount = useMemo(() => {
    const adv = Number(form.advance_amount) || 0;
    return Math.max(0, totalAmount - adv);
  }, [totalAmount, form.advance_amount]);

  const filteredMembers = sortByMemberId(
    members.filter((m) => matchesIdOrText(m.member_id, [m.name], memberSearch))
  ).slice(0, 8);

  const selectMember = (m) => {
    setForm((f) => ({ ...f, member_id: m.id, memberDisplay: `${m.name} (${m.member_id})` }));
    setMemberSearch('');
    setShowSuggestions(false);
  };

  const setDurationDays = (days) => {
    const start = form.start_date ? new Date(form.start_date) : new Date();
    const end = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
    const pad = (n) => String(n).padStart(2, '0');
    const endStr = `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}T${pad(end.getHours())}:${pad(end.getMinutes())}`;
    setForm((f) => ({ ...f, end_date: endStr }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.renterType === 'member' && !form.member_id) return setError('Please select a member.');
    if (form.renterType === 'guest' && !form.renter_name.trim()) return setError("Please enter the renter's name.");
    if (!user?.id) return setError('Sign in again to identify who collected the payment.');
    if (!form.end_date) return setError('Please set an end date/time.');
    if (new Date(form.end_date) <= new Date(form.start_date)) return setError('End date must be after start date.');

    if (items.length === 0) return setError('Please add at least one product to rent.');

    // Check duplicate products
    const selectedIds = items.map((i) => String(i.product_id)).filter(Boolean);
    const hasDupes = selectedIds.some((id, idx) => selectedIds.indexOf(id) !== idx);
    if (hasDupes) {
      return setError('You selected the same product multiple times. Adjust quantity on one line instead.');
    }

    // Validate inventory availability
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.product_id) return setError(`Please select a product for item #${i + 1}.`);
      const prod = products.find((p) => String(p.id) === String(item.product_id));
      if (!prod) return setError(`Invalid product for item #${i + 1}.`);

      const avail = Number(prod.available_quantity !== undefined ? prod.available_quantity : prod.total_quantity || 1);
      const qty = Number(item.quantity);
      if (!qty || qty < 1) return setError(`Enter a valid quantity for "${prod.name}".`);
      if (qty > avail) {
        return setError(`Cannot rent ${qty} units of "${prod.name}". Only ${avail} available in inventory.`);
      }
      if (!item.amount || Number(item.amount) <= 0) {
        return setError(`Enter a valid amount for "${prod.name}".`);
      }
    }

    const advNum = form.advance_amount ? Number(form.advance_amount) : 0;
    if (advNum < 0) return setError('Advance amount cannot be negative.');
    if (advNum > totalAmount) return setError('Advance amount cannot exceed the total rental amount.');

    setSubmitting(true);
    try {
      const itemsWithDetails = items.map((i) => {
        const prod = products.find((p) => String(p.id) === String(i.product_id));
        return {
          product_id: Number(i.product_id),
          product_name: prod?.name || 'Product',
          quantity: Number(i.quantity) || 1,
          rate_type: i.rate_type || 'day',
          rate_amount: prod ? Number(prod[`${i.rate_type}_rate`] || 0) : 0,
          amount: Number(i.amount) || 0,
        };
      });

      // Embed item metadata into notes as a guaranteed fallback across restarts/DB tables
      const metaTag = `[[ITEMS:${JSON.stringify(itemsWithDetails)}]]`;
      const combinedNotes = form.notes ? `${form.notes.trim()}\n${metaTag}` : metaTag;

      const payload = {
        items: itemsWithDetails,
        member_id: form.renterType === 'member' ? form.member_id : null,
        renter_name: form.renterType === 'guest' ? form.renter_name.trim() : null,
        start_date: form.start_date,
        end_date: form.end_date,
        advance_amount: advNum,
        advance_payment_type: advNum > 0 ? form.advance_payment_type : null,
        collected_by: user.id,
        collected_by_type: collectorType,
        notes: combinedNotes,
      };

      const result = await createRental(payload);
      showToast(`Rental booked successfully! Reference: ${result.rental_ref}`, 'success');

      // Use itemsWithDetails so all products and quantities are guaranteed to display in receipt
      const fullRental = {
        ...(result.data || {}),
        ...payload,
        id: result.id || result.data?.id,
        rental_ref: result.rental_ref || result.data?.rental_ref,
        member_name: form.renterType === 'member'
          ? (members.find((m) => String(m.id) === String(form.member_id))?.name || form.memberDisplay)
          : form.renter_name,
        member_code: form.renterType === 'member'
          ? (members.find((m) => String(m.id) === String(form.member_id))?.member_id || '')
          : '',
        status: 'active',
        amount: totalAmount,
        advance_amount: advNum,
        advance_payment_type: advNum > 0 ? form.advance_payment_type : null,
        items: (result.data?.items && result.data.items.length > 1) ? result.data.items : itemsWithDetails,
        items_summary: itemsWithDetails.map((i) => `${i.quantity}x ${i.product_name}`).join(', '),
      };

      setBookingSuccess(fullRental);
      setReceiptRental(fullRental);
      setSubmitting(false);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to record rental.';
      setError(msg);
      showToast(msg, 'error');
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-content re-page-container">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">New Rental Booking</h1>
          <p className="admin-page-subtitle">
            Rent multiple products in a single booking with live inventory tracking
          </p>
        </div>
      </div>

      {error && <div className="re-error-banner">{error}</div>}

      {bookingSuccess && (
        <div className="re-success-banner">
          <div className="re-success-info">
            <span className="re-success-icon">✓</span>
            <div>
              <strong>Rental Booked Successfully!</strong>
              <div className="re-success-ref">
                Reference: <code>{bookingSuccess.rental_ref}</code>
                {Number(bookingSuccess.advance_amount) > 0 && (
                  <span> · Advance Paid: <strong>₹{Number(bookingSuccess.advance_amount).toLocaleString('en-IN')}</strong></span>
                )}
                <span> · Status: <span className="re-success-tag">Not Yet Returned</span></span>
              </div>
            </div>
          </div>
          <div className="re-success-actions">
            <button
              type="button"
              className="re-success-btn re-success-btn--primary"
              onClick={() => setReceiptRental(bookingSuccess)}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" />
              </svg>
              View Receipt
            </button>
            <button
              type="button"
              className="re-success-btn"
              onClick={() => navigate('/admin/rentals/history')}
            >
              Rental History
            </button>
            <button
              type="button"
              className="re-success-btn re-success-btn--outline"
              onClick={() => {
                setBookingSuccess(null);
                setForm({
                  renterType: 'member',
                  member_id: '',
                  memberDisplay: '',
                  renter_name: '',
                  start_date: nowLocal(),
                  end_date: defaultEndLocal(),
                  advance_amount: '',
                  advance_payment_type: 'cash',
                  notes: '',
                });
                setItems([
                  {
                    id: 1,
                    product_id: '',
                    quantity: 1,
                    rate_type: 'day',
                    amount: '',
                    amountTouched: false,
                  },
                ]);
              }}
            >
              Book Another
            </button>
          </div>
        </div>
      )}

      <form className="re-layout" onSubmit={handleSubmit}>
        {/* ── LEFT COLUMN: Configuration & Items ── */}
        <div className="re-main-col">
          {/* Section 1: Renter Details */}
          <div className="re-card-section">
            <h2 className="re-section-title">1. Renter Information</h2>
            <div className="re-renter-toggle-wrap">
              <button
                type="button"
                className={`re-tab-btn ${form.renterType === 'member' ? 're-tab-btn--active' : ''}`}
                onClick={() => setForm((f) => ({ ...f, renterType: 'member', renter_name: '' }))}
              >
                Registered Member
              </button>
              <button
                type="button"
                className={`re-tab-btn ${form.renterType === 'guest' ? 're-tab-btn--active' : ''}`}
                onClick={() => setForm((f) => ({ ...f, renterType: 'guest', member_id: '', memberDisplay: '' }))}
              >
                Non-Member (Guest)
              </button>
            </div>

            {form.renterType === 'member' ? (
              <div className="re-input-group">
                <label className="re-field-label">Select Member *</label>
                {form.memberDisplay ? (
                  <div className="re-member-badge">
                    <span>👤 {form.memberDisplay}</span>
                    <button
                      type="button"
                      className="re-badge-remove"
                      onClick={() => setForm((f) => ({ ...f, member_id: '', memberDisplay: '' }))}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="re-search-box">
                    <input
                      className="re-form-input"
                      placeholder="Type member name or ID (e.g. PRM00125)..."
                      value={memberSearch}
                      onChange={(e) => {
                        setMemberSearch(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 160)}
                    />
                    {showSuggestions && memberSearch && filteredMembers.length > 0 && (
                      <ul className="re-dropdown-list">
                        {filteredMembers.map((m) => (
                          <li key={m.id} onMouseDown={() => selectMember(m)}>
                            <span className="re-m-name">{m.name}</span>
                            <span className="re-m-id">{m.member_id}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="re-input-group">
                <label className="re-field-label">Renter Full Name *</label>
                <input
                  className="re-form-input"
                  placeholder="Enter guest renter's full name"
                  value={form.renter_name}
                  onChange={(e) => setForm((f) => ({ ...f, renter_name: e.target.value }))}
                />
              </div>
            )}
          </div>

          {/* Section 2: Rental Duration */}
          <div className="re-card-section">
            <div className="re-section-header-flex">
              <h2 className="re-section-title">2. Rental Period</h2>
              <div className="re-quick-presets">
                <span className="re-presets-label">Quick set:</span>
                <button type="button" className="re-preset-chip" onClick={() => setDurationDays(1)}>1 Day</button>
                <button type="button" className="re-preset-chip" onClick={() => setDurationDays(3)}>3 Days</button>
                <button type="button" className="re-preset-chip" onClick={() => setDurationDays(7)}>1 Week</button>
                <button type="button" className="re-preset-chip" onClick={() => setDurationDays(30)}>1 Month</button>
              </div>
            </div>

            <div className="re-grid-2">
              <div className="re-input-group">
                <label className="re-field-label">Start Date &amp; Time *</label>
                <input
                  type="datetime-local"
                  className="re-form-input"
                  value={form.start_date}
                  onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                />
              </div>
              <div className="re-input-group">
                <label className="re-field-label">Expected Return Date &amp; Time *</label>
                <input
                  type="datetime-local"
                  className="re-form-input"
                  value={form.end_date}
                  onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Multi-Product Rental Items */}
          <div className="re-card-section">
            <div className="re-section-header-flex">
              <div>
                <h2 className="re-section-title">3. Products to Rent ({items.length})</h2>
                <p className="re-section-sub">Add one or multiple items. Quantities are capped to live stock.</p>
              </div>
              <button type="button" className="re-add-btn" onClick={addItem}>
                + Add Product
              </button>
            </div>

            <div className="re-items-container">
              {items.map((item, idx) => {
                const prod = products.find((p) => String(p.id) === String(item.product_id));
                const avail = prod ? (prod.available_quantity !== undefined ? Number(prod.available_quantity) : Number(prod.total_quantity || 1)) : null;
                const isOutOfStock = avail !== null && avail <= 0;
                const isOverStock = avail !== null && Number(item.quantity) > avail;

                return (
                  <div key={item.id} className="re-item-box">
                    <div className="re-item-box-head">
                      <span className="re-item-tag">Item #{idx + 1}</span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          className="re-item-del-btn"
                          onClick={() => removeItem(item.id)}
                          title="Remove item"
                        >
                          ✕ Remove
                        </button>
                      )}
                    </div>

                    <div className="re-grid-2">
                      {/* Product Selector */}
                      <div className="re-input-group">
                        <label className="re-field-label">Product *</label>
                        <select
                          className="re-form-input"
                          value={item.product_id}
                          onChange={(e) => updateItem(item.id, 'product_id', e.target.value)}
                        >
                          <option value="">Select a product…</option>
                          {products.map((p) => {
                            const pAvail = p.available_quantity !== undefined ? Number(p.available_quantity) : Number(p.total_quantity || 1);
                            return (
                              <option
                                key={p.id}
                                value={p.id}
                                disabled={pAvail <= 0 && String(p.id) !== String(item.product_id)}
                              >
                                {p.name} {pAvail > 0 ? `(Stock: ${pAvail})` : '(Out of Stock)'}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      {/* Quantity Stepper with Stock Chip */}
                      <div className="re-input-group">
                        <div className="re-label-flex">
                          <label className="re-field-label">Quantity *</label>
                          {avail !== null && (
                            <span className={`re-stock-chip ${isOutOfStock ? 're-stock-chip--out' : 're-stock-chip--in'}`}>
                              {avail > 0 ? `${avail} in stock` : 'Out of stock'}
                            </span>
                          )}
                        </div>

                        <div className="re-stepper">
                          <button
                            type="button"
                            className="re-step-btn"
                            disabled={!item.product_id || Number(item.quantity) <= 1}
                            onClick={() => adjustQty(item.id, -1)}
                          >
                            –
                          </button>
                          <input
                            type="number"
                            min="1"
                            max={avail !== null ? avail : undefined}
                            className={`re-stepper-input ${isOverStock ? 're-input-danger' : ''}`}
                            value={item.quantity}
                            disabled={!item.product_id || isOutOfStock}
                            onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                          />
                          <button
                            type="button"
                            className="re-step-btn"
                            disabled={!item.product_id || (avail !== null && Number(item.quantity) >= avail)}
                            onClick={() => adjustQty(item.id, 1)}
                          >
                            +
                          </button>
                        </div>
                        {isOverStock && (
                          <span className="re-input-warning">
                            Cannot exceed {avail} available in inventory!
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Rate Type & Subtotal */}
                    <div className="re-grid-2 re-mt-10">
                      <div className="re-input-group">
                        <label className="re-field-label">Billing Rate *</label>
                        <div className="re-rate-toggle">
                          {RATE_TYPES.map(({ key, label }) => (
                            <button
                              key={key}
                              type="button"
                              className={`re-rate-btn ${item.rate_type === key ? 're-rate-btn--active' : ''}`}
                              onClick={() => updateItem(item.id, 'rate_type', key)}
                              disabled={prod && !prod[`${key}_rate`]}
                            >
                              {label}{prod?.[`${key}_rate`] ? ` (₹${prod[`${key}_rate`]})` : ''}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="re-input-group">
                        <label className="re-field-label">Item Total (₹) *</label>
                        <input
                          type="number"
                          step="0.01"
                          className="re-form-input"
                          placeholder="0.00"
                          value={item.amount}
                          onChange={(e) => updateItem(item.id, 'amount', e.target.value)}
                        />
                        <span className="re-hint-text">Auto-computed: duration × rate × quantity</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: Order Summary & Checkout ── */}
        <div className="re-side-col">
          <div className="re-summary-card">
            <h3 className="re-summary-heading">Booking Summary</h3>

            {/* Itemized list */}
            <div className="re-summary-items">
              {items.map((i, idx) => {
                const prod = products.find((p) => String(p.id) === String(i.product_id));
                return (
                  <div key={i.id} className="re-summary-row">
                    <span className="re-sum-name">
                      {prod ? prod.name : `Item #${idx + 1}`} × {i.quantity}
                    </span>
                    <span className="re-sum-price">₹{Number(i.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                );
              })}
            </div>

            <div className="re-summary-divider" />

            <div className="re-summary-total-row">
              <span>Total Amount:</span>
              <span className="re-total-amount-display">
                ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {/* Advance Payment Section */}
            <div className="re-advance-box">
              <label className="re-field-label">Advance Payment (Optional)</label>
              <div className="re-advance-input-wrap">
                <span className="re-currency-prefix">₹</span>
                <input
                  type="number"
                  min="0"
                  max={totalAmount > 0 ? totalAmount : undefined}
                  step="0.01"
                  placeholder="0.00"
                  className="re-form-input re-advance-field"
                  value={form.advance_amount}
                  onChange={(e) => setForm((f) => ({ ...f, advance_amount: e.target.value }))}
                />
              </div>

              {Number(form.advance_amount) > 0 && (
                <div className="re-adv-type-toggle">
                  <button
                    type="button"
                    className={`re-mini-btn ${form.advance_payment_type === 'cash' ? 're-mini-btn--active' : ''}`}
                    onClick={() => setForm((f) => ({ ...f, advance_payment_type: 'cash' }))}
                  >
                    💵 Cash
                  </button>
                  <button
                    type="button"
                    className={`re-mini-btn ${form.advance_payment_type === 'qr' ? 're-mini-btn--active' : ''}`}
                    onClick={() => setForm((f) => ({ ...f, advance_payment_type: 'qr' }))}
                  >
                    📱 UPI / QR
                  </button>
                </div>
              )}
            </div>

            <div className="re-balance-row">
              <span>Balance due at return:</span>
              <strong className="re-balance-val">
                ₹{balanceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </strong>
            </div>

            {/* Notes */}
            <div className="re-input-group re-mt-14">
              <label className="re-field-label">Booking Remarks</label>
              <textarea
                rows={2}
                className="re-form-input"
                placeholder="Optional notes, event details, or purpose…"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>

            {/* Collector info */}
            <div className="re-collector-note">
              Collected by: <strong>{collectorLabel || 'Logged in user'}</strong>
            </div>

            <button type="submit" className="re-confirm-btn" disabled={submitting}>
              {submitting ? 'Creating Booking…' : 'Confirm & Book Rental'}
            </button>
          </div>
        </div>
      </form>
      {receiptRental && (
        <ReceiptModal
          rental={receiptRental}
          onClose={() => setReceiptRental(null)}
        />
      )}
    </div>
  );
}

export default RentalEntry;
