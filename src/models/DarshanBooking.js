import mongoose from 'mongoose';

const darshanBookingSchema = new mongoose.Schema(
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

    // Darshan Details
    darshanType: {
      type: String,
      required: true, // e.g., 'Regular Darshan', 'Priority Darshan', 'VIP Darshan'
      enum: ['regular', 'priority', 'vip'],
    },
    date: {
      type: Date,
      required: true,
    },
    timeSlot: {
      type: String,
      required: true, // e.g., '06:00-07:00', '09:00-10:00'
    },
    numberOfPeople: {
      type: Number,
      default: 1,
      min: 1,
      max: 10,
    },

    // Booking Details
    bookingStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no-show'],
      default: 'pending',
    },
    bookingReference: {
      type: String,
      unique: true,
      sparse: true,
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

    // Additional Info
    specialRequests: {
      type: String,
      default: '',
    },
    internalNotes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Index for quick lookups
darshanBookingSchema.index({ customerPhone: 1 });
darshanBookingSchema.index({ date: 1 });
darshanBookingSchema.index({ bookingStatus: 1 });
darshanBookingSchema.index({ paymentStatus: 1 });
darshanBookingSchema.index({ createdAt: -1 });
darshanBookingSchema.index({ bookingReference: 1 });

// Pre-save hook to generate booking reference
darshanBookingSchema.pre('save', async function(next) {
  if (!this.bookingReference) {
    const count = await mongoose.model('DarshanBooking').countDocuments();
    this.bookingReference = `DS-${Date.now()}-${count + 1}`;
  }
  next();
});

const DarshanBooking = mongoose.models.DarshanBooking || mongoose.model('DarshanBooking', darshanBookingSchema);

export default DarshanBooking;
