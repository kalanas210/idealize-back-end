const express = require('express');
const BuyerAnalyticsService = require('../services/buyerAnalyticsService');
const { clerkProtect, authorize } = require('../middleware/auth');
const {
  successResponse,
  paginatedResponse,
  errorResponse
} = require('../utils/response');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     BuyerOverview:
 *       type: object
 *       properties:
 *         totalSpent:
 *           type: number
 *         monthlySpent:
 *           type: number
 *         activeOrders:
 *           type: integer
 *         completedOrders:
 *           type: integer
 *         avgRating:
 *           type: number
 *         totalReviews:
 *           type: integer
 *         savedInfluencers:
 *           type: integer
 *         totalReach:
 *           type: string
 *         engagementRate:
 *           type: string
 *         roi:
 *           type: string
 */

/**
 * @swagger
 * /api/buyer/dashboard/overview:
 *   get:
 *     summary: Get buyer dashboard overview statistics
 *     tags: [Buyer Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dateRange
 *         schema:
 *           type: string
 *           enum: [7days, 30days, 90days, 6months, 1year]
 *           default: 30days
 *         description: Date range for statistics
 *     responses:
 *       200:
 *         description: Buyer overview statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/BuyerOverview'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not a buyer
 */
router.get('/dashboard/overview', 
  // clerkProtect, authorize('buyer'), // Temporarily disabled for testing
  async (req, res, next) => {
  try {
    const { dateRange = '30days' } = req.query;
    const buyerId = req.user?.id || 'test-buyer-id'; // Use test ID if no user

    const overview = await BuyerAnalyticsService.getBuyerOverview(buyerId, dateRange);
    
    return successResponse(res, overview, 'Buyer overview retrieved successfully');
  } catch (error) {
    console.error('Error getting buyer overview:', error);
    return errorResponse(res, 'Failed to get buyer overview', 500);
  }
});

/**
 * @swagger
 * /api/buyer/dashboard/orders:
 *   get:
 *     summary: Get buyer orders with filtering
 *     tags: [Buyer Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, pending, in_progress, completed, cancelled]
 *           default: all
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in gig title or seller name
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
 *         description: Orders retrieved successfully
 */
router.get('/dashboard/orders', 
  // clerkProtect, authorize('buyer'), // Temporarily disabled for testing
  async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    const buyerId = req.user?.id || 'test-buyer-id'; // Use test ID if no user

    const filters = { status, search, page, limit };
    const orders = await BuyerAnalyticsService.getBuyerOrders(buyerId, filters);
    
    const pagination = { page: parseInt(page), limit: parseInt(limit), total: orders.length };
    return paginatedResponse(res, orders, pagination, 'Orders retrieved successfully');
  } catch (error) {
    console.error('Error getting buyer orders:', error);
    return errorResponse(res, 'Failed to get orders', 500);
  }
});

/**
 * @swagger
 * /api/buyer/dashboard/saved-influencers:
 *   get:
 *     summary: Get saved influencers for buyer
 *     tags: [Buyer Dashboard]
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
 *     responses:
 *       200:
 *         description: Saved influencers retrieved successfully
 */
router.get('/dashboard/saved-influencers', 
  // clerkProtect, authorize('buyer'), // Temporarily disabled for testing
  async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const buyerId = req.user?.id || 'test-buyer-id'; // Use test ID if no user

    const savedInfluencers = await BuyerAnalyticsService.getSavedInfluencers(buyerId, parseInt(page), parseInt(limit));
    
    const pagination = { page: parseInt(page), limit: parseInt(limit), total: savedInfluencers.length };
    return paginatedResponse(res, savedInfluencers, pagination, 'Saved influencers retrieved successfully');
  } catch (error) {
    console.error('Error getting saved influencers:', error);
    return errorResponse(res, 'Failed to get saved influencers', 500);
  }
});

