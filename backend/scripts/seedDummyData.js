// One-off script — seeds ~50 dummy rows each into pending_payments (dues),
// payments, rentals (plus a handful of rental_products, since that table
// starts empty) and attendance, so the admin Reports/History pages and
// dashboards have something to render while testing against the real
// 1000+ member dataset. Purely for local/testing use — never run against a
// real production database with real financial records.
//
// Dry run (default, no DB writes):
//   node scripts/seedDummyData.js
// Apply (writes the data):
//   node scripts/seedDummyData.js --apply
import dotenv from 'dotenv';
import { initializePool, query } from '../src/config/database.js';

dotenv.config();

const DRY_RUN = !process.argv.includes('--apply');
const COUNT = 50;

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const toDateStr = (d) => d.toISOString().slice(0, 10);
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};
const daysFromNow = (n) => daysAgo(-n);

const generatePaymentRef = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `PAY-${date}-${rand}-${Math.floor(Math.random() * 1000)}`;
};

const RENTAL_PRODUCTS = [
  { name: 'Plastic Chairs (set of 50)', description: 'Stackable plastic chairs for events', per_day_rate: 500, per_hour_rate: 100 },
  { name: 'Round Tables (set of 10)', description: 'Round banquet tables', per_day_rate: 800, per_hour_rate: 150 },
  { name: 'Sound System', description: 'PA system with 2 speakers and mixer', per_day_rate: 1500, per_hour_rate: 300 },
  { name: 'Shamiana Tent (20x30)', description: 'Decorated function tent', per_day_rate: 3000, per_hour_rate: null },
  { name: 'Diesel Generator (5KVA)', description: 'Backup power generator', per_day_rate: 1200, per_hour_rate: 250 },
];

const DUE_TITLES = ['Annual Membership Fee', 'Event Fee', 'Marriage Certificate Fee', 'Donation Pledge', 'Late Renewal Fee'];

const run = async () => {
  await initializePool();

  const members = await query('SELECT id FROM members');
  const memberIds = members.map((m) => m.id);
  if (memberIds.length === 0) {
    console.log('No members found — nothing to seed against.');
    process.exit(1);
  }

  const categories = await query('SELECT id, name, default_amount FROM payment_categories WHERE is_active = 1');
  if (categories.length === 0) {
    console.log('No payment categories found — cannot seed dues/payments.');
    process.exit(1);
  }

  const existingProducts = await query('SELECT id, name FROM rental_products');
  const productsToSeed = existingProducts.length === 0 ? RENTAL_PRODUCTS : [];

  console.log(`Members available: ${memberIds.length}`);
  console.log(`Payment categories available: ${categories.length}`);
  console.log(`Rental products: ${existingProducts.length} existing, ${productsToSeed.length} would be seeded`);
  console.log(`Would insert: ${COUNT} pending_payments, ${COUNT} payments, ${COUNT} rentals, ${COUNT} attendance rows`);

  if (DRY_RUN) {
    console.log('\nThis was a dry run — no changes were written. Re-run with --apply to write the data.');
    process.exit(0);
  }

  // ── rental_products (only if empty) ──
  let productIds = existingProducts.map((p) => p.id);
  if (productsToSeed.length > 0) {
    for (const p of productsToSeed) {
      const result = await query(
        'INSERT INTO rental_products (name, description, per_day_rate, per_hour_rate, is_active) VALUES (?, ?, ?, ?, 1)',
        [p.name, p.description, p.per_day_rate, p.per_hour_rate]
      );
      productIds.push(result.insertId);
    }
    console.log(`Seeded ${productsToSeed.length} rental_products.`);
  }

  // ── pending_payments (dues) — spread of overdue / due-today / upcoming / already-paid ──
  for (let i = 0; i < COUNT; i++) {
    const memberId = pick(memberIds);
    const category = pick(categories);
    const title = pick(DUE_TITLES);
    const amount = category.default_amount || randInt(200, 2000);
    const dueOffset = randInt(-45, 45); // negative = overdue, positive = upcoming
    const dueDate = toDateStr(dueOffset >= 0 ? daysFromNow(dueOffset) : daysAgo(-dueOffset));
    const status = Math.random() < 0.15 ? 'paid' : 'pending';

    await query(
      'INSERT INTO pending_payments (member_id, category_id, title, amount, due_date, status, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [memberId, category.id, title, amount, dueDate, status]
    );
  }
  console.log(`Inserted ${COUNT} pending_payments.`);

  // ── payments — spread over the last ~8 months for trend charts ──
  const paymentTypes = ['cash', 'cash', 'cash', 'qr'];
  for (let i = 0; i < COUNT; i++) {
    const memberId = pick(memberIds);
    const collectedBy = pick(memberIds);
    const category = pick(categories);
    const amount = category.default_amount || randInt(200, 2000);
    const paymentDate = toDateStr(daysAgo(randInt(0, 240)));
    const paymentType = pick(paymentTypes);
    const paymentRef = generatePaymentRef();

    await query(
      `INSERT INTO payments (payment_ref, member_id, category_id, amount, payment_date, collected_by, payment_type, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [paymentRef, memberId, category.id, amount, paymentDate, collectedBy, paymentType, 'Dummy test data']
    );
  }
  console.log(`Inserted ${COUNT} payments.`);

  // ── rentals — spread of active / returned / cancelled ──
  const rentalStatuses = ['active', 'returned', 'returned', 'cancelled'];
  for (let i = 0; i < COUNT; i++) {
    const memberId = pick(memberIds);
    const collectedBy = pick(memberIds);
    const productId = pick(productIds);
    const rateType = Math.random() < 0.7 ? 'day' : 'hour';
    const startOffset = randInt(1, 200);
    const start = daysAgo(startOffset);
    const durationUnits = randInt(1, rateType === 'day' ? 5 : 12);
    const end = new Date(start);
    if (rateType === 'day') end.setDate(end.getDate() + durationUnits);
    else end.setHours(end.getHours() + durationUnits);
    const rateAmount = randInt(300, 3000);
    const amount = rateAmount * durationUnits;
    const status = startOffset < 2 ? 'active' : pick(rentalStatuses);

    await query(
      `INSERT INTO rentals (product_id, member_id, rate_type, rate_amount, start_date, end_date, amount, payment_type, collected_by, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        productId,
        memberId,
        rateType,
        rateAmount,
        start,
        end,
        amount,
        pick(['cash', 'qr']),
        collectedBy,
        status,
        start,
      ]
    );
  }
  console.log(`Inserted ${COUNT} rentals.`);

  // ── attendance — spread over the last 20 days, some still "checked in" ──
  for (let i = 0; i < COUNT; i++) {
    const memberId = pick(memberIds);
    const markedBy = pick(memberIds);
    const dayOffset = randInt(0, 20);
    const attendanceDate = daysAgo(dayOffset);
    const checkIn = new Date(attendanceDate);
    checkIn.setHours(randInt(8, 11), randInt(0, 59), 0, 0);
    const stillIn = dayOffset === 0 && Math.random() < 0.3;
    let checkOut = null;
    if (!stillIn) {
      checkOut = new Date(checkIn);
      checkOut.setHours(checkOut.getHours() + randInt(1, 8));
    }

    await query(
      'INSERT INTO attendance (member_id, attendance_date, check_in_time, check_out_time, marked_by) VALUES (?, ?, ?, ?, ?)',
      [memberId, toDateStr(attendanceDate), checkIn, checkOut, markedBy]
    );
  }
  console.log(`Inserted ${COUNT} attendance records.`);

  console.log('\nDone.');
  process.exit(0);
};

run().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
