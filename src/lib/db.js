import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  // If we already have a fully connected mongoose instance, return it immediately
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  // If the promise is not active, or the connection readyState is disconnected (0),
  // reset and start a new connection promise
  if (!cached.promise || mongoose.connection.readyState === 0) {
    const opts = {
      bufferCommands: true, // Allow Mongoose to buffer commands instead of failing instantly
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds instead of waiting forever
      maxPoolSize: 5, // Recommended limit for serverless functions to avoid connection exhaustion
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      console.log('MongoDB connected successfully');
      return mongooseInstance;
    }).catch((err) => {
      cached.promise = null; // Clear cached promise on connection error
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null; // Clear cached promise if the awaited promise fails
    throw error;
  }

  return cached.conn;
}

export default connectDB;

