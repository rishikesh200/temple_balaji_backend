import mongoose from 'mongoose';

const TempleEventSchema = new mongoose.Schema(
  {
    id:           { type: String, required: true, unique: true },
    title:        { type: String, required: true },
    category:     { type: String, enum: ['upcoming', 'community'], default: 'upcoming' },
    date:         { type: String, default: '' },
    time:         { type: String, default: '' },
    location:     { type: String, default: '' },
    participants: { type: String, default: '' },
    details:      { type: String, default: '' },
    imageKey:     { type: String, default: '' },
    imageUrl:     { type: String, default: '' },
    ctaText:      { type: String, default: '' },
    ctaLink:      { type: String, default: '' },
    active:       { type: Boolean, default: true },
    showInHome:   { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('TempleEvent', TempleEventSchema);
