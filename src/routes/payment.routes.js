import express from 'express';
import {
  createDonationOrder,
  createPoojaOrder,
  createDarshanOrder,
  verifyPayment,
  handleWebhook,
  refundPayment,
  getPaymentDetails,
  getPayments,
} from '../controllers/payment.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/create-donation-order', createDonationOrder);
router.post('/create-pooja-order', createPoojaOrder);
router.post('/create-darshan-order', createDarshanOrder);
router.post('/verify', verifyPayment);
router.post('/webhook', handleWebhook);

// Protected routes (Admin only)
router.get('/', protect, getPayments);
router.get('/:paymentId', protect, getPaymentDetails);
router.post('/:paymentId/refund', protect, refundPayment);

export default router;
