import mongoose from 'mongoose';

const GalleryImageSchema = new mongoose.Schema(
  {
    id:       { type: String, required: true, unique: true },
    imageUrl: { type: String, required: true },
    caption:  { type: String, default: '' },
    category: { type: String, default: 'general' }, // festival, darshan, pooja, general, etc.
    isHome:   { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    sortOrder:{ type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('GalleryImage', GalleryImageSchema);
