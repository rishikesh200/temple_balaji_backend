import asyncHandler from 'express-async-handler';
import SiteConfig from '../models/SiteConfig.js';

// GET /api/config  — public
export const getConfig = asyncHandler(async (req, res) => {
  const config = await SiteConfig.findOne({ key: 'main' }).lean();
  res.json({
    success: true,
    templeSettings: config?.templeSettings ?? {},
    liveStream: config?.liveStream ?? { enabled: false, url: '', title: 'Live Darshan' },
    theme: config?.theme ?? {},
  });
});

// PUT /api/config  — admin only
export const updateConfig = asyncHandler(async (req, res) => {
  const { templeSettings, liveStream, theme } = req.body;
  const update = {};
  if (templeSettings !== undefined) update.templeSettings = templeSettings;
  if (liveStream     !== undefined) update.liveStream     = liveStream;
  if (theme          !== undefined) update.theme          = theme;
  const config = await SiteConfig.findOneAndUpdate(
    { key: 'main' },
    { $set: update },
    { new: true, upsert: true, runValidators: false }
  );
  res.json({ success: true, templeSettings: config.templeSettings, liveStream: config.liveStream, theme: config.theme ?? {} });
});
