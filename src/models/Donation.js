import mongoose from 'mongoose';

const donationSchema = new mongoose.Schema(
  {
    // Donor Details
    donorName: {
      type: String,
      required: true,
      trim: true,
    },
    donorEmail: {
      type: String,
      required: true,
      lowercase: true,
    },
    donorPhone: {
      type: String,
      required: true,
    },

    // Donation Details
    amount: {
      type: Number,
      required: true, // in INR
    },
    currency: {
      type: String,
      default: 'INR',
    },
    cause: {
      type: String,
      trim: true,
      default: 'general',
    },
    message: {
      type: String,
      default: '',
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },

    // Payment Reference
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      sparse: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },

    // Acknowledgment
    acknowledgmentSent: {
      type: Boolean,
      default: false,
    },
    whatsappNotificationSent: {
      type: Boolean,
      default: false,
    },
    receiptGenerated: {
      type: Boolean,
      default: false,
    },

    // Tax Certificate
    taxCertificateRequested: {
      type: Boolean,
      default: false,
    },
    taxCertificateGenerated: {
      type: Boolean,
      default: false,
    },
    panNumber: {
      type: String,
      sparse: true,
    },
  },
  { timestamps: true }
);

// Index for quick lookups
donationSchema.index({ donorPhone: 1 });
donationSchema.index({ paymentStatus: 1 });
donationSchema.index({ createdAt: -1 });

const Donation = mongoose.models.Donation || mongoose.model('Donation', donationSchema);

export default Donation;