/**
 * @swagger
 * /api/buyer/dashboard/analytics:
 *   get:
 *     summary: Get buyer analytics data
 *     tags: [Buyer Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dateRange
 *         schema:
 *           type: string
 *           enum: [7days, 30days, 90days, 6months, 1year]
 *           default: 30days
 *     responses:
 *       200:
 *         description: Analytics data retrieved successfully
 */
router.get('/dashboard/analytics', 
  // clerkProtect, authorize('buyer'), // Temporarily disabled for testing
  async (req, res, next) => {
  try {
    const { dateRange = '30days' } = req.query;
    const buyerId = req.user?.id || 'test-buyer-id'; // Use test ID if no user

    const analyticsData = await BuyerAnalyticsService.getBuyerAnalytics(buyerId, dateRange);
    
    return successResponse(res, analyticsData, 'Analytics data retrieved successfully');
  } catch (error) {
    console.error('Error getting buyer analytics:', error);
    return errorResponse(res, 'Failed to get analytics data', 500);
  }
});

/**
 * @swagger
 * /api/buyer/dashboard/billing:
 *   get:
 *     summary: Get buyer billing and payment history
 *     tags: [Buyer Dashboard]
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
 *     responses:
 *       200:
 *         description: Billing data retrieved successfully
 */
router.get('/dashboard/billing', 
  // clerkProtect, authorize('buyer'), // Temporarily disabled for testing
  async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const buyerId = req.user?.id || 'test-buyer-id'; // Use test ID if no user

    const billingData = await BuyerAnalyticsService.getBuyerBilling(buyerId, parseInt(page), parseInt(limit));
    
    const pagination = { page: parseInt(page), limit: parseInt(limit), total: billingData.length };
    return paginatedResponse(res, billingData, pagination, 'Billing data retrieved successfully');
  } catch (error) {
    console.error('Error getting buyer billing:', error);
    return errorResponse(res, 'Failed to get billing data', 500);
  }
});

/**
 * @swagger
 * /api/buyer/dashboard/activity:
 *   get:
 *     summary: Get recent activity for buyer
 *     tags: [Buyer Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Recent activity retrieved successfully
 */
router.get('/dashboard/activity', 
  // clerkProtect, authorize('buyer'), // Temporarily disabled for testing
  async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const buyerId = req.user?.id || 'test-buyer-id'; // Use test ID if no user

    const activity = await BuyerAnalyticsService.getRecentActivity(buyerId, parseInt(limit));
    
    return successResponse(res, activity, 'Recent activity retrieved successfully');
  } catch (error) {
    console.error('Error getting recent activity:', error);
    return errorResponse(res, 'Failed to get recent activity', 500);
  }
});

/**
 * @swagger
 * /api/buyer/dashboard/saved-influencers/{influencerId}:
 *   post:
 *     summary: Toggle saved influencer status
 *     tags: [Buyer Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: influencerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Influencer saved/unsaved successfully
 */
router.post('/dashboard/saved-influencers/:influencerId', 
  // clerkProtect, authorize('buyer'), // Temporarily disabled for testing
  async (req, res, next) => {
  try {
    const { influencerId } = req.params;
    const buyerId = req.user?.id || 'test-buyer-id'; // Use test ID if no user

    const result = await BuyerAnalyticsService.toggleSavedInfluencer(buyerId, influencerId);
    
    return successResponse(res, result, result.message);
  } catch (error) {
    console.error('Error toggling saved influencer:', error);
    return errorResponse(res, 'Failed to toggle saved influencer', 500);
  }
});

/**
 * @swagger
 * /api/buyer/dashboard/saved-gigs:
 *   get:
 *     summary: Get saved gigs for buyer
 *     tags: [Buyer Dashboard]
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
 *     responses:
 *       200:
 *         description: Saved gigs retrieved successfully
 */
