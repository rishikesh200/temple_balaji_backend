import express from 'express';
import { getDarshanTypes, createDarshanType, updateDarshanType, deleteDarshanType } from '../controllers/darshanType.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/',       getDarshanTypes);
router.post('/',      protect, createDarshanType);
router.put('/:id',    protect, updateDarshanType);
router.delete('/:id', protect, deleteDarshanType);

export default router;
