import express from 'express';
import {
  getDarshanBookings,
  getDarshanStats,
  getDarshanBookingById,
  updateDarshanBooking,
  sendDarshanConfirmation,
  sendDarshanReminder,
  deleteDarshanBooking,
} from '../controllers/darshan.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected (Admin only)
router.get('/', protect, getDarshanBookings);
router.get('/stats', protect, getDarshanStats);
router.get('/:bookingId', protect, getDarshanBookingById);
router.put('/:bookingId', protect, updateDarshanBooking);
router.post('/:bookingId/send-confirmation', protect, sendDarshanConfirmation);
router.post('/:bookingId/send-reminder', protect, sendDarshanReminder);
router.delete('/:bookingId', protect, deleteDarshanBooking);

export default router;
