import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    // Recipient Details
    recipientPhone: {
      type: String,
      required: true,
    },
    recipientName: {
      type: String,
      required: true,
    },
    recipientEmail: {
      type: String,
      sparse: true,
    },

    // Notification Details
    notificationType: {
      type: String,
      enum: ['booking_confirmation', 'payment_confirmation', 'reminder', 'cancellation', 'custom'],
      required: true,
    },
    channel: {
      type: String,
      enum: ['whatsapp', 'sms', 'email'],
      default: 'whatsapp',
    },
    message: {
      type: String,
      required: true,
    },

    // Status
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed', 'queued'],
      default: 'pending',
    },
    sentAt: {
      type: Date,
      sparse: true,
    },
    failureReason: {
      type: String,
      sparse: true,
    },

    // Reference
    referenceType: {
      type: String,
      enum: ['donation', 'pooja', 'darshan', 'payment', 'other'],
      required: true,
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    // Provider IDs
    providerMessageId: {
      type: String,
      sparse: true, // Razorpay/WhatsApp message ID
    },

    // Retry Info
    retryCount: {
      type: Number,
      default: 0,
    },
    maxRetries: {
      type: Number,
      default: 3,
    },
    nextRetryAt: {
      type: Date,
      sparse: true,
    },

    // Metadata
    metadata: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

// Index for quick lookups
notificationSchema.index({ status: 1 });
notificationSchema.index({ channel: 1 });
notificationSchema.index({ recipientPhone: 1 });
notificationSchema.index({ referenceId: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ nextRetryAt: 1 });

const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

export default Notification;
