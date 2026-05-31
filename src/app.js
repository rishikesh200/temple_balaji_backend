import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import connectDB from './lib/db.js';
import { errorHandler } from './middleware/errorHandler.js';

// Routes
import authRoutes         from './routes/auth.routes.js';
import paymentRoutes      from './routes/payment.routes.js';
import donationRoutes     from './routes/donation.routes.js';
import poojaRoutes        from './routes/pooja.routes.js';
import darshanRoutes      from './routes/darshan.routes.js';
import uploadRoutes       from './routes/upload.routes.js';
import configRoutes       from './routes/config.routes.js';
import poojaItemRoutes    from './routes/poojaItem.routes.js';
import darshanTypeRoutes  from './routes/darshanType.routes.js';
import donationCauseRoutes from './routes/donationCause.routes.js';
import eventRoutes        from './routes/event.routes.js';
import galleryRoutes      from './routes/gallery.routes.js';
import heroImageRoutes    from './routes/heroImage.routes.js';
import contactRoutes      from './routes/contact.routes.js';

dotenv.config();

const app = express();
const isProd = process.env.NODE_ENV === 'production';

// ── Security headers ─────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ── CORS ─────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:4173',
];
app.use(cors({
  origin: (origin, cb) => {
    // Allow non-browser requests (Postman, server-to-server) and listed origins
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Body parser ───────────────────────────────────────────────
app.use(express.json({
  limit: '2mb',                // protect against giant JSON payloads
  verify: (req, _res, buf) => { req.rawBody = buf?.length ? buf.toString() : ''; },
}));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ── Rate limiters ─────────────────────────────────────────────
// Strict limiter for login — prevents brute-force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Please try again in 15 minutes.' },
});

// General API limiter
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please slow down.' },
});

app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);

// ── DB connection middleware ──────────────────────────────────
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    res.status(500).json({ success: false, message: 'Database unavailable. Please try again.' });
  }
});

// ── Health check ─────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ success: true, status: 'ok', env: isProd ? 'production' : 'development' });
});

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth',             authRoutes);
app.use('/api/payments',         paymentRoutes);
app.use('/api/donations',        donationRoutes);
app.use('/api/pooja-bookings',   poojaRoutes);
app.use('/api/darshan-bookings', darshanRoutes);
app.use('/api/upload',           uploadRoutes);
app.use('/api/config',           configRoutes);
// Content collections (admin-managed)
app.use('/api/poojas',           poojaItemRoutes);
app.use('/api/darshan-types',    darshanTypeRoutes);
app.use('/api/donation-causes',  donationCauseRoutes);
app.use('/api/events',           eventRoutes);
app.use('/api/gallery',          galleryRoutes);
app.use('/api/hero-images',      heroImageRoutes);
app.use('/api/contact',          contactRoutes);

// ── 404 ───────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// ── Global error handler ──────────────────────────────────────
app.use(errorHandler);

export default app;
