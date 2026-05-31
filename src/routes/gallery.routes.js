import express from 'express';
import { getGalleryImages, createGalleryImage, updateGalleryImage, deleteGalleryImage } from '../controllers/gallery.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/',       getGalleryImages);
router.post('/',      protect, createGalleryImage);
router.put('/:id',    protect, updateGalleryImage);
router.delete('/:id', protect, deleteGalleryImage);

export default router;
