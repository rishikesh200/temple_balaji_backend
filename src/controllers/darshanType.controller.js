import asyncHandler from 'express-async-handler';
import DarshanType from '../models/DarshanType.js';

// GET /api/darshan-types  — public, only active
export const getDarshanTypes = asyncHandler(async (req, res) => {
  const filter = req.query.all === 'true' ? {} : { active: true };
  const items = await DarshanType.find(filter).sort({ createdAt: 1 }).lean();
  res.json({ success: true, data: items });
});

// POST /api/darshan-types  — admin only
export const createDarshanType = asyncHandler(async (req, res) => {
  const { id, title } = req.body;
  if (!id || !title) { res.status(400); throw new Error('id and title are required.'); }
  const item = await DarshanType.create(req.body);
  res.status(201).json({ success: true, data: item });
});

// PUT /api/darshan-types/:id  — admin only
export const updateDarshanType = asyncHandler(async (req, res) => {
  const item = await DarshanType.findOneAndUpdate(
    { id: req.params.id },
    { $set: req.body },
    { new: true, runValidators: false }
  );
  if (!item) { res.status(404); throw new Error('Darshan type not found.'); }
  res.json({ success: true, data: item });
});

// DELETE /api/darshan-types/:id  — admin only
export const deleteDarshanType = asyncHandler(async (req, res) => {
  const item = await DarshanType.findOneAndDelete({ id: req.params.id });
  if (!item) { res.status(404); throw new Error('Darshan type not found.'); }
  res.json({ success: true, message: 'Deleted.' });
});
