import razorpayInstance from './razorpay.config.js';
import crypto from 'crypto';

/**
 * PaymentService - Modular Razorpay Payment Service
 * Can be reused in any Node.js/Express project
 * 
 * Features:
 * - Create orders
 * - Verify payment signatures
 * - Handle payment callbacks
 * - Support multiple payment types (donations, bookings, etc.)
 */

class PaymentService {
  /**
   * Create a Razorpay order
   * @param {Object} options - Order options
   * @param {number} options.amount - Amount in paise (e.g., 50000 for ₹500)
   * @param {string} options.currency - Currency code (default: 'INR')
   * @param {string} options.receipt - Unique receipt ID
   * @param {Object} options.notes - Additional notes/metadata
   * @returns {Promise<Object>} Razorpay order details
   */
  async createOrder(options) {
    try {
      const {
        amount,
        currency = 'INR',
        receipt,
        notes = {},
        description = 'Payment for Temple Services',
      } = options;

      if (!amount || amount <= 0) {
        throw new Error('Invalid amount. Amount must be greater than 0.');
      }

      const orderOptions = {
        amount: Math.round(amount), // Ensure amount is in paise
        currency,
        receipt,
        description,
        notes,
      };

      const order = await razorpayInstance.orders.create(orderOptions);
      return {
        success: true,
        data: order,
      };
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      let errorMessage = 'Unknown Razorpay error';

      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.error?.description) {
        errorMessage = error.error.description;
      } else if (error?.error) {
        errorMessage = JSON.stringify(error.error);
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else {
        try {
          errorMessage = JSON.stringify(error);
        } catch (serializeErr) {
          errorMessage = String(error);
        }
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Verify payment signature
   * @param {Object} paymentData - Payment data from webhook/callback
   * @param {string} paymentData.orderId - Razorpay order ID
   * @param {string} paymentData.paymentId - Razorpay payment ID
   * @param {string} paymentData.signature - Razorpay payment signature
   * @returns {boolean} True if signature is valid
   */
  verifyPaymentSignature(paymentData) {
    try {
      const { orderId, paymentId, signature } = paymentData;

      const body = orderId + '|' + paymentId;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');

      const isValid = expectedSignature === signature;
      return isValid;
    } catch (error) {
      console.error('Error verifying payment signature:', error.message);
      return false;
    }
  }

  /**
   * Fetch payment details from Razorpay
   * @param {string} paymentId - Razorpay payment ID
   * @returns {Promise<Object>} Payment details
   */
  async getPaymentDetails(paymentId) {
    try {
      const payment = await razorpayInstance.payments.fetch(paymentId);
      return {
        success: true,
        data: payment,
      };
    } catch (error) {
      console.error('Error fetching payment details:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Fetch order details from Razorpay
   * @param {string} orderId - Razorpay order ID
   * @returns {Promise<Object>} Order details
   */
  async getOrderDetails(orderId) {
    try {
      const order = await razorpayInstance.orders.fetch(orderId);
      return {
        success: true,
        data: order,
      };
    } catch (error) {
      console.error('Error fetching order details:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Capture payment (if auto-capture is disabled)
   * @param {string} paymentId - Razorpay payment ID
   * @param {number} amount - Amount to capture in paise
   * @returns {Promise<Object>} Capture result
   */
  async capturePayment(paymentId, amount) {
    try {
      const payment = await razorpayInstance.payments.capture(paymentId, amount, {});
      return {
        success: true,
        data: payment,
      };
    } catch (error) {
      console.error('Error capturing payment:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Refund a payment
   * @param {string} paymentId - Razorpay payment ID
   * @param {Object} options - Refund options
   * @param {number} options.amount - Amount to refund in paise (optional, full refund if not specified)
   * @param {Object} options.notes - Refund notes
   * @returns {Promise<Object>} Refund details
   */
  async refundPayment(paymentId, options = {}) {
    try {
      const refundOptions = {};
      
      if (options.amount) {
        refundOptions.amount = Math.round(options.amount);
      }
      
      if (options.notes) {
        refundOptions.notes = options.notes;
      }

      const refund = await razorpayInstance.payments.refund(paymentId, refundOptions);
      return {
        success: true,
        data: refund,
      };
    } catch (error) {
      console.error('Error refunding payment:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Create recurring payment (subscription)
   * @param {Object} options - Subscription options
   * @param {number} options.planId - Razorpay plan ID
   * @param {string} options.customerId - Razorpay customer ID
   * @param {number} options.quantity - Quantity
   * @param {Object} options.notes - Additional notes
   * @returns {Promise<Object>} Subscription details
   */
  async createSubscription(options) {
    try {
      const subscriptionOptions = {
        plan_id: options.planId,
        customer_id: options.customerId,
        quantity: options.quantity || 1,
        notes: options.notes || {},
      };

      const subscription = await razorpayInstance.subscriptions.create(subscriptionOptions);
      return {
        success: true,
        data: subscription,
      };
    } catch (error) {
      console.error('Error creating subscription:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Validate webhook signature
   * @param {string} webhookBody - Raw webhook body
   * @param {string} webhookSecret - Webhook secret from Razorpay dashboard
   * @param {string} webhookSignature - Signature from webhook header
   * @returns {boolean} True if webhook is valid
   */
  validateWebhook(webhookBody, webhookSecret, webhookSignature) {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(webhookBody)
        .digest('hex');

      return expectedSignature === webhookSignature;
    } catch (error) {
      console.error('Error validating webhook:', error.message);
      return false;
    }
  }
}

export default new PaymentService();
