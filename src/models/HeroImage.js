import mongoose from 'mongoose';

const HeroImageSchema = new mongoose.Schema(
  {
    id:        { type: String, required: true, unique: true },
    imageUrl:  { type: String, required: true },
    caption:   { type: String, default: '' },
    isActive:  { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('HeroImage', HeroImageSchema);
