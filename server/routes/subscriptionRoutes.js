import express from 'express';
import { activateSubscription } from '../controllers/subscriptionController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Route to simulate subscription activation
router.post('/activate', protect, activateSubscription);

export default router;
