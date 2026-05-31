import express from 'express';
import { getHeroImages, createHeroImage, updateHeroImage, deleteHeroImage } from '../controllers/heroImage.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/',       getHeroImages);
router.post('/',      protect, createHeroImage);
router.put('/:id',    protect, updateHeroImage);
router.delete('/:id', protect, deleteHeroImage);

export default router;
