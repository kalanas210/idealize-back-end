const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { successResponse, paginatedResponse } = require('../utils/response');

const router = express.Router();

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Get admin dashboard stats
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats retrieved
 */
router.get('/dashboard', protect, authorize('admin'), async (req, res, next) => {
  try {
    // TODO: Get dashboard statistics
    const stats = {
      totalUsers: 1250,
      totalGigs: 486,
      totalOrders: 2340,
      totalRevenue: 125000,
      activeUsers: 856,
      pendingOrders: 23
    };

    return successResponse(res, stats);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users for admin
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 */
router.get('/users', protect, authorize('admin'), async (req, res, next) => {
  try {
    // TODO: Get users with admin details
    const users = [{
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'seller',
      verified: true,
      status: 'active',
      createdAt: new Date()
    }];

    const pagination = { page: 1, limit: 10, total: 1 };
    return paginatedResponse(res, users, pagination);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/admin/gigs:
 *   get:
 *     summary: Get all gigs for admin review
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Gigs retrieved successfully
 */
router.get('/gigs', protect, authorize('admin'), async (req, res, next) => {
  try {
    // TODO: Get gigs for admin review
    const gigs = [{
      id: '1',
      title: 'Tech Review Service',
      seller: 'TechGuru Mike',
      status: 'pending_review',
      createdAt: new Date()
    }];

    const pagination = { page: 1, limit: 10, total: 1 };
    return paginatedResponse(res, gigs, pagination);
  } catch (error) {
    next(error);
  }
});

module.exports = router; 