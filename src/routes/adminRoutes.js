import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { validatePagination } from '../middleware/validation.js';
import { User, Gig, Order, Review } from '../models/index.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';

const router = express.Router();

// Apply admin authentication to all routes
router.use(authenticateToken, requireAdmin);

// Dashboard stats
router.get('/dashboard', asyncHandler(async (req, res) => {
  const stats = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'seller' }),
    User.countDocuments({ role: 'buyer' }),
    Gig.countDocuments(),
    Gig.countDocuments({ status: 'active' }),
    Order.countDocuments(),
    Review.countDocuments({ status: 'published' })
  ]);

  res.json({
    success: true,
    data: {
      totalUsers: stats[0],
      totalSellers: stats[1],
      totalBuyers: stats[2],
      totalGigs: stats[3],
      activeGigs: stats[4],
      totalOrders: stats[5],
      totalReviews: stats[6]
    }
  });
}));

// Get all users
router.get('/users', validatePagination, asyncHandler(async (req, res) => {
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

// Get all gigs
router.get('/gigs', validatePagination, asyncHandler(async (req, res) => {
  const { page, limit, skip } = req.pagination;
  const { status, category } = req.query;

  const query = {};
  if (status) query.status = status;
  if (category) query.category = category;

  const gigs = await Gig.find(query)
    .populate('seller', 'username displayName email')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await Gig.countDocuments(query);

  res.json({
    success: true,
    data: {
      gigs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

// Get seller applications
router.get('/seller-applications', validatePagination, asyncHandler(async (req, res) => {
  const { page, limit, skip } = req.pagination;
  
  const applications = await User.find({
    role: 'seller',
    'sellerProfile.verificationDocs': { $exists: true, $ne: [] }
  })
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await User.countDocuments({
    role: 'seller',
    'sellerProfile.verificationDocs': { $exists: true, $ne: [] }
  });

  res.json({
    success: true,
    data: {
      applications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

// Approve seller application
router.post('/seller-applications/:userId/approve', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);
  
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  // Update verification docs status
  user.sellerProfile.verificationDocs.forEach(doc => {
    if (doc.status === 'pending') {
      doc.status = 'approved';
      doc.reviewedAt = new Date();
      doc.reviewedBy = req.user._id;
    }
  });

  user.verified.identity = true;
  await user.save();

  res.json({
    success: true,
    message: 'Seller application approved'
  });
}));

// Reject seller application
router.post('/seller-applications/:userId/reject', asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const user = await User.findById(req.params.userId);
  
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  // Update verification docs status
  user.sellerProfile.verificationDocs.forEach(doc => {
    if (doc.status === 'pending') {
      doc.status = 'rejected';
      doc.reviewedAt = new Date();
      doc.reviewedBy = req.user._id;
      doc.notes = reason;
    }
  });

  await user.save();

  res.json({
    success: true,
    message: 'Seller application rejected'
  });
}));

export default router;
