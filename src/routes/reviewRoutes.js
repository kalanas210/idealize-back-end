import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { validatePagination } from '../middleware/validation.js';
import { Review } from '../models/index.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';

const router = express.Router();

// Get reviews for a gig
router.get('/gig/:gigId', validatePagination, asyncHandler(async (req, res) => {
  const { page, limit, skip } = req.pagination;
  const { rating } = req.query;

  const options = { limit };
  if (rating) options.rating = parseInt(rating);

  const reviews = await Review.findForGig(req.params.gigId, options)
    .skip(skip);

  const total = await Review.countDocuments({ 
    gig: req.params.gigId, 
    status: 'published',
    ...(rating && { 'rating.overall': { $gte: parseInt(rating) } })
  });

  res.json({
    success: true,
    data: {
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

// Create review
router.post('/', authenticateToken, asyncHandler(async (req, res) => {
  const reviewData = {
    ...req.body,
    buyer: req.user._id
  };

  const review = await Review.create(reviewData);
  await review.populate('buyer', 'username displayName avatar');

  res.status(201).json({
    success: true,
    message: 'Review created successfully',
    data: { review }
  });
}));

// Mark review as helpful
router.post('/:id/helpful', authenticateToken, asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  
  if (!review) {
    throw new AppError('Review not found', 404, 'REVIEW_NOT_FOUND');
  }

  await review.markHelpful(req.user._id);

  res.json({
    success: true,
    message: 'Review marked as helpful'
  });
}));

export default router;
