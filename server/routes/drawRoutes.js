import express from 'express';
import { runMonthlyDraw } from '../controllers/drawController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// A secure endpoint restricted strictly to Administrators.
// 'protect' verifies the JWT identity, while 'admin' enforces the proper role.
router.post('/admin/run', protect, admin, runMonthlyDraw);

export default router;
