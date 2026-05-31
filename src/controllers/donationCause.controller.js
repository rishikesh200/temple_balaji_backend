import asyncHandler from 'express-async-handler';
import DonationCause from '../models/DonationCause.js';

// GET /api/donation-causes  — public, only active
export const getDonationCauses = asyncHandler(async (req, res) => {
  const filter = req.query.all === 'true' ? {} : { active: true };
  const items = await DonationCause.find(filter).sort({ createdAt: 1 }).lean();
  res.json({ success: true, data: items });
});

// POST /api/donation-causes  — admin only
export const createDonationCause = asyncHandler(async (req, res) => {
  const { id, title } = req.body;
  if (!id || !title) { res.status(400); throw new Error('id and title are required.'); }
  const item = await DonationCause.create(req.body);
  res.status(201).json({ success: true, data: item });
});

// PUT /api/donation-causes/:id  — admin only
export const updateDonationCause = asyncHandler(async (req, res) => {
  const item = await DonationCause.findOneAndUpdate(
    { id: req.params.id },
    { $set: req.body },
    { new: true, runValidators: false }
  );
  if (!item) { res.status(404); throw new Error('Donation cause not found.'); }
  res.json({ success: true, data: item });
});

// DELETE /api/donation-causes/:id  — admin only
export const deleteDonationCause = asyncHandler(async (req, res) => {
  const item = await DonationCause.findOneAndDelete({ id: req.params.id });
  if (!item) { res.status(404); throw new Error('Donation cause not found.'); }
  res.json({ success: true, message: 'Deleted.' });
});
