import express from 'express';
import { getConfig, updateConfig } from '../controllers/config.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/',  getConfig);           // public
router.put('/',  protect, updateConfig); // admin only

export default router;
