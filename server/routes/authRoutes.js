import express from 'express';
import { registerUser, loginUser, getUsers } from '../controllers/authController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/signup', registerUser);
router.post('/login', loginUser);

// Admin-only user directory access
router.get('/users', protect, admin, getUsers);

export default router;
