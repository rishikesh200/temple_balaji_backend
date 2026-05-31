import asyncHandler from 'express-async-handler';
import PoojaItem from '../models/PoojaItem.js';

// GET /api/poojas  — public, only active
export const getPoojaItems = asyncHandler(async (req, res) => {
  const filter = req.query.all === 'true' ? {} : { active: true };
  const items = await PoojaItem.find(filter).sort({ createdAt: 1 }).lean();
  res.json({ success: true, data: items });
});

// POST /api/poojas  — admin only
export const createPoojaItem = asyncHandler(async (req, res) => {
  const { id, name, category } = req.body;
  if (!id || !name || !category) {
    res.status(400);
    throw new Error('id, name, and category are required.');
  }
  const item = await PoojaItem.create(req.body);
  res.status(201).json({ success: true, data: item });
});

// PUT /api/poojas/:id  — admin only
export const updatePoojaItem = asyncHandler(async (req, res) => {
  const item = await PoojaItem.findOneAndUpdate(
    { id: req.params.id },
    { $set: req.body },
    { new: true, runValidators: false }
  );
  if (!item) { res.status(404); throw new Error('Pooja item not found.'); }
  res.json({ success: true, data: item });
});

// DELETE /api/poojas/:id  — admin only
export const deletePoojaItem = asyncHandler(async (req, res) => {
  const item = await PoojaItem.findOneAndDelete({ id: req.params.id });
  if (!item) { res.status(404); throw new Error('Pooja item not found.'); }
  res.json({ success: true, message: 'Deleted.' });
});
