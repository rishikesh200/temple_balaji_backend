import mongoose from 'mongoose';

const DonationCauseSchema = new mongoose.Schema(
  {
    id:            { type: String, required: true, unique: true },
    title:         { type: String, required: true },
    description:   { type: String, default: '' },
    imageUrl:      { type: String, default: '' },
    inputMode:     { type: String, enum: ['presets', 'custom'], default: 'custom' },
    presetAmounts: { type: [Number], default: [] },
    ctaIcon:       { type: String, default: 'heart' },
    active:        { type: Boolean, default: true },
    // Tamil translations
    title_ta:       { type: String, default: '' },
    description_ta: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('DonationCause', DonationCauseSchema);
