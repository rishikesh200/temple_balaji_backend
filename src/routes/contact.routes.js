import express from 'express';
import { submitContact, getContacts, updateContact, deleteContact } from '../controllers/contact.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/',      submitContact);               // public
router.get('/',       protect, getContacts);        // admin
router.put('/:id',    protect, updateContact);      // admin
router.delete('/:id', protect, deleteContact);      // admin

export default router;
