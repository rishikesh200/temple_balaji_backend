import mongoose from 'mongoose';

const DarshanTypeSchema = new mongoose.Schema(
  {
    id:          { type: String, required: true, unique: true },
    title:       { type: String, required: true },
    summary:     { type: String, default: '' },
    description: { type: String, default: '' },
    priceLabel:  { type: String, default: '' },
    badge:       { type: String, default: '' },
    tagline:     { type: String, default: '' },
    price:       { type: Number, default: 0 },
    featured:    { type: Boolean, default: false },
    ctaLabel:    { type: String, default: 'Book Now' },
    primaryCta:  { type: Boolean, default: false },
    imageUrl:    { type: String, default: '' },
    active:      { type: Boolean, default: true },
    showInHome:  { type: Boolean, default: true },
    bookingType: { type: String, enum: ['payment', 'spot', 'free', 'both'], default: 'payment' },
  },
  { timestamps: true }
);

export default mongoose.model('DarshanType', DarshanTypeSchema);
