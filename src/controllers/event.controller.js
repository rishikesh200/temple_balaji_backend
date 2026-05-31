import asyncHandler from 'express-async-handler';
import TempleEvent from '../models/TempleEvent.js';

// GET /api/events  — public, only active
export const getEvents = asyncHandler(async (req, res) => {
  const filter = req.query.all === 'true' ? {} : { active: true };
  const items = await TempleEvent.find(filter).sort({ createdAt: 1 }).lean();
  res.json({ success: true, data: items });
});

// POST /api/events  — admin only
export const createEvent = asyncHandler(async (req, res) => {
  const { id, title } = req.body;
  if (!id || !title) { res.status(400); throw new Error('id and title are required.'); }
  const item = await TempleEvent.create(req.body);
  res.status(201).json({ success: true, data: item });
});

// PUT /api/events/:id  — admin only
export const updateEvent = asyncHandler(async (req, res) => {
  const item = await TempleEvent.findOneAndUpdate(
    { id: req.params.id },
    { $set: req.body },
    { new: true, runValidators: false }
  );
  if (!item) { res.status(404); throw new Error('Event not found.'); }
  res.json({ success: true, data: item });
});

// DELETE /api/events/:id  — admin only
export const deleteEvent = asyncHandler(async (req, res) => {
  const item = await TempleEvent.findOneAndDelete({ id: req.params.id });
  if (!item) { res.status(404); throw new Error('Event not found.'); }
  res.json({ success: true, message: 'Deleted.' });
});
