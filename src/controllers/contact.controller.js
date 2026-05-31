import asyncHandler from 'express-async-handler';
import ContactMessage from '../models/ContactMessage.js';

// POST /api/contact  — public, submit a contact message
export const submitContact = asyncHandler(async (req, res) => {
  const { name, email, phone, message } = req.body;
  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    res.status(400);
    throw new Error('Name, email, and message are required.');
  }
  const msg = await ContactMessage.create({ name, email, phone, message });
  res.status(201).json({ success: true, message: 'Your message has been received. We will get back to you shortly.' });
});

// GET /api/contact  — admin only, list all messages
export const getContacts = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 30 } = req.query;
  const filter = status ? { status } : {};
  const total = await ContactMessage.countDocuments(filter);
  const messages = await ContactMessage.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .lean();
  res.json({ success: true, data: messages, total, page: Number(page) });
});

// PUT /api/contact/:id  — admin only, update status / note
export const updateContact = asyncHandler(async (req, res) => {
  const msg = await ContactMessage.findByIdAndUpdate(
    req.params.id,
    { $set: { status: req.body.status, adminNote: req.body.adminNote } },
    { new: true, runValidators: false }
  );
  if (!msg) { res.status(404); throw new Error('Message not found.'); }
  res.json({ success: true, data: msg });
});

// DELETE /api/contact/:id  — admin only
export const deleteContact = asyncHandler(async (req, res) => {
  const msg = await ContactMessage.findByIdAndDelete(req.params.id);
  if (!msg) { res.status(404); throw new Error('Message not found.'); }
  res.json({ success: true, message: 'Deleted.' });
});
