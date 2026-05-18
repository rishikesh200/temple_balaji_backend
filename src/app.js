import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import connectDB from './lib/db.js';
import { errorHandler } from './middleware/errorHandler.js';

// Import routes
import authRoutes from './routes/auth.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import donationRoutes from './routes/donation.routes.js';
import poojaRoutes from './routes/pooja.routes.js';
import darshanRoutes from './routes/darshan.routes.js';

// Load env vars
dotenv.config();

const app = express();

// Security Middleware
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body Parser
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf?.length ? buf.toString() : '';
  },
}));

app.use(express.urlencoded({ extended: true }));

// ==============================
// DATABASE CONNECTION MIDDLEWARE
// ==============================
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('MongoDB Connection Error:', error);

    return res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message,
    });
  }
});

// ==============================
// HEALTH CHECK
// ==============================
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    message: 'Temple Backend is running',
  });
});

// ==============================
// ROUTES
// ==============================
app.use('/api/auth', authRoutes);

app.use('/api/payments', paymentRoutes);

app.use('/api/donations', donationRoutes);

app.use('/api/pooja-bookings', poojaRoutes);

app.use('/api/darshan-bookings', darshanRoutes);

// ==============================
// ERROR HANDLER
// ==============================
app.use(errorHandler);

// ==============================
// EXPORT APP FOR VERCEL
// ==============================
export default app;