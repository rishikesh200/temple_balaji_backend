import mongoose from 'mongoose';

const poojaBookingSchema = new mongoose.Schema(
  {
    // Customer Details
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerEmail: {
      type: String,
      required: true,
      lowercase: true,
    },
    customerPhone: {
      type: String,
      required: true,
    },
    customerAddress: {
      type: String,
      default: '',
    },

    // Pooja Details
    poojaType: {
      type: String,
      required: true, // e.g., 'Rudra Abhishek', 'Satyanarayan Puja', etc.
    },
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String,
      required: true, // HH:MM format
    },
    numberOfPriests: {
      type: Number,
      default: 1,
    },
    specialRequests: {
      type: String,
      default: '',
    },
    numberOfDevotees: {
      type: Number,
      default: 1,
    },

    // Booking Details
    location: {
      type: String,
      enum: ['temple', 'home'],
      default: 'temple',
    },
    bookingStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
    },

    // Payment Reference
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      sparse: true,
    },
    amount: {
      type: Number,
      required: true, // in INR
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },

    // Notifications
    confirmationSent: {
      type: Boolean,
      default: false,
    },
    reminderSent: {
      type: Boolean,
      default: false,
    },
    whatsappNotificationSent: {
      type: Boolean,
      default: false,
    },
    completionNotificationSent: {
      type: Boolean,
      default: false,
    },

    // Admin Notes
    internalNotes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Index for quick lookups
poojaBookingSchema.index({ customerPhone: 1 });
poojaBookingSchema.index({ date: 1 });
poojaBookingSchema.index({ bookingStatus: 1 });
poojaBookingSchema.index({ paymentStatus: 1 });
poojaBookingSchema.index({ createdAt: -1 });

const PoojaBooking = mongoose.models.PoojaBooking || mongoose.model('PoojaBooking', poojaBookingSchema);

export default PoojaBooking;
