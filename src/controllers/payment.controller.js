import asyncHandler from 'express-async-handler';
import PaymentService from '../modules/payment/PaymentService.js';
import CommunicationService from '../modules/communication/CommunicationService.js';
import Payment from '../models/Payment.js';
import Donation from '../models/Donation.js';
import PoojaBooking from '../models/PoojaBooking.js';
import DarshanBooking from '../models/DarshanBooking.js';

/**
 * Payment Controller — Production-Grade Implementation
 *
 * Key design guarantees:
 *  1. HMAC signature is ALWAYS verified before any DB write.
 *  2. processPaymentSuccess() is idempotent — safe to call from both
 *     frontend /verify and Razorpay webhooks without creating duplicates.
 *  3. WhatsApp / notification delivery is fully non-blocking:
 *     the HTTP response is sent before the notification attempt starts.
 *     Failures are logged but never surface to the customer.
 *     Structure is BullMQ/Redis-queue-ready (replace the Promise chain with
 *     a queue.add() call when you are ready to add a job queue).
 *  4. Webhook events handle the "tab-closed" recovery case automatically.
 */

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolve the local booking/donation record from a Razorpay order ID.
 * Returns { record, paymentType, resolvedName, resolvedEmail, resolvedPhone, resolvedAmount }
 * or throws with a descriptive message if nothing is found.
 *
 * Priority order: first checks the supplied paymentType hint (fast path),
 * then falls back to searching all three collections (webhook recovery path
 * when paymentType is not known).
 */
async function resolveRecordByOrderId(razorpayOrderId, paymentTypeHint) {
  const hint = paymentTypeHint?.toLowerCase();

  // ── Fast path — we know the type ──────────────────────────────────────────
  if (hint === 'donation') {
    const record = await Donation.findOne({ razorpayOrderId });
    if (record) return { record, paymentType: 'donation' };
  }
  if (hint === 'pooja') {
    const record = await PoojaBooking.findOne({ razorpayOrderId });
    if (record) return { record, paymentType: 'pooja' };
  }
  if (hint === 'darshan') {
    const record = await DarshanBooking.findOne({ razorpayOrderId });
    if (record) return { record, paymentType: 'darshan' };
  }

  // ── Fallback — search all three (webhook recovery, no paymentType hint) ───
  const [donation, poojaBooking, darshanBooking] = await Promise.all([
    Donation.findOne({ razorpayOrderId }),
    PoojaBooking.findOne({ razorpayOrderId }),
    DarshanBooking.findOne({ razorpayOrderId }),
  ]);

  if (donation)     return { record: donation,       paymentType: 'donation' };
  if (poojaBooking) return { record: poojaBooking,   paymentType: 'pooja' };
  if (darshanBooking) return { record: darshanBooking, paymentType: 'darshan' };

  return null;
}

/**
 * Dispatch a WhatsApp notification in the background.
 * - Never blocks the caller (fire-and-forget).
 * - Logs [WHATSAPP][SUCCESS] / [WHATSAPP][ERROR] for monitoring.
 * - Ready to be swapped for BullMQ queue.add() with no other changes.
 */
function dispatchNotification(type, payload) {
  // ── TODO: Replace this block with queue.add(type, payload) when ready ─────
  const sendFn =
    type === 'payment'
      ? CommunicationService.sendPaymentConfirmation.bind(CommunicationService)
      : CommunicationService.sendBookingConfirmation.bind(CommunicationService);

  sendFn(payload)
    .then(() => {
      console.log(`[WHATSAPP][SUCCESS] type=${type} phone=${payload.phoneNumber}`);
      // Mark the record as notified
      if (payload._modelRef && payload._docId) {
        payload._modelRef
          .findByIdAndUpdate(payload._docId, { whatsappNotificationSent: true })
          .catch((err) =>
            console.error('[WHATSAPP][FLAG_ERR]', err.message)
          );
      }
    })
    .catch((err) => {
      console.error(`[WHATSAPP][ERROR] type=${type} phone=${payload.phoneNumber} err=${err.message}`);
    });
}

