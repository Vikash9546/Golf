import express from 'express';
import { getCharities, selectCharityPreferences, getUserImpact, createCharity, updateCharity, deleteCharity } from '../controllers/charityController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';
import { verifyActiveSubscription } from '../middlewares/subscriptionMiddleware.js';

const router = express.Router();

// Safety first. All charity logic requires a logged in user.
router.use(protect); 

// Map User routes
router.get('/', getCharities);
router.put('/preferences', verifyActiveSubscription, selectCharityPreferences);
router.get('/impact', verifyActiveSubscription, getUserImpact);

// Map Admin routes
router.use('/admin', admin); // All routes below this use middleware
router.post('/admin', createCharity);
router.put('/admin/:id', updateCharity);
router.delete('/admin/:id', deleteCharity);

export default router;
