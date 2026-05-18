import express from 'express';
import {
  getDonations,
  getDonationStats,
  getDonationById,
  updateDonation,
  sendDonationAcknowledgment,
  deleteDonation,
} from '../controllers/donation.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected (Admin only)
router.get('/', protect, getDonations);
router.get('/stats', protect, getDonationStats);
router.get('/:donationId', protect, getDonationById);
router.put('/:donationId', protect, updateDonation);
router.post('/:donationId/send-acknowledgment', protect, sendDonationAcknowledgment);
router.delete('/:donationId', protect, deleteDonation);

export default router;
