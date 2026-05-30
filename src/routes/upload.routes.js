import express from 'express';
import multer from 'multer';
import { put } from '@vercel/blob';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const MAX_SIZE = 7 * 1024 * 1024; // 7 MB

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

// POST /api/upload/image
// Protected — admin only
router.post('/image', protect, (req, res, next) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'File too large. Maximum size is 7 MB.' });
      }
      return res.status(400).json({ success: false, message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    try {
      const folder = req.body.folder || 'temple';
      const ext    = req.file.originalname.split('.').pop();
      const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const blob = await put(filename, req.file.buffer, {
        access: 'public',
        contentType: req.file.mimetype,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });

      return res.json({ success: true, url: blob.url });
    } catch (uploadErr) {
      console.error('Vercel Blob upload error:', uploadErr);
      return res.status(500).json({ success: false, message: 'Image upload failed. Check BLOB_READ_WRITE_TOKEN.' });
    }
  });
});

// DELETE /api/upload/image  — delete by URL
router.delete('/image', protect, async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ success: false, message: 'url required' });
  try {
    const { del } = await import('@vercel/blob');
    await del(url, { token: process.env.BLOB_READ_WRITE_TOKEN });
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
});

export default router;
