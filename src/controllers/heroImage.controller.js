import asyncHandler from 'express-async-handler';
import HeroImage from '../models/HeroImage.js';

// GET /api/hero-images  — public; ?all=true for admin
export const getHeroImages = asyncHandler(async (req, res) => {
  const filter = req.query.all === 'true' ? {} : { isActive: true };
  const items = await HeroImage.find(filter).sort({ sortOrder: 1, createdAt: 1 }).lean();
  res.json({ success: true, data: items });
});

// POST /api/hero-images  — admin only
export const createHeroImage = asyncHandler(async (req, res) => {
  const { id, imageUrl } = req.body;
  if (!id || !imageUrl) { res.status(400); throw new Error('id and imageUrl are required.'); }
  const item = await HeroImage.create(req.body);
  res.status(201).json({ success: true, data: item });
});

// PUT /api/hero-images/:id  — admin only
export const updateHeroImage = asyncHandler(async (req, res) => {
  const item = await HeroImage.findOneAndUpdate(
    { id: req.params.id },
    { $set: req.body },
    { new: true, runValidators: false }
  );
  if (!item) { res.status(404); throw new Error('Hero image not found.'); }
  res.json({ success: true, data: item });
});

// DELETE /api/hero-images/:id  — admin only
export const deleteHeroImage = asyncHandler(async (req, res) => {
  const item = await HeroImage.findOneAndDelete({ id: req.params.id });
  if (!item) { res.status(404); throw new Error('Hero image not found.'); }
  res.json({ success: true, message: 'Deleted.' });
});