router.get('/dashboard/saved-gigs', 
  // clerkProtect, authorize('buyer'), // Temporarily disabled for testing
  async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const buyerId = req.user?.id || 'test-buyer-id'; // Use test ID if no user

    const savedGigs = await BuyerAnalyticsService.getSavedGigs(buyerId, parseInt(page), parseInt(limit));
    
    const pagination = { page: parseInt(page), limit: parseInt(limit), total: savedGigs.length };
    return paginatedResponse(res, savedGigs, pagination, 'Saved gigs retrieved successfully');
  } catch (error) {
    console.error('Error getting saved gigs:', error);
    return errorResponse(res, 'Failed to get saved gigs', 500);
  }
});

/**
 * @swagger
 * /api/buyer/dashboard/saved-gigs/{gigId}:
 *   post:
 *     summary: Toggle saved gig status
 *     tags: [Buyer Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gigId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Gig saved/unsaved successfully
 */
router.post('/dashboard/saved-gigs/:gigId', 
  // clerkProtect, authorize('buyer'), // Temporarily disabled for testing
  async (req, res, next) => {
  try {
    const { gigId } = req.params;
    const buyerId = req.user?.id || 'test-buyer-id'; // Use test ID if no user

    const result = await BuyerAnalyticsService.toggleSavedGig(buyerId, gigId);
    
    return successResponse(res, result, result.message);
  } catch (error) {
    console.error('Error toggling saved gig:', error);
    return errorResponse(res, 'Failed to toggle saved gig', 500);
  }
});

/**
 * @swagger
 * /api/buyer/dashboard/saved:
 *   get:
 *     summary: Get all saved items (influencers and gigs) for buyer
 *     tags: [Buyer Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: filter
 *         schema:
 *           type: string
 *           enum: [all, influencers, gigs]
 *           default: all
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
 *         description: Saved items retrieved successfully
 */
router.get('/dashboard/saved', 
  // clerkProtect, authorize('buyer'), // Temporarily disabled for testing
  async (req, res, next) => {
  try {
    const { filter = 'all', page = 1, limit = 10 } = req.query;
    const buyerId = req.user?.id || 'test-buyer-id'; // Use test ID if no user

    const savedItems = await BuyerAnalyticsService.getSavedItems(buyerId, filter, parseInt(page), parseInt(limit));
    
    const pagination = { page: parseInt(page), limit: parseInt(limit), total: savedItems.length };
    return paginatedResponse(res, savedItems, pagination, 'Saved items retrieved successfully');
  } catch (error) {
    console.error('Error getting saved items:', error);
    return errorResponse(res, 'Failed to get saved items', 500);
  }
});

/**
 * @swagger
 * /api/buyer/dashboard/performance:
 *   get:
 *     summary: Get buyer performance metrics
 *     tags: [Buyer Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Performance metrics retrieved successfully
 */
router.get('/dashboard/performance', 
  // clerkProtect, authorize('buyer'), // Temporarily disabled for testing
  async (req, res, next) => {
  try {
    const buyerId = req.user?.id || 'test-buyer-id'; // Use test ID if no user

    // Get all performance metrics
    const [overview, analytics, recentActivity] = await Promise.all([
      BuyerAnalyticsService.getBuyerOverview(buyerId),
      BuyerAnalyticsService.getBuyerAnalytics(buyerId, '30days'),
      BuyerAnalyticsService.getRecentActivity(buyerId, 5)
    ]);

    const performance = {
      overview,
      analytics,
      recentActivity,
      // Additional performance metrics
      metrics: {
        totalReach: overview.totalReach,
        engagementRate: overview.engagementRate,
        roi: overview.roi,
        avgOrderValue: overview.totalSpent / (overview.completedOrders || 1),
        completionRate: overview.completedOrders / (overview.completedOrders + overview.activeOrders) * 100,
        satisfactionRate: overview.avgRating * 20 // Convert to percentage
      }
    };
    
    return successResponse(res, performance, 'Performance metrics retrieved successfully');
  } catch (error) {
    console.error('Error getting performance metrics:', error);
    return errorResponse(res, 'Failed to get performance metrics', 500);
  }
});

module.exports = router; 