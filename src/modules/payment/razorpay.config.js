import Razorpay from 'razorpay';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Razorpay Configuration
 * This is a modular configuration that can be used across any project
 * Ensure these environment variables are set:
 * - RAZORPAY_KEY_ID
 * - RAZORPAY_KEY_SECRET
 */

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.warn('⚠️  Razorpay credentials are not configured. Payment features will not work.');
}

export default razorpayInstance;
