import asyncHandler from 'express-async-handler';
import DarshanBooking from '../models/DarshanBooking.js';
import CommunicationService from '../modules/communication/CommunicationService.js';

/**
 * Darshan Booking Controller - Handles all darshan booking operations
 */

// @desc    Get all darshan bookings with filters
// @route   GET /api/darshan-bookings
// @access  Private (Admin)
export const getDarshanBookings = asyncHandler(async (req, res) => {
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
      { bookingReference: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;
  const bookings = await DarshanBooking.find(filter)
    .sort({ date: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await DarshanBooking.countDocuments(filter);

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

// @desc    Get darshan booking statistics
// @route   GET /api/darshan-bookings/stats
// @access  Private (Admin)
export const getDarshanStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const filter = {};

  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }

  const stats = await DarshanBooking.aggregate([
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
        totalDevotees: { $sum: '$numberOfPeople' },
      },
    },
  ]);

  const statsByType = await DarshanBooking.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$darshanType',
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

// @desc    Get darshan booking by ID
// @route   GET /api/darshan-bookings/:bookingId
// @access  Private (Admin)
export const getDarshanBookingById = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;

  const booking = await DarshanBooking.findById(bookingId);

  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  res.json({
    success: true,
    data: booking,
  });
});

// @desc    Update darshan booking
// @route   PUT /api/darshan-bookings/:bookingId
// @access  Private (Admin)
export const updateDarshanBooking = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const { bookingStatus, internalNotes } = req.body;

  const booking = await DarshanBooking.findByIdAndUpdate(
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

// @desc    Send confirmation for darshan booking
// @route   POST /api/darshan-bookings/:bookingId/send-confirmation
// @access  Private (Admin)
export const sendDarshanConfirmation = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const { method = 'whatsapp' } = req.body;

  const booking = await DarshanBooking.findById(bookingId);

  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  let result;

  if (method === 'whatsapp') {
    result = await CommunicationService.sendBookingConfirmation({
      phoneNumber: booking.customerPhone,
      customerName: booking.customerName,
      bookingType: 'Darshan',
      bookingId: booking.bookingReference || booking._id,
      amount: booking.amount,
      date: booking.date.toLocaleDateString('en-IN'),
    });

    if (result.success) {
      await DarshanBooking.findByIdAndUpdate(
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

// @desc    Send reminder for darshan booking
// @route   POST /api/darshan-bookings/:bookingId/send-reminder
// @access  Private (Admin)
export const sendDarshanReminder = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;

  const booking = await DarshanBooking.findById(bookingId);

  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  const result = await CommunicationService.sendReminder({
    phoneNumber: booking.customerPhone,
    customerName: booking.customerName,
    eventType: `${booking.darshanType} Darshan`,
    eventDate: `${booking.date.toLocaleDateString('en-IN')} ${booking.timeSlot}`,
  });

  if (result.success) {
    await DarshanBooking.findByIdAndUpdate(
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

// @desc    Delete darshan booking
// @route   DELETE /api/darshan-bookings/:bookingId
// @access  Private (Admin)
export const deleteDarshanBooking = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;

  const booking = await DarshanBooking.findByIdAndDelete(bookingId);

  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  res.json({
    success: true,
    message: 'Booking deleted successfully',
  });
});
