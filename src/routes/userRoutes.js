import express from 'express';
import { requireAuth } from '@clerk/express';
import { authenticateToken, requireAdmin, requireOwnershipOrAdmin } from '../middleware/auth.js';
import { validatePagination } from '../middleware/validation.js';
import { User } from '../models/index.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';

const router = express.Router();

// Get current user profile (must come before /:id route)
router.get('/profile', authenticateToken, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  
  res.json({
    success: true,
    data: { user }
  });
}));

// Get user profile by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('-password')
    .populate('sellerProfile.portfolio');

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  res.json({
    success: true,
    data: { user }
  });
}));

// Update user profile
router.put('/profile', authenticateToken, asyncHandler(async (req, res) => {
  const allowedUpdates = [
    'firstName', 'lastName', 'bio', 'location', 'phone',
    'preferences', 'sellerProfile', 'buyerProfile'
  ];
  
  const updates = {};
  Object.keys(req.body).forEach(key => {
    if (allowedUpdates.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  const user = await User.findByIdAndUpdate(
    req.user._id,
    updates,
    { new: true, runValidators: true }
  ).select('-password');

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: { user }
  });
}));

// Become a seller
router.post('/become-seller', authenticateToken, asyncHandler(async (req, res) => {
  const {
    professionalTitle,
    experience,
    skills,
    languages,
    socialAccounts,
    portfolio,
    verificationDocs
  } = req.body;

  const user = await User.findById(req.user._id);
  
  if (user.role === 'seller') {
    throw new AppError('User is already a seller', 400, 'ALREADY_SELLER');
  }

  // Update user to seller
  user.role = 'seller';
  user.sellerProfile = {
    professionalTitle,
    experience,
    skills: skills || [],
    languages: languages || [],
    socialAccounts: socialAccounts || [],
    portfolio: portfolio || [],
    verificationDocs: verificationDocs || [],
    rating: 0,
    totalReviews: 0,
    totalEarnings: 0,
    completedOrders: 0,
    responseTime: 24,
    availability: 'available'
  };

  await user.save();

  res.json({
    success: true,
    message: 'Successfully became a seller',
    data: { user }
  });
}));

// Get seller application status (must come before /:id route)
router.get('/seller-application-status', authenticateToken, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  res.json({
    success: true,
    data: {
      status: user.role === 'seller' ? 'approved' : 'not_applied',
      role: user.role,
      sellerProfile: user.sellerProfile
    }
  });
}));

// Get all users (admin only)
router.get('/', authenticateToken, requireAdmin, validatePagination, asyncHandler(async (req, res) => {
  const { page, limit, skip } = req.pagination;
  const { role, status, search } = req.query;

  const query = {};
  
  if (role) query.role = role;
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { email: { $regex: search, $options: 'i' } },
      { username: { $regex: search, $options: 'i' } },
      { displayName: { $regex: search, $options: 'i' } }
    ];
  }

  const users = await User.find(query)
    .select('-password')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await User.countDocuments(query);

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

export default router;
