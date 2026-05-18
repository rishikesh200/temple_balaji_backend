import asyncHandler from 'express-async-handler';
import PaymentService from '../modules/payment/PaymentService.js';
import CommunicationService from '../modules/communication/CommunicationService.js';
import Payment from '../models/Payment.js';
import Donation from '../models/Donation.js';
import PoojaBooking from '../models/PoojaBooking.js';
import DarshanBooking from '../models/DarshanBooking.js';
import Notification from '../models/Notification.js';

/**
 * Payment Controller - Handles all payment-related operations
 * Using modular PaymentService for Razorpay integration
 */

// @desc    Create Razorpay order for donation
// @route   POST /api/payments/create-donation-order
// @access  Public
export const createDonationOrder = asyncHandler(async (req, res) => {
  const { donorName, donorEmail, donorPhone, amount, cause = 'general', message = '' } = req.body;

  if (!amount || amount < 1) {
    return res.status(400).json({ success: false, message: 'Invalid amount' });
  }

  if (!donorPhone || donorPhone.length < 10) {
    return res.status(400).json({ success: false, message: 'Invalid phone number' });
  }

  // Create donation record
  const donation = await Donation.create({
    donorName,
    donorEmail,
    donorPhone,
    amount,
    cause,
    message,
    paymentStatus: 'pending',
  });

  // Create Razorpay order
  const orderResult = await PaymentService.createOrder({
    amount: amount * 100, // Convert to paise
    receipt: `DONATION-${donation._id}`,
    notes: {
      donationId: donation._id.toString(),
      donorName,
      donorEmail,
      donorPhone,
      cause,
    },
  });

  if (!orderResult.success) {
    return res.status(400).json({
      success: false,
      message: orderResult.error || 'Unable to create Razorpay order',
    });
  }

  res.status(201).json({
    success: true,
    data: {
      orderId: orderResult.data.id,
      amount: orderResult.data.amount,
      currency: orderResult.data.currency,
      donationId: donation._id,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    },
  });
});

// @desc    Create Razorpay order for pooja booking
// @route   POST /api/payments/create-pooja-order
// @access  Public
export const createPoojaOrder = asyncHandler(async (req, res) => {
  const {
    customerName,
    customerEmail,
    customerPhone,
    poojaType,
    date,
    time,
    amount,
    numberOfPriests = 1,
    location = 'temple',
  } = req.body;

  if (!amount || amount < 1) {
    return res.status(400).json({ success: false, message: 'Invalid amount' });
  }

  // Create pooja booking
  const poojaBooking = await PoojaBooking.create({
    customerName,
    customerEmail,
    customerPhone,
    poojaType,
    date,
    time,
    amount,
    numberOfPriests,
    location,
    bookingStatus: 'pending',
    paymentStatus: 'pending',
  });

  // Create Razorpay order
  const orderResult = await PaymentService.createOrder({
    amount: amount * 100,
    receipt: `POOJA-${poojaBooking._id}`,
    notes: {
      bookingId: poojaBooking._id.toString(),
      poojaType,
      customerPhone,
      date,
    },
  });

  if (!orderResult.success) {
    return res.status(400).json(orderResult);
  }

  res.status(201).json({
    success: true,
    data: {
      orderId: orderResult.data.id,
      amount: orderResult.data.amount,
      currency: orderResult.data.currency,
      bookingId: poojaBooking._id,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    },
  });
});

