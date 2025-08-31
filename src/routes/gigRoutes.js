import express from 'express';
import { authenticateToken, requireSeller, optionalAuth } from '../middleware/auth.js';
import { validatePagination, validateSort } from '../middleware/validation.js';
import { Gig } from '../models/index.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';

const router = express.Router();

// Get all gigs (public)
router.get('/', optionalAuth, validatePagination, validateSort(['createdAt', 'rating', 'price', 'orders']), asyncHandler(async (req, res) => {
  const { page, limit, skip } = req.pagination;
  const { category, search, minPrice, maxPrice, rating } = req.query;

  const query = { status: 'active' };
  
  if (category) query.category = category;
  if (rating) query['stats.rating'] = { $gte: parseFloat(rating) };
  if (search) {
    query.$text = { $search: search };
  }

  const gigs = await Gig.find(query)
    .populate('seller', 'username displayName avatar sellerProfile.rating')
    .skip(skip)
    .limit(limit)
    .sort(req.sort);

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

// Get gig by ID
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const gig = await Gig.findById(req.params.id)
    .populate('seller', 'username displayName avatar sellerProfile');

  if (!gig) {
    throw new AppError('Gig not found', 404, 'GIG_NOT_FOUND');
  }

  // Increment views if not the owner
  if (!req.user || !gig.seller._id.equals(req.user._id)) {
    await gig.incrementViews();
  }

  res.json({
    success: true,
    data: { gig }
  });
}));

// Create gig (seller only)
router.post('/', authenticateToken, requireSeller, asyncHandler(async (req, res) => {
  const gigData = {
    ...req.body,
    seller: req.user._id
  };

  const gig = await Gig.create(gigData);
  await gig.populate('seller', 'username displayName avatar');

  res.status(201).json({
    success: true,
    message: 'Gig created successfully',
    data: { gig }
  });
}));

// Update gig
router.put('/:id', authenticateToken, requireSeller, asyncHandler(async (req, res) => {
  const gig = await Gig.findById(req.params.id);

  if (!gig) {
    throw new AppError('Gig not found', 404, 'GIG_NOT_FOUND');
  }

  // Check ownership
  if (!gig.seller.equals(req.user._id) && req.user.role !== 'admin') {
    throw new AppError('Access denied', 403, 'ACCESS_DENIED');
  }

  const updatedGig = await Gig.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate('seller', 'username displayName avatar');

  res.json({
    success: true,
    message: 'Gig updated successfully',
    data: { gig: updatedGig }
  });
}));

// Delete gig
router.delete('/:id', authenticateToken, requireSeller, asyncHandler(async (req, res) => {
  const gig = await Gig.findById(req.params.id);

  if (!gig) {
    throw new AppError('Gig not found', 404, 'GIG_NOT_FOUND');
  }

  // Check ownership
  if (!gig.seller.equals(req.user._id) && req.user.role !== 'admin') {
    throw new AppError('Access denied', 403, 'ACCESS_DENIED');
  }

  await Gig.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Gig deleted successfully'
  });
}));

// Get seller's gigs
router.get('/seller/:sellerId', validatePagination, asyncHandler(async (req, res) => {
  const { page, limit, skip } = req.pagination;
  const { status } = req.query;

  const query = { seller: req.params.sellerId };
  if (status) query.status = status;

  const gigs = await Gig.find(query)
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

// Get featured gigs
router.get('/featured', asyncHandler(async (req, res) => {
  const gigs = await Gig.findFeatured()
    .populate('seller', 'username displayName avatar sellerProfile.rating')
    .limit(10);

  res.json({
    success: true,
    data: { gigs }
  });
}));

// Search gigs
router.get('/search', optionalAuth, validatePagination, asyncHandler(async (req, res) => {
  const { q, category, minPrice, maxPrice, rating } = req.query;
  const { page, limit, skip } = req.pagination;

  const filters = {};
  if (category) filters.category = category;
  if (rating) filters.rating = parseFloat(rating);

  const gigs = await Gig.searchGigs(q, filters)
    .skip(skip)
    .limit(limit);

  res.json({
    success: true,
    data: { gigs }
  });
}));

export default router;
