import asyncHandler from 'express-async-handler';
import GalleryImage from '../models/GalleryImage.js';

// GET /api/gallery  — public; ?all=true returns inactive too
export const getGalleryImages = asyncHandler(async (req, res) => {
  const filter = req.query.all === 'true' ? {} : { isActive: true };
  const items = await GalleryImage.find(filter).sort({ sortOrder: 1, createdAt: -1 }).lean();
  res.json({ success: true, data: items });
});

// POST /api/gallery  — admin only
export const createGalleryImage = asyncHandler(async (req, res) => {
  const { id, imageUrl } = req.body;
  if (!id || !imageUrl) { res.status(400); throw new Error('id and imageUrl are required.'); }
  const item = await GalleryImage.create(req.body);
  res.status(201).json({ success: true, data: item });
});

// PUT /api/gallery/:id  — admin only
export const updateGalleryImage = asyncHandler(async (req, res) => {
  const item = await GalleryImage.findOneAndUpdate(
    { id: req.params.id },
    { $set: req.body },
    { new: true, runValidators: false }
  );
  if (!item) { res.status(404); throw new Error('Gallery image not found.'); }
  res.json({ success: true, data: item });
});

// DELETE /api/gallery/:id  — admin only
export const deleteGalleryImage = asyncHandler(async (req, res) => {
  const item = await GalleryImage.findOneAndDelete({ id: req.params.id });
  if (!item) { res.status(404); throw new Error('Gallery image not found.'); }
  res.json({ success: true, message: 'Deleted.' });
});