// @desc    Create Razorpay order for darshan booking
// @route   POST /api/payments/create-darshan-order
// @access  Public
export const createDarshanOrder = asyncHandler(async (req, res) => {
  const {
    customerName,
    customerEmail,
    customerPhone,
    darshanType,
    date,
    timeSlot,
    numberOfPeople = 1,
    amount,
  } = req.body;

  if (!amount || amount < 1) {
    return res.status(400).json({ success: false, message: 'Invalid amount' });
  }

  // Create darshan booking
  const darshanBooking = await DarshanBooking.create({
    customerName,
    customerEmail,
    customerPhone,
    darshanType,
    date,
    timeSlot,
    numberOfPeople,
    amount,
    bookingStatus: 'pending',
    paymentStatus: 'pending',
  });

  // Create Razorpay order
  const orderResult = await PaymentService.createOrder({
    amount: amount * 100,
    receipt: `DARSHAN-${darshanBooking._id}`,
    notes: {
      bookingId: darshanBooking._id.toString(),
      darshanType,
      customerPhone,
      date,
    },
  });

  if (!orderResult.success) {
    return res.status(400).json(orderResult);
  }

  res.status(201).json({
    success: true,
    data: {
      orderId: orderResult.data.id,
      amount: orderResult.data.amount,
      currency: orderResult.data.currency,
      bookingId: darshanBooking._id,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    },
  });
});

// @desc    Verify payment and update records
// @route   POST /api/payments/verify
// @access  Public
export const verifyPayment = asyncHandler(async (req, res) => {
  const { orderId, paymentId, signature, paymentType } = req.body;

  // Verify signature
  const isValid = PaymentService.verifyPaymentSignature({
    orderId,
    paymentId,
    signature,
  });

  if (!isValid) {
    return res.status(400).json({ success: false, message: 'Invalid payment signature' });
  }

  // Fetch payment details from Razorpay
  const paymentDetails = await PaymentService.getPaymentDetails(paymentId);

  if (!paymentDetails.success) {
    return res.status(400).json({ success: false, message: 'Failed to verify payment' });
  }

  // Fetch order details from Razorpay so we can resolve booking/donation reference
  const orderDetails = await PaymentService.getOrderDetails(orderId);

  if (!orderDetails.success) {
    return res.status(400).json({ success: false, message: 'Failed to fetch order details' });
  }

  const notes = orderDetails.data.notes || {};
  const referenceId = notes.donationId || notes.bookingId;
  const customerName = notes.donorName || notes.customerName || '';
  const customerEmail = notes.donorEmail || notes.customerEmail || '';
  const customerPhone = notes.donorPhone || notes.customerPhone || '';

  if (!referenceId) {
    return res.status(400).json({ success: false, message: 'Missing payment reference information' });
  }

  // Create or update payment record
  const payment = await Payment.findOneAndUpdate(
    { razorpayOrderId: orderId },
    {
      razorpayPaymentId: paymentId,
      razorpaySignature: signature,
      status: 'completed',
      paidAt: new Date(),
      amount: Math.ceil(paymentDetails.data.amount / 100),
      paymentType,
      referenceId,
      customerName,
      customerEmail,
      customerPhone,
      notes: JSON.stringify(notes),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Update booking status based on payment type
  if (paymentType === 'donation') {
    const donation = await Donation.findByIdAndUpdate(
      referenceId,
      { paymentStatus: 'completed', paymentId: payment._id },
      { new: true }
    );

    // Send WhatsApp notification
    await CommunicationService.sendPaymentConfirmation({
      phoneNumber: donation.donorPhone,
      customerName: donation.donorName,
      amount: donation.amount,
      orderId: orderId,
      transactionId: paymentId,
    });

    await Donation.findByIdAndUpdate(
      donation._id,
      { whatsappNotificationSent: true }
    );
  } else if (paymentType === 'pooja') {
    const booking = await PoojaBooking.findByIdAndUpdate(
      referenceId,
      {
        paymentStatus: 'completed',
        bookingStatus: 'confirmed',
        paymentId: payment._id,
      },
      { new: true }
    );

    // Send WhatsApp notification
    await CommunicationService.sendBookingConfirmation({
      phoneNumber: booking.customerPhone,
      customerName: booking.customerName,
      bookingType: 'Pooja',
      bookingId: booking._id,
      amount: booking.amount,
      date: booking.date.toLocaleDateString('en-IN'),
    });

    await PoojaBooking.findByIdAndUpdate(
      booking._id,
      { whatsappNotificationSent: true }
    );
  } else if (paymentType === 'darshan') {
    const booking = await DarshanBooking.findByIdAndUpdate(
      referenceId,
      {
        paymentStatus: 'completed',
        bookingStatus: 'confirmed',
        paymentId: payment._id,
      },
      { new: true }
    );

    // Send WhatsApp notification
    await CommunicationService.sendBookingConfirmation({
      phoneNumber: booking.customerPhone,
      customerName: booking.customerName,
      bookingType: 'Darshan',
      bookingId: booking._id,
      amount: booking.amount,
      date: booking.date.toLocaleDateString('en-IN'),
    });

    await DarshanBooking.findByIdAndUpdate(
      booking._id,
      { whatsappNotificationSent: true }
    );
  }

  res.json({
    success: true,
    message: 'Payment verified successfully',
    data: payment,
  });
});

// @desc    Razorpay webhook handler
// @route   POST /api/payments/webhook
// @access  Public
export const handleWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const body = req.rawBody; // Store raw body in express middleware

  const isValid = PaymentService.validateWebhook(
    body,
    process.env.RAZORPAY_WEBHOOK_SECRET,
    signature
  );

  if (!isValid) {
    return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
  }

  const event = req.body;

  // Handle different webhook events
  if (event.event === 'payment.authorized' || event.event === 'payment.captured') {
    // Payment successful
    const { payment } = event;
    // Already handled in verify payment
  } else if (event.event === 'payment.failed') {
    // Payment failed
    const { payment } = event;
    await Payment.findOneAndUpdate(
      { razorpayPaymentId: payment.id },
      { status: 'failed' }
    );
  } else if (event.event === 'refund.created') {
    // Refund created
    const { refund } = event;
    await Payment.findOneAndUpdate(
      { razorpayPaymentId: refund.payment_id },
      {
        refundId: refund.id,
        refundAmount: Math.ceil(refund.amount / 100),
        refundStatus: 'full',
        status: 'refunded',
      }
    );
  }

  res.json({ success: true, message: 'Webhook processed' });
});

