const express = require('express');
const { query } = require('../config/database');
const { protect, authorize } = require('../middleware/auth');
const { successResponse, notFoundResponse, paginatedResponse, errorResponse } = require('../utils/response');
const { body, validationResult } = require('express-validator');

const router = express.Router();

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Not authenticated
 */
router.get('/profile', protect, async (req, res, next) => {
  try {
    return successResponse(res, req.user, 'User profile retrieved successfully');
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               avatar:
 *                 type: string
 *               bio:
 *                 type: string
 *               location:
 *                 type: string
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put('/profile', protect, async (req, res, next) => {
  try {
    const { name, avatar, bio, location, skills } = req.body;

    // TODO: Update user profile in database
    /*
    const updatedUser = await query(`
      UPDATE users SET 
        name = $1, avatar = $2, bio = $3, location = $4, skills = $5, updated_at = NOW()
      WHERE id = $6
      RETURNING id, name, email, username, role, verified, avatar, bio, location, skills
    `, [name, avatar, bio, location, JSON.stringify(skills), req.user.id]);
    */

    const updatedUser = {
      ...req.user,
      name: name || req.user.name,
      avatar: avatar || req.user.avatar,
      bio,
      location,
      skills
    };

    return successResponse(res, updatedUser, 'Profile updated successfully');

  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *       404:
 *         description: User not found
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // TODO: Get user from database
    /*
    const userResult = await query(`
      SELECT id, name, username, avatar, verified, member_since, location, bio
      FROM users WHERE id = $1 AND deleted_at IS NULL
    `, [id]);

    if (userResult.rows.length === 0) {
      return notFoundResponse(res, 'User not found');
    }
    */

    // Mock user data
    const user = {
      id,
      name: 'John Doe',
      username: 'johndoe',
      avatar: 'https://example.com/avatar.jpg',
      verified: true,
      memberSince: '2023',
      location: 'New York, USA',
      bio: 'Professional content creator'
    };

    return successResponse(res, user, 'User retrieved successfully');

  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         name: role
 *         schema:
 *           type: string
 *           enum: [buyer, seller, admin]
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       403:
 *         description: Admin access required
 */
router.get('/', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { page = 1, limit = 10, role } = req.query;

    // TODO: Get users with pagination
    /*
    let whereClause = 'WHERE deleted_at IS NULL';
    let params = [];
    
    if (role) {
      whereClause += ' AND role = $1';
      params.push(role);
    }

    const usersResult = await query(`
      SELECT id, name, email, username, role, verified, created_at
      FROM users ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `, [...params, parseInt(limit), (parseInt(page) - 1) * parseInt(limit)]);
    */

    // Mock users data
    const users = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        username: 'johndoe',
        role: 'seller',
        verified: true,
        createdAt: new Date()
      }
    ];

    const pagination = { page: parseInt(page), limit: parseInt(limit), total: 1 };
    return paginatedResponse(res, users, pagination, 'Users retrieved successfully');

  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/users/become-seller:
 *   post:
 *     summary: Register as a seller
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     description: Upgrade a regular user (buyer) to seller status
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bio
 *               - skills
 *               - languages
 *             properties:
 *               bio:
 *                 type: string
 *                 description: Seller's professional bio
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of professional skills
 *               languages:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of languages spoken
 *               location:
 *                 type: string
 *                 description: Seller's location
 *               timezone:
 *                 type: string
 *                 description: Seller's timezone
 *     responses:
 *       200:
 *         description: Successfully registered as seller
 *       400:
 *         description: Invalid input or user is already a seller
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/become-seller',
  protect,
  [
    body('bio').trim().isLength({ min: 50, max: 1000 })
      .withMessage('Bio must be between 50 and 1000 characters'),
    body('skills').isArray({ min: 1, max: 10 })
      .withMessage('Must provide between 1 and 10 skills'),
    body('skills.*').trim().isLength({ min: 2, max: 50 })
      .withMessage('Each skill must be between 2 and 50 characters'),
    body('languages').isArray({ min: 1, max: 5 })
      .withMessage('Must provide between 1 and 5 languages'),
    body('languages.*').trim().isLength({ min: 2, max: 30 })
      .withMessage('Each language must be between 2 and 30 characters'),
    body('location').optional().trim().isLength({ min: 2, max: 100 }),
    body('timezone').optional().trim().isLength({ min: 2, max: 50 })
  ],
  async (req, res) => {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 'Validation error', 400, errors.array());
      }

      const userId = req.user.id;
      const { bio, skills, languages, location, timezone } = req.body;

      // TODO: Replace with actual database query
      /*
      // Check if user is already a seller
      const user = await pool.query(
        'SELECT role FROM users WHERE id = $1',
        [userId]
      );

      if (user.rows[0].role === 'seller') {
        return errorResponse(res, 'User is already a seller', 400);
      }

      // Update user to seller role and add seller info
      const result = await pool.query(
        `UPDATE users 
         SET role = 'seller',
             bio = $1,
             skills = $2,
             languages = $3,
             location = $4,
             timezone = $5,
             updated_at = NOW()
         WHERE id = $6
         RETURNING id, email, username, role, bio, skills, languages, location, timezone`,
        [bio, skills, languages, location, timezone, userId]
      );

      const updatedUser = result.rows[0];
      */

      // Mock response
      const updatedUser = {
        id: userId,
        role: 'seller',
        bio,
        skills,
        languages,
        location,
        timezone,
        updated_at: new Date()
      };

      return successResponse(res, updatedUser, 'Successfully registered as seller');

    } catch (error) {
      console.error('Error in seller registration:', error);
      return errorResponse(res, 'Failed to register as seller', 500);
    }
  }
);

module.exports = router;
