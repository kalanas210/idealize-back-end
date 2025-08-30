const express = require('express');
const { query } = require('../config/database');
const { protect, authorize, clerkProtect } = require('../middleware/auth');
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
router.get('/profile', clerkProtect, async (req, res, next) => {
  try {
    // Try to get user from database first
    try {
      const result = await query(
        `SELECT id, email, username, name, role, verified, avatar, bio, location, skills, 
                professional_title, experience, languages, phone, country, timezone,
                social_accounts, verification_docs, city, created_at, updated_at
         FROM users WHERE id = $1`,
        [req.user.id]
      );

      if (result.rows.length > 0) {
        const dbUser = result.rows[0];
        console.log('📋 Profile endpoint - User found in database:', dbUser);
        return successResponse(res, dbUser, 'User profile retrieved successfully');
      }
    } catch (dbError) {
      console.log('📋 Profile endpoint - Database query failed, using mock user:', dbError.message);
    }

    // Fallback to mock user if database query fails
    console.log('📋 Profile endpoint - Returning mock user:', req.user);
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
router.put('/profile', clerkProtect, async (req, res, next) => {
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
  clerkProtect,
  [
    body('bio').trim().isLength({ min: 20, max: 2000 })
      .withMessage('Bio must be between 20 and 2000 characters'),
    body('skills').isArray({ min: 1, max: 10 })
      .withMessage('Must provide between 1 and 10 skills'),
    body('skills.*').trim().isLength({ min: 2, max: 50 })
      .withMessage('Each skill must be between 2 and 50 characters'),
    body('languages').isArray({ min: 1, max: 5 })
      .withMessage('Must provide between 1 and 5 languages'),
    body('languages.*').trim().isLength({ min: 2, max: 30 })
      .withMessage('Each language must be between 2 and 30 characters'),
    body('location').optional().trim().isLength({ min: 2, max: 100 }),
    body('timezone').optional().trim().isLength({ min: 2, max: 50 }),
    body('firstName').optional().trim().isLength({ min: 1, max: 50 }),
    body('lastName').optional().trim().isLength({ min: 1, max: 50 }),
    body('email').optional().isEmail(),
    body('phone').optional().trim().isLength({ min: 5, max: 20 }),
    body('country').optional().trim().isLength({ min: 2, max: 100 }),
    body('city').optional().trim().isLength({ min: 2, max: 100 }),
    body('professionalTitle').optional().trim().isLength({ min: 2, max: 100 }),
    body('experience').optional().trim().isLength({ min: 1, max: 50 }),
    body('avatar').optional().isString(),
    body('socialAccounts').optional().isObject(),
    body('portfolio').optional().isArray(),
    body('verificationDocs').optional().isArray()
  ],
  async (req, res) => {
    try {
      // Debug: Log the received data
      console.log('📝 Received seller registration data:');
      console.log('Body:', JSON.stringify(req.body, null, 2));
      console.log('User:', req.user);
      
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('❌ Validation errors:', errors.array());
        return errorResponse(res, 'Validation error', 400, errors.array());
      }

      const userId = req.user.id;
      const {
        firstName, lastName, email, bio, skills, languages, location, timezone,
        phone, country, city, professionalTitle, experience, avatar,
        socialAccounts, portfolio, verificationDocs
      } = req.body;
      
      // Combine firstName and lastName for name field
      const fullName = `${firstName || ''} ${lastName || ''}`.trim() || req.user.name;

      // Check if user is already a seller
      if (req.user.role === 'seller') {
        return errorResponse(res, 'User is already a seller', 400);
      }

             // Update user to seller role and add seller info
       let updatedUser;
       
       try {
         // First, ensure user exists in database
         let userResult = await query(
           'SELECT * FROM users WHERE id = $1',
           [userId]
         );
         
         if (userResult.rows.length === 0) {
           // Create new user with seller fields if doesn't exist
           // Generate a unique username to avoid conflicts
           let username = req.user.username || req.user.email?.split('@')[0] || 'user';
           
           // Check if username already exists and generate a unique one
           let usernameExists = true;
           let counter = 1;
           let originalUsername = username;
           
           while (usernameExists) {
             const usernameCheck = await query(
               'SELECT id FROM users WHERE username = $1',
               [username]
             );
             
             if (usernameCheck.rows.length === 0) {
               usernameExists = false;
             } else {
               username = `${originalUsername}${counter}`;
               counter++;
             }
           }
           
           console.log(`📝 Creating new user with username: ${username}`);
           
           await query(
             `INSERT INTO users (id, email, username, name, role, verified, phone, bio, skills, languages, location, timezone, avatar, country, city, professional_title, experience, social_accounts, verification_docs)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
             [
               userId,
               email || req.user.email,
               username,
               fullName,
               'seller',
               false,
               phone,
               bio,
               skills,
               languages,
               location || `${city}, ${country}`,
               timezone,
               avatar,
               country,
               city,
               professionalTitle,
               experience,
               socialAccounts ? JSON.stringify(socialAccounts) : null,
               verificationDocs ? JSON.stringify(verificationDocs) : null
             ]
           );
         } else {
           // Update existing user with all seller fields
           console.log(`📝 Updating existing user: ${userId} to seller role`);
           
           await query(
             `UPDATE users 
              SET role = 'seller',
                  name = COALESCE($1, name),
                  phone = $2,
                  bio = $3,
                  skills = $4,
                  languages = $5,
                  location = $6,
                  timezone = $7,
                  avatar = COALESCE($8, avatar),
                  country = $9,
                  city = $10,
                  professional_title = $11,
                  experience = $12,
                  social_accounts = $13,
                  verification_docs = $14,
                  updated_at = NOW()
              WHERE id = $15`,
             [
               fullName,
               phone,
               bio,
               skills,
               languages,
               location || `${city}, ${country}`,
               timezone,
               avatar,
               country,
               city,
               professionalTitle,
               experience,
               socialAccounts ? JSON.stringify(socialAccounts) : null,
               verificationDocs ? JSON.stringify(verificationDocs) : null,
               userId
             ]
           );
           
           console.log(`✅ Successfully updated user ${userId} to seller`);
           
         }
         
         // Get updated user data
         const result = await query(
           'SELECT * FROM users WHERE id = $1',
           [userId]
         );
         
         updatedUser = result.rows[0];
         
         // If verification docs were provided, create admin notification
         if (verificationDocs && verificationDocs.length > 0) {
           await query(
             `INSERT INTO notifications (user_id, type, title, message, data, created_at)
              SELECT id, 'seller_verification', 'New Seller Verification', 
                     'New seller application requires document verification',
                     $1::jsonb, NOW()
              FROM users WHERE role = 'admin' LIMIT 1`,
             [JSON.stringify({ 
               sellerId: userId, 
               sellerName: fullName, 
               documents: verificationDocs,
               applicationId: userId
             })]
           );
         }
         
         console.log('✅ User successfully updated to seller in database');
         
       } catch (dbError) {
         console.error('❌ Database error during seller registration:', dbError);
         throw new Error(`Failed to register as seller: ${dbError.message}`);
       }

      return successResponse(res, updatedUser, 'Successfully registered as seller. Your application is pending verification.');

    } catch (error) {
      console.error('Error in seller registration:', error);
      return errorResponse(res, 'Failed to register as seller', 500);
    }
  }
);

module.exports = router;