/**
 * Core idempotent payment-success processor.
 *
 * Called from BOTH verifyPayment (frontend) and handleWebhook (Razorpay server).
 * Guarantees:
 *   • Only one Payment document per razorpayOrderId (unique index + upsert guard).
 *   • Booking / donation status updated at most once (checks before writing).
 *   • WhatsApp notification sent at most once (whatsappNotificationSent flag).
 *   • Returns the final Payment document whether it was just created or already existed.
 *
 * @param {object} opts
 * @param {string} opts.razorpayOrderId
 * @param {string} opts.razorpayPaymentId
 * @param {string} opts.razorpaySignature   — may be empty string when called from webhook
 * @param {string} opts.paymentTypeHint     — 'donation' | 'pooja' | 'darshan' | undefined
 * @returns {Payment}
 */
async function processPaymentSuccess({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature = '',
  paymentTypeHint,
}) {
  // ── 1. Idempotency guard: already completed? Return existing record ────────
  const existing = await Payment.findOne({ razorpayOrderId, status: 'completed' });
  if (existing) {
    console.log(`[PAYMENT][IDEMPOTENT] orderId=${razorpayOrderId} already processed`);
    return existing;
  }

  // ── 2. Resolve booking / donation ─────────────────────────────────────────
  const resolved = await resolveRecordByOrderId(razorpayOrderId, paymentTypeHint);
  if (!resolved) {
    const err = new Error(`No booking found for razorpayOrderId: ${razorpayOrderId}`);
    err.statusCode = 404;
    throw err;
  }
  const { record, paymentType } = resolved;

  // ── 3. Derive customer details from local record (no Razorpay API call) ───
  const customerName  = record.donorName  || record.customerName  || '';
  const customerEmail = record.donorEmail || record.customerEmail || '';
  const customerPhone = record.donorPhone || record.customerPhone || '';
  const amount        = record.amount     || 0;
  const referenceId   = record._id;

  // ── 4. Upsert Payment document ─────────────────────────────────────────────
  // findOneAndUpdate with upsert=true is atomic on the razorpayOrderId unique index.
  // A concurrent duplicate call will hit the unique constraint and return the
  // existing document rather than inserting a second one.
  const payment = await Payment.findOneAndUpdate(
    { razorpayOrderId },
    {
      $setOnInsert: {
        razorpayOrderId,
        paymentType,
        referenceId,
        customerName,
        customerEmail,
        customerPhone,
        amount,
      },
      $set: {
        razorpayPaymentId,
        razorpaySignature,
        status: 'completed',
        paidAt: new Date(),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // ── 5. Update booking / donation status (idempotent — check before write) ─
  if (paymentType === 'donation') {
    if (record.paymentStatus !== 'completed') {
      await Donation.findByIdAndUpdate(referenceId, {
        paymentStatus: 'completed',
        paymentId: payment._id,
      });
    }

    if (!record.whatsappNotificationSent) {
      dispatchNotification('payment', {
        phoneNumber:   customerPhone,
        customerName,
        amount,
        orderId:       razorpayOrderId,
        transactionId: razorpayPaymentId,
        _modelRef:     Donation,
        _docId:        referenceId,
      });
    }

  } else if (paymentType === 'pooja') {
    if (record.paymentStatus !== 'completed') {
      await PoojaBooking.findByIdAndUpdate(referenceId, {
        paymentStatus: 'completed',
        bookingStatus: 'confirmed',
        paymentId: payment._id,
      });
    }

    if (!record.whatsappNotificationSent) {
      dispatchNotification('booking', {
        phoneNumber:  customerPhone,
        customerName,
        bookingType:  'Pooja',
        bookingId:    referenceId,
        amount,
        date:         record.date ? new Date(record.date).toLocaleDateString('en-IN') : '—',
        _modelRef:    PoojaBooking,
        _docId:       referenceId,
      });
    }

  } else if (paymentType === 'darshan') {
    if (record.paymentStatus !== 'completed') {
      await DarshanBooking.findByIdAndUpdate(referenceId, {
        paymentStatus: 'completed',
        bookingStatus: 'confirmed',
        paymentId: payment._id,
      });
    }

    if (!record.whatsappNotificationSent) {
      dispatchNotification('booking', {
        phoneNumber:  customerPhone,
        customerName,
        bookingType:  'Darshan',
        bookingId:    referenceId,
        amount,
        date:         record.date ? new Date(record.date).toLocaleDateString('en-IN') : '—',
        _modelRef:    DarshanBooking,
        _docId:       referenceId,
      });
    }
  }

  console.log(`[PAYMENT][SUCCESS] type=${paymentType} orderId=${razorpayOrderId} paymentId=${razorpayPaymentId}`);
  return payment;
}

// ─────────────────────────────────────────────────────────────────────────────
// ORDER CREATION ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// @desc    Create Razorpay order for donation
// @route   POST /api/payments/create-donation-order
// @access  Public
export const createDonationOrder = asyncHandler(async (req, res) => {
  const { donorName, donorEmail, donorPhone, amount, cause = 'general', message = '' } = req.body;

  if (!amount || amount < 1) {
    return res.status(400).json({ success: false, message: 'Invalid amount' });
  }
  if (!donorPhone || donorPhone.trim().length < 10) {
    return res.status(400).json({ success: false, message: 'Invalid phone number' });
  }
  if (!donorName?.trim()) {
    return res.status(400).json({ success: false, message: 'Donor name is required' });
  }
  if (!donorEmail?.trim()) {
    return res.status(400).json({ success: false, message: 'Donor email is required' });
  }

  const donation = await Donation.create({
    donorName,
    donorEmail,
    donorPhone,
    amount,
    cause,
    message,
    paymentStatus: 'pending',
  });

  const orderResult = await PaymentService.createOrder({
    amount: amount * 100, // paise
    receipt: `DON-${donation._id}`,
    notes: {
      donationId: donation._id.toString(),
      donorName,
      donorEmail,
      donorPhone,
      cause,
    },
  });

  if (!orderResult.success) {
    // Clean up the pending record so the user can try again cleanly
    await Donation.findByIdAndDelete(donation._id);
    return res.status(400).json({ success: false, message: orderResult.error || 'Unable to create Razorpay order' });
  }

  // Save razorpayOrderId immediately so we can look it up during verification
  donation.razorpayOrderId = orderResult.data.id;
  await donation.save();

  console.log(`[ORDER][CREATED] type=donation donationId=${donation._id} orderId=${orderResult.data.id}`);

  return res.status(201).json({
    success: true,
    data: {
      orderId:       orderResult.data.id,
      amount:        orderResult.data.amount,
      currency:      orderResult.data.currency,
      donationId:    donation._id,
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
  if (!customerName?.trim()) {
    return res.status(400).json({ success: false, message: 'Customer name is required' });
  }

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
    await PoojaBooking.findByIdAndDelete(poojaBooking._id);
    return res.status(400).json({ success: false, message: orderResult.error || 'Unable to create Razorpay order' });
  }

  poojaBooking.razorpayOrderId = orderResult.data.id;
  await poojaBooking.save();

  console.log(`[ORDER][CREATED] type=pooja bookingId=${poojaBooking._id} orderId=${orderResult.data.id}`);

  return res.status(201).json({
    success: true,
    data: {
      orderId:       orderResult.data.id,
      amount:        orderResult.data.amount,
      currency:      orderResult.data.currency,
      bookingId:     poojaBooking._id,
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
  if (!customerName?.trim()) {
    return res.status(400).json({ success: false, message: 'Customer name is required' });
  }

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
    await DarshanBooking.findByIdAndDelete(darshanBooking._id);
    return res.status(400).json({ success: false, message: orderResult.error || 'Unable to create Razorpay order' });
  }

  darshanBooking.razorpayOrderId = orderResult.data.id;
  await darshanBooking.save();

  console.log(`[ORDER][CREATED] type=darshan bookingId=${darshanBooking._id} orderId=${orderResult.data.id}`);

  return res.status(201).json({
    success: true,
    data: {
      orderId:       orderResult.data.id,
      amount:        orderResult.data.amount,
      currency:      orderResult.data.currency,
      bookingId:     darshanBooking._id,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENT VERIFICATION  (frontend callback after checkout closes)
// ─────────────────────────────────────────────────────────────────────────────

// @desc    Verify payment signature and confirm booking
// @route   POST /api/payments/verify
// @access  Public
export const verifyPayment = asyncHandler(async (req, res) => {
  const { orderId, paymentId, signature, paymentType } = req.body;

  if (!orderId || !paymentId || !signature) {
    return res.status(400).json({ success: false, message: 'orderId, paymentId and signature are required' });
  }

  // ── Step 1: HMAC signature verification (MUST happen before any DB write) ─
  const isValid = PaymentService.verifyPaymentSignature({ orderId, paymentId, signature });

  if (!isValid) {
    console.warn(`[VERIFY][SIG_FAIL] orderId=${orderId} paymentId=${paymentId}`);
    return res.status(400).json({ success: false, message: 'Payment signature verification failed' });
  }

  // ── Step 2: Idempotent success processing ─────────────────────────────────
  const payment = await processPaymentSuccess({
    razorpayOrderId:   orderId,
    razorpayPaymentId: paymentId,
    razorpaySignature: signature,
    paymentTypeHint:   paymentType,
  });

  return res.status(200).json({
    success: true,
    message: 'Payment verified successfully',
    data: {
      paymentId:  payment._id,
      status:     payment.status,
      paidAt:     payment.paidAt,
      amount:     payment.amount,
      paymentType: payment.paymentType,
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// RAZORPAY WEBHOOK  (server-to-server, handles tab-closed recovery)
// ─────────────────────────────────────────────────────────────────────────────

// @desc    Handle Razorpay webhook events
// @route   POST /api/payments/webhook
// @access  Public (Razorpay servers only — guarded by signature)
export const handleWebhook = asyncHandler(async (req, res) => {
  const webhookSignature = req.headers['x-razorpay-signature'];
  const rawBody          = req.rawBody; // set by express.json verify callback in app.js

  if (!webhookSignature || !rawBody) {
    return res.status(400).json({ success: false, message: 'Missing webhook signature or body' });
  }

  // ── Step 1: Verify webhook signature using RAZORPAY_WEBHOOK_SECRET ────────
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[WEBHOOK][CONFIG_ERR] RAZORPAY_WEBHOOK_SECRET is not set');
    return res.status(500).json({ success: false, message: 'Webhook secret not configured' });
  }

  const isValidWebhook = PaymentService.validateWebhook(rawBody, webhookSecret, webhookSignature);

  if (!isValidWebhook) {
    console.warn('[WEBHOOK][SIG_FAIL] Invalid webhook signature received');
    return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
  }

  const event   = req.body;
  const evtName = event?.event;

  console.log(`[WEBHOOK][RECEIVED] event=${evtName}`);

  // ── Step 2: Route event types ─────────────────────────────────────────────

  // payment.captured  — payment captured by Razorpay (auto-capture mode)
  // order.paid        — order fully paid (reliable alternative to payment.captured)
  if (evtName === 'payment.captured' || evtName === 'order.paid') {
    const paymentEntity =
      evtName === 'order.paid'
        ? event?.payload?.payment?.entity
        : event?.payload?.payment?.entity;

    const razorpayOrderId   = paymentEntity?.order_id;
    const razorpayPaymentId = paymentEntity?.id;

    if (!razorpayOrderId || !razorpayPaymentId) {
      console.error(`[WEBHOOK][PARSE_ERR] event=${evtName} missing order_id or payment_id`);
      // Acknowledge to Razorpay so it doesn't retry indefinitely for a parse error
      return res.status(200).json({ success: true, message: 'Acknowledged — missing IDs, skipped' });
    }

    try {
      await processPaymentSuccess({
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature: '', // Webhook path — no client-side signature available
        paymentTypeHint:   undefined, // resolveRecordByOrderId will search all collections
      });
      console.log(`[WEBHOOK][PROCESSED] event=${evtName} orderId=${razorpayOrderId}`);
    } catch (err) {
      // If record not found log it — may be an order from a different system
      console.error(`[WEBHOOK][PROC_ERR] event=${evtName} orderId=${razorpayOrderId} err=${err.message}`);
    }

  // payment.failed  — mark booking/donation payment as failed
  } else if (evtName === 'payment.failed') {
    const paymentEntity    = event?.payload?.payment?.entity;
    const razorpayOrderId  = paymentEntity?.order_id;
    const razorpayPaymentId = paymentEntity?.id;
    const errorDescription = paymentEntity?.error_description || 'Payment failed';

    console.warn(`[WEBHOOK][FAILED] orderId=${razorpayOrderId} paymentId=${razorpayPaymentId} reason=${errorDescription}`);

    if (razorpayOrderId) {
      // Update Payment record if one exists
      await Payment.findOneAndUpdate(
        { razorpayOrderId },
        { status: 'failed', razorpayPaymentId },
      );

      // Update booking/donation paymentStatus to 'failed' via resolve
      try {
        const resolved = await resolveRecordByOrderId(razorpayOrderId);
        if (resolved) {
          const { record, paymentType } = resolved;
          if (record.paymentStatus !== 'failed') {
            if (paymentType === 'donation') {
              await Donation.findByIdAndUpdate(record._id, { paymentStatus: 'failed' });
            } else if (paymentType === 'pooja') {
              await PoojaBooking.findByIdAndUpdate(record._id, { paymentStatus: 'failed' });
            } else if (paymentType === 'darshan') {
              await DarshanBooking.findByIdAndUpdate(record._id, { paymentStatus: 'failed' });
            }
          }
        }
      } catch (err) {
        console.error(`[WEBHOOK][FAILED_UPDATE_ERR] orderId=${razorpayOrderId} err=${err.message}`);
      }
    }

  // refund.created  — a refund was issued
  } else if (evtName === 'refund.created') {
    const refundEntity = event?.payload?.refund?.entity;
    const razorpayPaymentId = refundEntity?.payment_id;
    const refundId     = refundEntity?.id;
    const refundAmount = Math.ceil((refundEntity?.amount || 0) / 100);

    console.log(`[WEBHOOK][REFUND] paymentId=${razorpayPaymentId} refundId=${refundId} amount=₹${refundAmount}`);

    if (razorpayPaymentId) {
      await Payment.findOneAndUpdate(
        { razorpayPaymentId },
        {
          refundId,
          refundAmount,
          refundStatus: 'full',
          status: 'refunded',
        },
      );
    }

  } else {
    // Unhandled event type — log and acknowledge
    console.log(`[WEBHOOK][UNHANDLED] event=${evtName}`);
  }

  // Always respond 200 to Razorpay to prevent unnecessary retries
  return res.status(200).json({ success: true, message: 'Webhook processed' });
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN ROUTES
// ─────────────────────────────────────────────────────────────────────────────

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

  if (payment.status === 'refunded') {
    return res.status(400).json({ success: false, message: 'Payment has already been refunded' });
  }

  const refundResult = await PaymentService.refundPayment(payment.razorpayPaymentId, {
    amount: amount ? amount * 100 : undefined,
    notes: { reason: reason || 'Admin refund' },
  });

  if (!refundResult.success) {
    return res.status(400).json({ success: false, message: refundResult.error || 'Refund failed' });
  }

  const isFullRefund = !amount || amount >= payment.amount;

  const updatedPayment = await Payment.findByIdAndUpdate(
    paymentId,
    {
      refundId:     refundResult.data.id,
      refundAmount: Math.ceil(refundResult.data.amount / 100),
      refundStatus: isFullRefund ? 'full' : 'partial',
      status:       'refunded',
    },
    { new: true }
  );

  console.log(`[REFUND][SUCCESS] paymentId=${paymentId} refundId=${refundResult.data.id} amount=₹${Math.ceil(refundResult.data.amount / 100)}`);

  return res.status(200).json({
    success: true,
    message: 'Refund processed successfully',
    data: updatedPayment,
  });
});

// @desc    Get single payment by DB ID
// @route   GET /api/payments/:paymentId
// @access  Private (Admin)
export const getPaymentDetails = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;

  const payment = await Payment.findById(paymentId);

  if (!payment) {
    return res.status(404).json({ success: false, message: 'Payment not found' });
  }

  return res.status(200).json({ success: true, data: payment });
});

// @desc    Get all payments with filters + pagination
// @route   GET /api/payments
// @access  Private (Admin)
export const getPayments = asyncHandler(async (req, res) => {
  const { status, paymentType, startDate, endDate, page = 1, limit = 10 } = req.query;

  const filter = {};
  if (status)      filter.status      = status;
  if (paymentType) filter.paymentType = paymentType;

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate)   filter.createdAt.$lte = new Date(endDate);
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [payments, total] = await Promise.all([
    Payment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Payment.countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true,
    data: payments,
    pagination: {
      total,
      pages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      limit: Number(limit),
    },
  });
});
