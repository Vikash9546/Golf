import express from 'express';
import { getScores, addScore, editScore, deleteScore } from '../controllers/scoreController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { verifyActiveSubscription } from '../middlewares/subscriptionMiddleware.js';

const router = express.Router();

// Apply middlewares to all score routes
// 1. User must be logged in (JWT check)
// 2. User must have an active subscription (Supabase check)
router.use(protect);
router.use(verifyActiveSubscription);

// Map routes
router.route('/')
    .get(getScores)
    .post(addScore);

router.route('/:id')
    .put(editScore)
    .delete(deleteScore);

export default router;
