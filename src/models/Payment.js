import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    // Razorpay IDs
    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
    },
    razorpayPaymentId: {
      type: String,
      sparse: true, // Can be null if payment not successful
    },
    razorpaySignature: {
      type: String,
      sparse: true,
    },

    // Payment Details
    amount: {
      type: Number,
      required: true, // in INR
    },
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },

    // Payment Type & Reference
    paymentType: {
      type: String,
      enum: ['donation', 'pooja', 'darshan'],
      required: true,
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      // Can reference Donation, PoojaBooking, or DarshanBooking
    },

    // Customer Details
    customerName: {
      type: String,
      required: true,
    },
    customerEmail: {
      type: String,
      default: '',
    },
    customerPhone: {
      type: String,
      default: '',
    },

    // Refund Details
    refundId: {
      type: String,
      sparse: true,
    },
    refundAmount: {
      type: Number,
      sparse: true,
    },
    refundStatus: {
      type: String,
      enum: ['none', 'partial', 'full'],
      default: 'none',
    },

    // Additional Info
    notes: {
      type: String,
      default: '',
    },
    metadata: {
      type: Object,
      default: {},
    },

    // Timestamps
    paidAt: {
      type: Date,
      sparse: true,
    },
  },
  { timestamps: true }
);

// Indexes for quick lookups
paymentSchema.index({ razorpayOrderId: 1 }, { unique: true });          // Idempotency — one Payment per Razorpay order
paymentSchema.index({ razorpayPaymentId: 1 }, { sparse: true });         // Fast webhook lookup by payment ID
paymentSchema.index({ customerPhone: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ paymentType: 1 });
paymentSchema.index({ createdAt: -1 });

const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);

export default Payment;
