import express from 'express';
import {
  register,
  login,
  testLogin,
  clerkWebhook,
  getProfile,
  updateProfile,
  changePassword,
  logout,
  verifyTokenEndpoint,
  requestPasswordReset,
  resetPassword
} from '../controllers/authController.js';
import { authenticateToken, authRateLimit } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Public routes
router.post('/register', authRateLimit(), register);
router.post('/login', authRateLimit(), login);
router.post('/test-login', testLogin); // Development only
router.post('/verify-token', verifyTokenEndpoint);
router.post('/request-password-reset', authRateLimit(3, 30), requestPasswordReset);
router.post('/reset-password', authRateLimit(3, 30), resetPassword);

// Clerk webhook (should be protected by Clerk webhook signature verification in production)
router.post('/clerk-webhook', clerkWebhook);

// Protected routes
router.use(authenticateToken); // All routes below require authentication

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/change-password', changePassword);
router.post('/logout', logout);

export default router;