// @desc    Refund a payment
// @route   POST /api/payments/:paymentId/refund
// @access  Private (Admin)
export const refundPayment = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;
  const { amount, reason } = req.body;

  const payment = await Payment.findById(paymentId);

  if (!payment || !payment.razorpayPaymentId) {
    return res.status(404).json({ success: false, message: 'Payment not found' });
  }

  const refundResult = await PaymentService.refundPayment(payment.razorpayPaymentId, {
    amount: amount ? amount * 100 : undefined,
    notes: { reason },
  });

  if (!refundResult.success) {
    return res.status(400).json(refundResult);
  }

  // Update payment record
  const updatedPayment = await Payment.findByIdAndUpdate(
    paymentId,
    {
      refundId: refundResult.data.id,
      refundAmount: Math.ceil(refundResult.data.amount / 100),
      refundStatus: refundResult.data.amount === payment.amount * 100 ? 'full' : 'partial',
      status: 'refunded',
    },
    { new: true }
  );

  res.json({
    success: true,
    message: 'Refund processed successfully',
    data: updatedPayment,
  });
});

// @desc    Get payment details
// @route   GET /api/payments/:paymentId
// @access  Private (Admin)
export const getPaymentDetails = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;

  const payment = await Payment.findById(paymentId);

  if (!payment) {
    return res.status(404).json({ success: false, message: 'Payment not found' });
  }

  res.json({
    success: true,
    data: payment,
  });
});

// @desc    Get all payments with filters
// @route   GET /api/payments
// @access  Private (Admin)
export const getPayments = asyncHandler(async (req, res) => {
  const { status, paymentType, startDate, endDate, page = 1, limit = 10 } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (paymentType) filter.paymentType = paymentType;

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const skip = (page - 1) * limit;
  const payments = await Payment.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Payment.countDocuments(filter);

  res.json({
    success: true,
    data: payments,
    pagination: {
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      limit: parseInt(limit),
    },
  });
});
