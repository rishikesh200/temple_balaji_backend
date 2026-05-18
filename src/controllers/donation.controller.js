import asyncHandler from 'express-async-handler';
import Donation from '../models/Donation.js';
import Payment from '../models/Payment.js';
import CommunicationService from '../modules/communication/CommunicationService.js';

/**
 * Donation Controller - Handles all donation-related operations
 */

// @desc    Get all donations with filters
// @route   GET /api/donations
// @access  Private (Admin)
export const getDonations = asyncHandler(async (req, res) => {
  const { status, cause, startDate, endDate, page = 1, limit = 10, search } = req.query;

  const filter = {};

  if (status) filter.paymentStatus = status;
  if (cause) filter.cause = cause;

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  if (search) {
    filter.$or = [
      { donorName: { $regex: search, $options: 'i' } },
      { donorEmail: { $regex: search, $options: 'i' } },
      { donorPhone: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;
  const donations = await Donation.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Donation.countDocuments(filter);

  res.json({
    success: true,
    data: donations,
    pagination: {
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      limit: parseInt(limit),
    },
  });
});

// @desc    Get donation statistics
// @route   GET /api/donations/stats
// @access  Private (Admin)
export const getDonationStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const filter = {};

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const stats = await Donation.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalDonations: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        completedDonations: {
          $sum: { $cond: [{ $eq: ['$paymentStatus', 'completed'] }, 1, 0] },
        },
        completedAmount: {
          $sum: {
            $cond: [{ $eq: ['$paymentStatus', 'completed'] }, '$amount', 0],
          },
        },
      },
    },
  ]);

  const statsByCause = await Donation.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$cause',
        count: { $sum: 1 },
        amount: { $sum: '$amount' },
      },
    },
  ]);

  res.json({
    success: true,
    data: {
      overall: stats[0] || {
        totalDonations: 0,
        totalAmount: 0,
        completedDonations: 0,
        completedAmount: 0,
      },
      byCause: statsByCause,
    },
  });
});

// @desc    Get donation by ID
// @route   GET /api/donations/:donationId
// @access  Private (Admin)
export const getDonationById = asyncHandler(async (req, res) => {
  const { donationId } = req.params;

  const donation = await Donation.findById(donationId);

  if (!donation) {
    return res.status(404).json({ success: false, message: 'Donation not found' });
  }

  res.json({
    success: true,
    data: donation,
  });
});

// @desc    Update donation
// @route   PUT /api/donations/:donationId
// @access  Private (Admin)
export const updateDonation = asyncHandler(async (req, res) => {
  const { donationId } = req.params;
  const { taxCertificateRequested, internalNotes } = req.body;

  const donation = await Donation.findByIdAndUpdate(
    donationId,
    {
      taxCertificateRequested,
      internalNotes,
    },
    { new: true }
  );

  if (!donation) {
    return res.status(404).json({ success: false, message: 'Donation not found' });
  }

  res.json({
    success: true,
    data: donation,
  });
});

// @desc    Send acknowledgment for donation
// @route   POST /api/donations/:donationId/send-acknowledgment
// @access  Private (Admin)
export const sendDonationAcknowledgment = asyncHandler(async (req, res) => {
  const { donationId } = req.params;
  const { method = 'whatsapp' } = req.body;

  const donation = await Donation.findById(donationId);

  if (!donation) {
    return res.status(404).json({ success: false, message: 'Donation not found' });
  }

  let result;

  if (method === 'whatsapp') {
    result = await CommunicationService.sendWhatsAppMessage(
      donation.donorPhone,
      `🙏 Thank you for your generous donation of ₹${donation.amount}!

Your contribution will help us serve the community better.

Donation ID: ${donation._id}

May the blessings be with you.

🕉️ *Hari Om Tat Sat*`
    );

    if (result.success) {
      await Donation.findByIdAndUpdate(
        donationId,
        { whatsappNotificationSent: true }
      );
    }
  }

  if (result.success) {
    res.json({
      success: true,
      message: `Acknowledgment sent via ${method}`,
    });
  } else {
    res.status(400).json({
      success: false,
      message: `Failed to send acknowledgment via ${method}`,
      error: result.error,
    });
  }
});

// @desc    Delete donation
// @route   DELETE /api/donations/:donationId
// @access  Private (Admin)
export const deleteDonation = asyncHandler(async (req, res) => {
  const { donationId } = req.params;

  const donation = await Donation.findByIdAndDelete(donationId);

  if (!donation) {
    return res.status(404).json({ success: false, message: 'Donation not found' });
  }

  res.json({
    success: true,
    message: 'Donation deleted successfully',
  });
});
