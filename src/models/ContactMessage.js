import mongoose from 'mongoose';

const ContactMessageSchema = new mongoose.Schema(
  {
    name:    { type: String, required: true, trim: true },
    email:   { type: String, required: true, trim: true },
    phone:   { type: String, default: '', trim: true },
    message: { type: String, required: true },
    status:  { type: String, enum: ['new', 'read', 'replied'], default: 'new' },
    adminNote: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('ContactMessage', ContactMessageSchema);
