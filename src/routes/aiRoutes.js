const express = require('express');
const { body, validationResult } = require('express-validator');
const aiService = require('../services/aiService');
const { successResponse, badRequestResponse, errorResponse } = require('../utils/response');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     AIQueryRequest:
 *       type: object
 *       required:
 *         - userQuery
 *       properties:
 *         userQuery:
 *           type: string
 *           description: Natural language query describing the campaign needs
 *           example: "I want to promote cricket shoes to 18-30 year-old men in Sri Lanka"
 *     
 *     Creator:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Creator unique identifier
 *         name:
 *           type: string
 *           description: Creator's full name
 *         username:
 *           type: string
 *           description: Creator's username
 *         avatar:
 *           type: string
 *           description: Creator's profile image URL
 *         verified:
 *           type: boolean
 *           description: Whether the creator is verified
 *         platform:
 *           type: string
 *           description: Social media platform (YouTube, Instagram, etc.)
 *         social_username:
 *           type: string
 *           description: Social media username
 *         social_url:
 *           type: string
 *           description: Social media profile URL
 *         followers_count:
 *           type: integer
 *           description: Number of followers
 *         location:
 *           type: string
 *           description: Creator's location
 *         bio:
 *           type: string
 *           description: Creator's bio
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *           description: Creator's skills
 *         member_since:
 *           type: string
 *           description: Year joined
 *         gig:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               description: Gig ID
 *             title:
 *               type: string
 *               description: Gig title
 *             price:
 *               type: number
 *               description: Gig price
 *             rating:
 *               type: number
 *               description: Gig rating
 *             reviews:
 *               type: integer
 *               description: Number of reviews
 *         stats:
 *           type: object
 *           description: Creator statistics
 *     
 *     AIQueryResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             query:
 *               type: string
 *               description: The original user query
 *             recommendations:
 *               type: string
 *               description: AI-generated recommendations in markdown format
 *             creatorsAnalyzed:
 *               type: integer
 *               description: Number of creators analyzed
 *             recommendedCreators:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Creator'
 *               description: Top 3 recommended creators with detailed information
 *         timestamp:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/ai/ask:
 *   post:
 *     summary: Ask AI for creator recommendations
 *     tags: [AI]
 *     description: Use AI to find the best content creators for your campaign based on natural language description
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AIQueryRequest'
 *     responses:
 *       200:
 *         description: AI recommendations generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AIQueryResponse'
 *       400:
 *         description: Invalid request or missing query
 *       500:
 *         description: AI service error
 */
router.post('/ask', [
  body('userQuery')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Query must be between 10 and 500 characters')
    .matches(/^[a-zA-Z0-9\s\-_.,!?()]+$/)
    .withMessage('Query contains invalid characters')
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return badRequestResponse(res, 'Invalid query format', errors.array());
    }

    const { userQuery } = req.body;

    // Process the query with AI (will use mock data if OpenAI is not configured)
    const result = await aiService.processUserQuery(userQuery);

    return successResponse(res, result, 'AI recommendations generated successfully');

  } catch (error) {
    console.error('AI route error:', error);
    
    // Handle specific OpenAI errors
    if (error.message.includes('API key')) {
      return errorResponse(res, 'AI service configuration error. Please contact support.', 503);
    }
    
    if (error.message.includes('rate limit')) {
      return errorResponse(res, 'AI service is temporarily unavailable due to high demand. Please try again later.', 429);
    }

    return errorResponse(res, 'Failed to generate AI recommendations. Please try again.', 500);
  }
});

/**
 * @swagger
 * /api/ai/health:
 *   get:
 *     summary: Check AI service health
 *     tags: [AI]
 *     description: Verify if the AI service is properly configured and available
 *     responses:
 *       200:
 *         description: AI service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     openaiConfigured:
 *                       type: boolean
 *                     databaseConnected:
 *                       type: boolean
 *       503:
 *         description: AI service is not available
 */
router.get('/health', async (req, res, next) => {
  try {
    const healthStatus = {
      openaiConfigured: !!process.env.OPENAI_API_KEY,
      openaiKeyLength: process.env.OPENAI_API_KEY?.length || 0,
      databaseConnected: true, // Will be false if DB connection fails
      timestamp: new Date().toISOString()
    };

    // Test database connection
    try {
      const { query } = require('../config/database');
      await query('SELECT 1');
    } catch (dbError) {
      healthStatus.databaseConnected = false;
    }

    // Always return success, even if OpenAI is not configured
    return successResponse(res, healthStatus, 'AI service health check completed');

  } catch (error) {
    console.error('AI health check error:', error);
    return errorResponse(res, 'AI service health check failed', 500);
  }
});

module.exports = router; 