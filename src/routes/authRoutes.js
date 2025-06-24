const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const { generateTokens, verifyRefreshToken } = require('../utils/jwt');
const { validate } = require('../utils/validation');
const { protect } = require('../middleware/auth');
const {
  successResponse,
  createdResponse,
  badRequestResponse,
  unauthorizedResponse,
  conflictResponse,
  notFoundResponse
} = require('../utils/response');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - username
 *         - password
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: User unique identifier
 *         name:
 *           type: string
 *           description: User's full name
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         username:
 *           type: string
 *           description: User's unique username
 *         role:
 *           type: string
 *           enum: [buyer, seller, admin]
 *           description: User's role in the platform
 *         verified:
 *           type: boolean
 *           description: Whether user's email is verified
 *         avatar:
 *           type: string
 *           description: URL to user's profile picture
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Account creation timestamp
 *     
 *     AuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             user:
 *               $ref: '#/components/schemas/User'
 *             tokens:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *                 tokenType:
 *                   type: string
 *                 expiresIn:
 *                   type: string
 *         timestamp:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - username
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               username:
 *                 type: string
 *                 example: "johndoe"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "Password123"
 *               role:
 *                 type: string
 *                 enum: [buyer, seller]
 *                 example: "buyer"
 *     responses:
 *       201:
 *         description: User successfully registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error or bad request
 *       409:
 *         description: User already exists
 */
router.post('/register', validate.register, async (req, res, next) => {
  try {
    const { name, email, username, password, role = 'buyer' } = req.body;

    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      return conflictResponse(res, 'User with this email or username already exists');
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate user ID
    const userId = uuidv4();

    // TODO: Insert user into database (placeholder for DB team)
    /*
    const newUser = await query(
      `INSERT INTO users (id, name, email, username, password_hash, role, verified, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING id, name, email, username, role, verified, avatar, created_at`,
      [userId, name, email, username, hashedPassword, role, false]
    );
    */

    // Mock response for development (remove when DB is ready)
    const newUser = {
      rows: [{
        id: userId,
        name,
        email,
        username,
        role,
        verified: false,
        avatar: null,
        created_at: new Date()
      }]
    };

    const user = newUser.rows[0];

    // Generate tokens
    const tokens = generateTokens(user);

    // Remove sensitive data
    delete user.password_hash;

    return createdResponse(res, {
      user,
      tokens
    }, 'User registered successfully');

  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "Password123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', validate.login, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // TODO: Find user in database (placeholder for DB team)
    /*
    const userResult = await query(
      'SELECT id, name, email, username, password_hash, role, verified, avatar, created_at FROM users WHERE email = $1 AND deleted_at IS NULL',
      [email]
    );
    */

    // Mock user data for development (remove when DB is ready)
    const userResult = {
      rows: email === 'test@example.com' ? [{
        id: uuidv4(),
        name: 'Test User',
        email: 'test@example.com',
        username: 'testuser',
        password_hash: await bcrypt.hash('password', 12),
        role: 'seller',
        verified: true,
        avatar: null,
        created_at: new Date()
      }] : []
    };

    if (userResult.rows.length === 0) {
      return unauthorizedResponse(res, 'Invalid email or password');
    }

    const user = userResult.rows[0];

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return unauthorizedResponse(res, 'Invalid email or password');
    }

    // Generate tokens
    const tokens = generateTokens(user);

    // Remove sensitive data
    delete user.password_hash;

    return successResponse(res, {
      user,
      tokens
    }, 'Login successful');

  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     tokens:
 *                       type: object
 *                       properties:
 *                         accessToken:
 *                           type: string
 *                         refreshToken:
 *                           type: string
 *                         tokenType:
 *                           type: string
 *                         expiresIn:
 *                           type: string
 *       401:
 *         description: Invalid refresh token
 *       404:
 *         description: User not found
 */
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return badRequestResponse(res, 'Refresh token is required');
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // TODO: Find user in database (placeholder for DB team)
    /*
    const userResult = await query(
      'SELECT id, name, email, username, role, verified, avatar, created_at FROM users WHERE id = $1 AND deleted_at IS NULL',
      [decoded.id]
    );
    */

    // Mock user data for development
    const userResult = {
      rows: [{
        id: decoded.id,
        name: 'Test User',
        email: 'test@example.com',
        username: 'testuser',
        role: 'seller',
        verified: true,
        avatar: null,
        created_at: new Date()
      }]
    };

    if (userResult.rows.length === 0) {
      return notFoundResponse(res, 'User not found');
    }

    const user = userResult.rows[0];

    // Generate new tokens
    const tokens = generateTokens(user);

    return successResponse(res, { tokens }, 'Token refreshed successfully');

  } catch (error) {
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      return unauthorizedResponse(res, 'Invalid or expired refresh token');
    }
    next(error);
  }
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Not authenticated
 */
router.post('/logout', protect, async (req, res, next) => {
  try {
    // TODO: Add token to blacklist or remove from database
    // For now, just return success (client should remove token)
    
    return successResponse(res, null, 'Logout successful');
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authenticated
 */
router.get('/me', protect, async (req, res, next) => {
  try {
    // User is already attached to req by protect middleware
    return successResponse(res, req.user, 'User profile retrieved successfully');
  } catch (error) {
    next(error);
  }
});

module.exports = router; 