import { registerUser, loginUser, getUsers, updateProfile } from '../controllers/authController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/signup', registerUser);
router.post('/login', loginUser);

// Profile and protected user routes
router.patch('/profile', protect, updateProfile);

// Admin-only user directory access
router.get('/users', protect, admin, getUsers);

export default router;
