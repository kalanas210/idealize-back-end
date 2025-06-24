const express = require('express');
const passport = require('passport');
const { successResponse, errorResponse } = require('../utils/response');

const router = express.Router();

// Helper function to check if OAuth is enabled
const isOAuthEnabled = (provider) => {
  const enabledFlag = process.env[`ENABLE_${provider}_AUTH`]?.toLowerCase();
  return enabledFlag === 'true';
};

/**
 * @swagger
 * tags:
 *   name: Social Auth
 *   description: Social authentication endpoints
 */

/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Initiate Google OAuth login
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirects to Google login
 *       400:
 *         description: Google OAuth is not enabled
 */
router.get('/google', (req, res, next) => {
  if (!isOAuthEnabled('GOOGLE')) {
    return errorResponse(res, 'Google OAuth is not enabled', 400);
  }
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })(req, res, next);
});

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Google OAuth callback URL
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirects to frontend with auth token
 *       400:
 *         description: Google OAuth is not enabled
 */
router.get('/google/callback',
  (req, res, next) => {
    if (!isOAuthEnabled('GOOGLE')) {
      return errorResponse(res, 'Google OAuth is not enabled', 400);
    }
    next();
  },
  passport.authenticate('google', { session: false }),
  (req, res) => {
    try {
      // TODO: Generate JWT token
      const token = 'mock-jwt-token';
      
      // Redirect to frontend with token
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/callback?token=${token}`);
    } catch (error) {
      console.error('Error in Google callback:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/error`);
    }
  }
);

/**
 * @swagger
 * /api/auth/google/link:
 *   post:
 *     summary: Link Google account to existing user
 *     tags: [Social Auth]
 *     security:
 *       - bearerAuth: []
 *     description: Links a Google account to an existing authenticated user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - googleToken
 *             properties:
 *               googleToken:
 *                 type: string
 *                 description: Google OAuth access token
 *     responses:
 *       200:
 *         description: Successfully linked Google account
 *       400:
 *         description: Invalid token or account already linked
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Internal server error
 */
router.post('/google/link', async (req, res) => {
  try {
    const { googleToken } = req.body;
    
    if (!googleToken) {
      return errorResponse(res, 'Google token is required', 400);
    }

    // Verify Google token and get user info
    const axios = require('axios');
    const googleResponse = await axios.get(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${googleToken}`);
    
    if (!googleResponse.data) {
      return errorResponse(res, 'Invalid Google token', 400);
    }

    const googleUser = googleResponse.data;

    // TODO: Link Google account to existing user in database
    /*
    const userId = req.user.id; // From auth middleware
    
    // Check if Google ID is already linked to another account
    const existingLink = await pool.query(
      'SELECT id FROM users WHERE google_id = $1 AND id != $2',
      [googleUser.id, userId]
    );
    
    if (existingLink.rows.length > 0) {
      return errorResponse(res, 'This Google account is already linked to another user', 400);
    }
    
    // Link the Google account
    await pool.query(
      'UPDATE users SET google_id = $1, updated_at = NOW() WHERE id = $2',
      [googleUser.id, userId]
    );
    */

    return successResponse(res, 'Google account linked successfully', {
      google_id: googleUser.id,
      google_email: googleUser.email
    });

  } catch (error) {
    console.error('Google link error:', error);
    return errorResponse(res, 'Failed to link Google account', 500);
  }
});

/**
 * @swagger
 * /api/auth/google/unlink:
 *   post:
 *     summary: Unlink Google account from user
 *     tags: [Social Auth]
 *     security:
 *       - bearerAuth: []
 *     description: Removes the Google account link from the authenticated user
 *     responses:
 *       200:
 *         description: Successfully unlinked Google account
 *       401:
 *         description: Authentication required
 *       404:
 *         description: No Google account linked
 *       500:
 *         description: Internal server error
 */
router.post('/google/unlink', async (req, res) => {
  try {
    // TODO: Unlink Google account from user in database
    /*
    const userId = req.user.id; // From auth middleware
    
    const result = await pool.query(
      'UPDATE users SET google_id = NULL, updated_at = NOW() WHERE id = $1 AND google_id IS NOT NULL RETURNING id',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return errorResponse(res, 'No Google account linked to this user', 404);
    }
    */

    return successResponse(res, 'Google account unlinked successfully');

  } catch (error) {
    console.error('Google unlink error:', error);
    return errorResponse(res, 'Failed to unlink Google account', 500);
  }
});

module.exports = router; 