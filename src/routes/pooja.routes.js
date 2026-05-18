import express from 'express';
import {
  getPoojaBookings,
  getPoojaStats,
  getPoojaBookingById,
  updatePoojaBooking,
  sendPoojaConfirmation,
  sendPoojaReminder,
  deletePoojaBooking,
} from '../controllers/pooja.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected (Admin only)
router.get('/', protect, getPoojaBookings);
router.get('/stats', protect, getPoojaStats);
router.get('/:bookingId', protect, getPoojaBookingById);
router.put('/:bookingId', protect, updatePoojaBooking);
router.post('/:bookingId/send-confirmation', protect, sendPoojaConfirmation);
router.post('/:bookingId/send-reminder', protect, sendPoojaReminder);
router.delete('/:bookingId', protect, deletePoojaBooking);

export default router;
