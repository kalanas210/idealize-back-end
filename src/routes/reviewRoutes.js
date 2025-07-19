const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const { clerkProtect } = require('../middleware/auth');
const { validate } = require('../utils/validation');
const { successResponse, createdResponse, paginatedResponse, notFoundResponse, forbiddenResponse } = require('../utils/response');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Review:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         gigId:
 *           type: string
 *           format: uuid
 *         orderId:
 *           type: string
 *           format: uuid
 *         buyerId:
 *           type: string
 *           format: uuid
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         title:
 *           type: string
 *         comment:
 *           type: string
 *         helpful:
 *           type: integer
 *           description: Number of users who found this review helpful
 *         verified:
 *           type: boolean
 *           description: Whether this is a verified purchase review
 *         createdAt:
 *           type: string
 *           format: date-time
 *         buyer:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *             avatar:
 *               type: string
 *             country:
 *               type: string
 */

/**
 * @swagger
 * /api/reviews/gig/{gigId}:
 *   get:
 *     summary: Get reviews for a specific gig
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: gigId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: rating
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         description: Filter by specific rating
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [newest, oldest, helpful]
 *           default: newest
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
 *       404:
 *         description: Gig not found
 */
router.get('/gig/:gigId', async (req, res, next) => {
  try {
    const { gigId } = req.params;
    const { page = 1, limit = 10, rating, sortBy = 'newest' } = req.query;

    // TODO: Get reviews with filtering and pagination
    /*
    let whereConditions = ['r.gig_id = $1'];
    let params = [gigId];
    let paramCount = 1;

    if (rating) {
      paramCount++;
      whereConditions.push(`r.rating = $${paramCount}`);
      params.push(parseInt(rating));
    }

    let orderClause = 'ORDER BY r.created_at DESC';
    if (sortBy === 'oldest') {
      orderClause = 'ORDER BY r.created_at ASC';
    } else if (sortBy === 'helpful') {
      orderClause = 'ORDER BY r.helpful DESC, r.created_at DESC';
    }

    const reviewsResult = await query(`
      SELECT r.*, u.name as buyer_name, u.avatar as buyer_avatar, u.country as buyer_country
      FROM reviews r
      INNER JOIN users u ON r.buyer_id = u.id
      WHERE ${whereConditions.join(' AND ')}
      ${orderClause}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `, [...params, parseInt(limit), (parseInt(page) - 1) * parseInt(limit)]);

    const countResult = await query(`
      SELECT COUNT(*) as total FROM reviews r WHERE ${whereConditions.join(' AND ')}
    `, params);
    */

    // Mock reviews data
    const reviews = [
      {
        id: uuidv4(),
        gigId,
        rating: 5,
        title: 'Exceptional quality and professionalism!',
        comment: 'Mike delivered exactly what was promised and more. The video quality was outstanding.',
        helpful: 23,
        verified: true,
        buyer: {
          name: 'Sarah Johnson',
          avatar: 'https://example.com/avatar1.jpg',
          country: 'United States'
        },
        createdAt: new Date('2024-01-18')
      },
      {
        id: uuidv4(),
        gigId,
        rating: 5,
        title: 'Great communication and results',
        comment: 'Working with Mike was a pleasure. He was very communicative throughout the process.',
        helpful: 15,
        verified: true,
        buyer: {
          name: 'David Chen',
          avatar: 'https://example.com/avatar2.jpg',
          country: 'Canada'
        },
        createdAt: new Date('2024-01-15')
      }
    ];

    const pagination = { page: parseInt(page), limit: parseInt(limit), total: reviews.length };
    return paginatedResponse(res, reviews, pagination, 'Reviews retrieved successfully');

  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Create a review for a completed order
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - rating
 *               - comment
 *             properties:
 *               orderId:
 *                 type: string
 *                 format: uuid
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               title:
 *                 type: string
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review created successfully
 *       400:
 *         description: Order not eligible for review or already reviewed
 *       404:
 *         description: Order not found
 */
router.post('/', clerkProtect, validate.createReview, async (req, res, next) => {
  try {
    const { orderId, rating, title, comment } = req.body;
    const reviewId = uuidv4();

    // TODO: Validate order and create review
    /*
    // Check if order exists, is completed, and belongs to the user
    const orderResult = await query(`
      SELECT o.*, g.id as gig_id, g.seller_id
      FROM orders o
      INNER JOIN gigs g ON o.gig_id = g.id
      WHERE o.id = $1 AND o.buyer_id = $2 AND o.status = $3
    `, [orderId, req.user.id, 'completed']);

    if (orderResult.rows.length === 0) {
      return badRequestResponse(res, 'Order not found, not completed, or not yours');
    }

    // Check if review already exists
    const existingReview = await query(
      'SELECT id FROM reviews WHERE order_id = $1',
      [orderId]
    );

    if (existingReview.rows.length > 0) {
      return badRequestResponse(res, 'Review already exists for this order');
    }

    const order = orderResult.rows[0];

    // Create review
    const newReview = await query(`
      INSERT INTO reviews (
        id, gig_id, order_id, buyer_id, seller_id, rating, title, comment, verified, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()
      ) RETURNING *
    `, [reviewId, order.gig_id, orderId, req.user.id, order.seller_id, rating, title, comment, true]);

    // Update gig rating
    await query(`
      UPDATE gigs SET 
        total_reviews = total_reviews + 1,
        rating = (
          SELECT AVG(rating::numeric)::decimal(3,2) 
          FROM reviews 
          WHERE gig_id = $1
        ),
        updated_at = NOW()
      WHERE id = $1
    `, [order.gig_id]);
    */

    // Mock response
    const newReview = {
      id: reviewId,
      orderId,
      rating,
      title,
      comment,
      verified: true,
      helpful: 0,
      buyer: {
        name: req.user.name,
        avatar: req.user.avatar
      },
      createdAt: new Date()
    };

    return createdResponse(res, newReview, 'Review created successfully');

  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/reviews/{id}/helpful:
 *   post:
 *     summary: Mark a review as helpful
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Review marked as helpful
 *       400:
 *         description: Already marked as helpful
 *       404:
 *         description: Review not found
 */
router.post('/:id/helpful', clerkProtect, async (req, res, next) => {
  try {
    const { id } = req.params;

    // TODO: Check if user already marked as helpful and update
    /*
    const existingVote = await query(
      'SELECT id FROM review_helpful WHERE review_id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (existingVote.rows.length > 0) {
      return badRequestResponse(res, 'You have already marked this review as helpful');
    }

    // Add helpful vote
    await query(
      'INSERT INTO review_helpful (review_id, user_id, created_at) VALUES ($1, $2, NOW())',
      [id, req.user.id]
    );

    // Update helpful count
    const updatedReview = await query(`
      UPDATE reviews SET 
        helpful = (SELECT COUNT(*) FROM review_helpful WHERE review_id = $1),
        updated_at = NOW()
      WHERE id = $1
      RETURNING helpful
    `, [id]);
    */

    // Mock response
    const updatedReview = {
      id,
      helpful: 24 // incremented count
    };

    return successResponse(res, updatedReview, 'Review marked as helpful');

  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/reviews/user/{userId}:
 *   get:
 *     summary: Get reviews written by a specific user
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: User reviews retrieved successfully
 */
router.get('/user/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // TODO: Get user reviews
    /*
    const reviewsResult = await query(`
      SELECT r.*, g.title as gig_title, g.id as gig_id
      FROM reviews r
      INNER JOIN gigs g ON r.gig_id = g.id
      WHERE r.buyer_id = $1
      ORDER BY r.created_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, parseInt(limit), (parseInt(page) - 1) * parseInt(limit)]);
    */

    // Mock user reviews
    const reviews = [
      {
        id: uuidv4(),
        gigId: uuidv4(),
        gigTitle: 'Tech Review Video Service',
        rating: 5,
        title: 'Great service!',
        comment: 'Excellent work and quick delivery.',
        createdAt: new Date()
      }
    ];

    const pagination = { page: parseInt(page), limit: parseInt(limit), total: 1 };
    return paginatedResponse(res, reviews, pagination, 'User reviews retrieved successfully');

  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/reviews/seller/{sellerId}/stats:
 *   get:
 *     summary: Get review statistics for a seller
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Seller review statistics
 */
router.get('/seller/:sellerId/stats', async (req, res, next) => {
  try {
    const { sellerId } = req.params;

    // TODO: Get seller review statistics
    /*
    const statsResult = await query(`
      SELECT 
        COUNT(*) as total_reviews,
        AVG(rating::numeric)::decimal(3,2) as average_rating,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
        COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
        COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
      FROM reviews r
      INNER JOIN gigs g ON r.gig_id = g.id
      WHERE g.seller_id = $1
    `, [sellerId]);
    */

    // Mock statistics
    const stats = {
      totalReviews: 127,
      averageRating: 4.9,
      ratingDistribution: {
        5: 95,
        4: 25,
        3: 5,
        2: 1,
        1: 1
      }
    };

    return successResponse(res, stats, 'Seller review statistics retrieved successfully');

  } catch (error) {
    next(error);
  }
});

module.exports = router;
