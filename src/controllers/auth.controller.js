import Admin from '../models/Admin.js';
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';

// @desc    Admin login & get token
// @route   POST /api/auth/login
// @access  Public
export const loginAdmin = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const admin = await Admin.findOne({ username });
  if (!admin) {
    res.status(401);
    throw new Error('Invalid credentials');
  }
  const match = await admin.matchPassword(password);
  if (!match) {
    res.status(401);
    throw new Error('Invalid credentials');
  }
  const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
  res.json({ success: true, data: { token, username: admin.username, role: admin.role } });
});

// @desc    Get logged‑in admin data
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.admin.id).select('-passwordHash');
  if (!admin) {
    res.status(404);
    throw new Error('Admin not found');
  }
  res.json({ success: true, data: admin });
});

// @desc    Logout (client side just drops token)
// @route   POST /api/auth/logout
// @access  Private
export const logoutAdmin = asyncHandler(async (req, res) => {
  // No server‑side token revocation needed for stateless JWTs.
  // Optionally you could implement a blacklist.
  res.json({ success: true, message: 'Logged out' });
});
