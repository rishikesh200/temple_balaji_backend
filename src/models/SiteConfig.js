import mongoose from 'mongoose';

// Stores temple-level settings only. All content (poojas, darshan types,
// donation causes, events) lives in their own collections.
const SiteConfigSchema = new mongoose.Schema(
  {
    key:            { type: String, default: 'main', unique: true },
    templeSettings: { type: mongoose.Schema.Types.Mixed, default: {} },
    liveStream:     { type: mongoose.Schema.Types.Mixed, default: { enabled: false, url: '', title: 'Live Darshan' } },
    theme:          { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export default mongoose.model('SiteConfig', SiteConfigSchema);
