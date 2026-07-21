import { asyncHandler } from '../middleware/errorHandler.js';
import { bookRental, fetchRentals, fetchRentalDetail, changeRentalStatus } from '../services/rentalService.js';

const parseId = (req, res) => {
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) {
    res.status(400).json({ success: false, message: 'Invalid rental ID' });
    return null;
  }
  return id;
};

export const listRentals = asyncHandler(async (req, res) => {
  const { member_id, product_id, status } = req.query;
  const rentals = await fetchRentals({ member_id, product_id, status });
  res.json({ success: true, count: rentals.length, data: rentals });
});

export const getRental = asyncHandler(async (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  const rental = await fetchRentalDetail(id);
  res.json({ success: true, data: rental });
});

export const createRental = asyncHandler(async (req, res) => {
  const id = await bookRental(req.body);
  res.status(201).json({ success: true, message: 'Rental recorded', id });
});

export const updateRentalStatus = asyncHandler(async (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  await changeRentalStatus(id, req.body.status);
  res.json({ success: true, message: 'Rental status updated' });
});
