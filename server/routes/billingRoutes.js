import express from 'express';
import { createSubscription, cancelSubscription, razorpayWebhook } from '../controllers/billingController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Protected route for logged in users to initiate payment
// (They must pass JWT to access this)
router.post('/create-subscription', protect, createSubscription);

// Protected route for logged in users to cancel
router.post('/cancel-subscription', protect, cancelSubscription);

// Public webhook route (Razorpay will HTTP POST to this endpoint)
router.post('/webhook', razorpayWebhook);

export default router;
