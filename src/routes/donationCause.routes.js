import express from 'express';
import { getDonationCauses, createDonationCause, updateDonationCause, deleteDonationCause } from '../controllers/donationCause.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/',       getDonationCauses);
router.post('/',      protect, createDonationCause);
router.put('/:id',    protect, updateDonationCause);
router.delete('/:id', protect, deleteDonationCause);

export default router;
