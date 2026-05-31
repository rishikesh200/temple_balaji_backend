import mongoose from 'mongoose';

const PoojaItemSchema = new mongoose.Schema(
  {
    id:           { type: String, required: true, unique: true },
    category:     { type: String, enum: ['daily', 'special', 'nerthikadan'], required: true },
    name:         { type: String, required: true },
    price:        { type: Number, default: 0 },
    time:         { type: String, default: '' },
    description:  { type: String, default: '' },
    image:        { type: String, default: '' },
    icon:         { type: String, default: '' },
    about:        { type: String, default: '' },
    benefits:     { type: [String], default: [] },
    other:        { type: String, default: '' },
    participation:{ type: String, default: '' },
    active:       { type: Boolean, default: true },
    showInHome:   { type: Boolean, default: false },
    bookingType:  { type: String, enum: ['payment', 'spot', 'free', 'both'], default: 'payment' },
    // Tamil translations
    name_ta:        { type: String, default: '' },
    time_ta:        { type: String, default: '' },
    description_ta: { type: String, default: '' },
    about_ta:       { type: String, default: '' },
    other_ta:       { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('PoojaItem', PoojaItemSchema);
