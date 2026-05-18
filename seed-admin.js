import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from './src/models/Admin.js';

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    const adminExists = await Admin.findOne({ username: 'admin' });

    if (adminExists) {
      console.log('Admin user already exists');
      process.exit();
    }

    const admin = new Admin({
      username: 'admin',
      passwordHash: 'admin123', // Will be hashed by pre-save hook
      role: 'superadmin',
    });

    await admin.save();
    console.log('Admin user created successfully! Username: admin | Password: admin123');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

seedAdmin();
