import express from 'express';
import { getPoojaItems, createPoojaItem, updatePoojaItem, deletePoojaItem } from '../controllers/poojaItem.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/',       getPoojaItems);
router.post('/',      protect, createPoojaItem);
router.put('/:id',    protect, updatePoojaItem);
router.delete('/:id', protect, deletePoojaItem);

export default router;
