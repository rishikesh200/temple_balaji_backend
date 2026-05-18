import asyncHandler from 'express-async-handler';
import PoojaBooking from '../models/PoojaBooking.js';
import CommunicationService from '../modules/communication/CommunicationService.js';

/**
 * Pooja Booking Controller - Handles all pooja booking operations
 */

// @desc    Get all pooja bookings with filters
// @route   GET /api/pooja-bookings
// @access  Private (Admin)
export const getPoojaBookings = asyncHandler(async (req, res) => {
  const {
    status,
    paymentStatus,
    startDate,
    endDate,
    page = 1,
    limit = 10,
    search,
  } = req.query;

  const filter = {};

  if (status) filter.bookingStatus = status;
  if (paymentStatus) filter.paymentStatus = paymentStatus;

  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }

  if (search) {
    filter.$or = [
      { customerName: { $regex: search, $options: 'i' } },
      { customerEmail: { $regex: search, $options: 'i' } },
      { customerPhone: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;
  const bookings = await PoojaBooking.find(filter)
    .sort({ date: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await PoojaBooking.countDocuments(filter);

  res.json({
    success: true,
    data: bookings,
    pagination: {
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      limit: parseInt(limit),
    },
  });
});

// @desc    Get pooja booking statistics
// @route   GET /api/pooja-bookings/stats
// @access  Private (Admin)
export const getPoojaStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const filter = {};

  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }

  const stats = await PoojaBooking.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalBookings: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        confirmedBookings: {
          $sum: { $cond: [{ $eq: ['$bookingStatus', 'confirmed'] }, 1, 0] },
        },
        completedBookings: {
          $sum: { $cond: [{ $eq: ['$bookingStatus', 'completed'] }, 1, 0] },
        },
        totalDevotees: { $sum: '$numberOfDevotees' },
      },
    },
  ]);

  const statsByType = await PoojaBooking.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$poojaType',
        count: { $sum: 1 },
        amount: { $sum: '$amount' },
      },
    },
  ]);

  res.json({
    success: true,
    data: {
      overall: stats[0] || {
        totalBookings: 0,
        totalAmount: 0,
        confirmedBookings: 0,
        completedBookings: 0,
        totalDevotees: 0,
      },
      byType: statsByType,
    },
  });
});

// @desc    Get pooja booking by ID
// @route   GET /api/pooja-bookings/:bookingId
// @access  Private (Admin)
export const getPoojaBookingById = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;

  const booking = await PoojaBooking.findById(bookingId);

  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  res.json({
    success: true,
    data: booking,
  });
});

// @desc    Update pooja booking
// @route   PUT /api/pooja-bookings/:bookingId
// @access  Private (Admin)
export const updatePoojaBooking = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const { bookingStatus, internalNotes } = req.body;

  const booking = await PoojaBooking.findByIdAndUpdate(
    bookingId,
    {
      bookingStatus,
      internalNotes,
    },
    { new: true }
  );

  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  res.json({
    success: true,
    data: booking,
  });
});

// @desc    Send confirmation for pooja booking
// @route   POST /api/pooja-bookings/:bookingId/send-confirmation
// @access  Private (Admin)
export const sendPoojaConfirmation = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const { method = 'whatsapp' } = req.body;

  const booking = await PoojaBooking.findById(bookingId);

  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  let result;

  if (method === 'whatsapp') {
    result = await CommunicationService.sendBookingConfirmation({
      phoneNumber: booking.customerPhone,
      customerName: booking.customerName,
      bookingType: 'Pooja',
      bookingId: booking._id,
      amount: booking.amount,
      date: booking.date.toLocaleDateString('en-IN'),
    });

    if (result.success) {
      await PoojaBooking.findByIdAndUpdate(
        bookingId,
        { confirmationSent: true, whatsappNotificationSent: true }
      );
    }
  }

  if (result.success) {
    res.json({
      success: true,
      message: `Confirmation sent via ${method}`,
    });
  } else {
    res.status(400).json({
      success: false,
      message: `Failed to send confirmation via ${method}`,
      error: result.error,
    });
  }
});

// @desc    Send reminder for pooja booking
// @route   POST /api/pooja-bookings/:bookingId/send-reminder
// @access  Private (Admin)
export const sendPoojaReminder = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;

  const booking = await PoojaBooking.findById(bookingId);

  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  const result = await CommunicationService.sendReminder({
    phoneNumber: booking.customerPhone,
    customerName: booking.customerName,
    eventType: booking.poojaType,
    eventDate: `${booking.date.toLocaleDateString('en-IN')} at ${booking.time}`,
  });

  if (result.success) {
    await PoojaBooking.findByIdAndUpdate(
      bookingId,
      { reminderSent: true }
    );

    res.json({
      success: true,
      message: 'Reminder sent successfully',
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'Failed to send reminder',
      error: result.error,
    });
  }
});

// @desc    Delete pooja booking
// @route   DELETE /api/pooja-bookings/:bookingId
// @access  Private (Admin)
export const deletePoojaBooking = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;

  const booking = await PoojaBooking.findByIdAndDelete(bookingId);

  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  res.json({
    success: true,
    message: 'Booking deleted successfully',
  });
});
