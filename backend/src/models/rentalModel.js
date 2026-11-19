import { query } from '../config/database.js';

// Mirrors paymentModel.js's generatePaymentRef — same shape, different
// prefix, so every income source in the app carries a consistent,
// human-shareable reference id for future lookup/reconciliation.
const generateRentalRef = () => {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `RENT-${date}-${rand}`;
};

const SELECT_BASE = `
  SELECT r.*,
    p.name AS product_name,
    m.name AS member_name, m.member_id AS member_code,
    COALESCE(cbm.name, cbu.name) AS collected_by_name
  FROM rentals r
  LEFT JOIN rental_products p ON r.product_id = p.id
  LEFT JOIN members m ON r.member_id = m.id
  LEFT JOIN members cbm ON r.collected_by_type = 'member' AND r.collected_by = cbm.id
  LEFT JOIN users cbu ON r.collected_by_type = 'staff' AND r.collected_by = cbu.id
`;

const attachRentalItems = async (rentals) => {
  if (!rentals || rentals.length === 0) return rentals;

  const rentalIds = rentals.map((r) => r.id);
  let itemsByRental = {};

  try {
    const placeholders = rentalIds.map(() => '?').join(',');
    const itemRows = await query(
      `SELECT ri.*, p.name AS product_name
       FROM rental_items ri
       JOIN rental_products p ON ri.product_id = p.id
       WHERE ri.rental_id IN (${placeholders})`,
      rentalIds
    );

    itemRows.forEach((item) => {
      if (!itemsByRental[item.rental_id]) itemsByRental[item.rental_id] = [];
      itemsByRental[item.rental_id].push(item);
    });
  } catch {
    // rental_items table not created yet, fall back to legacy rental row representation
  }

  return rentals.map((r) => {
    let items = itemsByRental[r.id] && itemsByRental[r.id].length > 0
      ? itemsByRental[r.id]
      : [];

    // Fallback: parse item list from notes if rental_items table was not available
    if (items.length === 0 && r.notes && r.notes.includes('[[ITEMS:')) {
      try {
        const match = r.notes.match(/\[\[ITEMS:(.*?)\]\]/);
        if (match && match[1]) {
          items = JSON.parse(match[1]);
        }
      } catch {
        // ignore parse error
      }
    }

    if (items.length === 0 && r.product_id) {
      items = [{
        id: `legacy-${r.id}`,
        rental_id: r.id,
        product_id: r.product_id,
        product_name: r.product_name,
        quantity: r.quantity || 1,
        rate_type: r.rate_type,
        rate_amount: r.rate_amount,
        amount: r.amount,
      }];
    }

    const cleanNotes = r.notes ? r.notes.replace(/\[\[ITEMS:.*?\]\]/g, '').trim() : r.notes;

    const itemsSummary = items.length > 0
      ? items.map((i) => `${i.quantity}x ${i.product_name || 'Product'}`).join(', ')
      : r.product_name || '—';

    const totalQuantity = items.reduce((sum, i) => sum + (Number(i.quantity) || 1), 0);

    return {
      ...r,
      notes: cleanNotes || null,
      items,
      items_summary: itemsSummary,
      total_quantity: totalQuantity,
    };
  });
};

export const getRentalById = async (id) => {
  const rows = await query(`${SELECT_BASE} WHERE r.id = ?`, [id]);
  if (!rows[0]) return null;
  const [enriched] = await attachRentalItems(rows);
  return enriched || null;
};

export const getAllRentals = async (filters = {}) => {
  const conditions = [];
  const values = [];

  if (filters.member_id) {
    conditions.push('r.member_id = ?');
    values.push(filters.member_id);
  }
  if (filters.product_id) {
    conditions.push('(r.product_id = ? OR EXISTS (SELECT 1 FROM rental_items ri WHERE ri.rental_id = r.id AND ri.product_id = ?))');
    values.push(filters.product_id, filters.product_id);
  }
  if (filters.status) {
    conditions.push('r.status = ?');
    values.push(filters.status);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const rows = await query(
    `${SELECT_BASE} ${where} ORDER BY r.created_at DESC`,
    values
  );

  return await attachRentalItems(rows);
};

export const createRental = async ({
  items = [], product_id, quantity = 1, member_id, renter_name, rate_type, rate_amount, start_date, end_date,
  amount, advance_amount = 0, advance_payment_type = null, collected_by = null, collected_by_type = 'member', notes = null,
}) => {
  const rental_ref = generateRentalRef();

  // Primary product info for backward compatibility in rentals table columns
  const firstItem = items.length > 0 ? items[0] : null;
  const primaryProductId = firstItem ? firstItem.product_id : product_id;
  const totalQty = items.length > 0
    ? items.reduce((sum, i) => sum + (Number(i.quantity) || 1), 0)
    : quantity;
  const primaryRateType = firstItem ? firstItem.rate_type : rate_type;
  const primaryRateAmount = firstItem ? firstItem.rate_amount : rate_amount;

  // Dual-store items in notes so multi-item breakdown is 100% resilient
  // even if the rental_items table migration hasn't been executed yet.
  let notesWithItems = notes;
  if (items.length > 0) {
    const metaTag = `[[ITEMS:${JSON.stringify(items.map((i) => ({
      product_id: i.product_id,
      product_name: i.product_name,
      quantity: Number(i.quantity) || 1,
      rate_type: i.rate_type || 'day',
      rate_amount: Number(i.rate_amount) || 0,
      amount: Number(i.amount) || 0,
    })))}]]`;
    notesWithItems = notes ? `${notes}\n${metaTag}` : metaTag;
  }

  const result = await query(
    `INSERT INTO rentals
      (rental_ref, product_id, quantity, member_id, renter_name, rate_type, rate_amount, start_date, end_date, amount, advance_amount, advance_payment_type, collected_by, collected_by_type, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      rental_ref,
      primaryProductId || null,
      totalQty,
      member_id || null,
      renter_name || null,
      primaryRateType || 'day',
      primaryRateAmount || 0,
      start_date,
      end_date,
      amount,
      advance_amount,
      advance_payment_type,
      collected_by,
      collected_by_type,
      notesWithItems,
    ]
  );

  const rentalId = result.insertId;

  // Insert line items into rental_items if items provided
  if (items.length > 0) {
    try {
      for (const item of items) {
        await query(
          `INSERT INTO rental_items (rental_id, product_id, quantity, rate_type, rate_amount, amount)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            rentalId,
            item.product_id,
            item.quantity || 1,
            item.rate_type || 'day',
            item.rate_amount || 0,
            item.amount || 0,
          ]
        );
      }
    } catch {
      // If rental_items table doesn't exist yet, booking in rentals is still preserved
    }
  }

  return { id: rentalId, rental_ref, amount, advance_amount };
};

// Only for 'active' <-> 'cancelled' — returning a rental goes through
// settleRentalReturn instead, since it also records the final settlement.
export const updateRentalStatus = async (id, status) => {
  return await query(
    'UPDATE rentals SET status = ?, updated_at = NOW() WHERE id = ?',
    [status, id]
  );
};

export const settleRentalReturn = async (id, { end_date, amount, settlement_payment_type }) => {
  return await query(
    `UPDATE rentals
     SET status = 'returned', end_date = ?, amount = ?, settlement_payment_type = ?, returned_at = NOW(), updated_at = NOW()
     WHERE id = ?`,
    [end_date, amount, settlement_payment_type, id]
  );
};
