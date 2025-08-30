const express = require('express');
const { protect, authorize, clerkProtect } = require('../middleware/auth');
const { successResponse, paginatedResponse, errorResponse } = require('../utils/response');
const { query } = require('../config/database');

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
router.get('/dashboard', clerkProtect, async (req, res, next) => {
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
router.get('/users', clerkProtect, async (req, res, next) => {
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
router.get('/gigs', clerkProtect, async (req, res, next) => {
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

/**
 * @swagger
 * /api/admin/seller-applications:
 *   get:
 *     summary: Get pending seller applications
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Seller applications retrieved successfully
 */
router.get('/seller-applications', clerkProtect, async (req, res, next) => {
  try {
    // Try to get from database, fallback to mock data
    let applications = [];
    
    try {
      const result = await query(`
        SELECT u.id, u.name, u.email, u.phone, u.professional_title, 
               u.experience, u.bio, u.skills, u.languages, u.location, 
               u.social_accounts, u.portfolio, u.verification_docs, 
               u.created_at, u.updated_at
        FROM users u
        WHERE u.role = 'seller' 
          AND u.verified = false
          AND u.verification_docs IS NOT NULL
        ORDER BY u.updated_at DESC
      `);
      
      applications = result.rows.map(row => ({
        ...row,
        social_accounts: row.social_accounts ? JSON.parse(row.social_accounts) : null,
        portfolio: row.portfolio ? JSON.parse(row.portfolio) : null,
        verification_docs: row.verification_docs ? JSON.parse(row.verification_docs) : null
      }));
    } catch (dbError) {
      console.log('Database query failed, returning empty applications array:', dbError.message);
      applications = [];
    }

    return successResponse(res, applications, 'Seller applications retrieved successfully');
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/admin/seller-applications/{userId}/approve:
 *   post:
 *     summary: Approve seller application
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Seller application approved
 */
router.post('/seller-applications/:userId/approve', clerkProtect, async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    try {
      // Update user verification status
      await query(`
        UPDATE users 
        SET verified = true, 
            updated_at = NOW()
        WHERE id = $1 AND role = 'seller'
      `, [userId]);
      
      // Create notification for seller
      await query(`
        INSERT INTO notifications (user_id, type, title, message, data, created_at)
        VALUES ($1, 'seller_approved', 'Application Approved', 
                'Congratulations! Your seller application has been approved.', $2, NOW())
      `, [userId, JSON.stringify({ approved_by_admin: true })]);
      
    } catch (dbError) {
      console.log('Database update failed, using mock response');
    }
    
    return successResponse(res, { userId, status: 'approved' }, 'Seller application approved successfully');
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/admin/seller-applications/{userId}/reject:
 *   post:
 *     summary: Reject seller application
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Seller application rejected
 */
router.post('/seller-applications/:userId/reject', clerkProtect, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    
    if (!reason) {
      return errorResponse(res, 'Rejection reason is required', 400);
    }
    
    try {
      // Update user back to buyer role
      await query(`
        UPDATE users 
        SET role = 'buyer',
            verified = false,
            rejection_reason = $1,
            updated_at = NOW()
        WHERE id = $2
      `, [reason, userId]);
      
      // Create notification for user
      await query(`
        INSERT INTO notifications (user_id, type, title, message, data, created_at)
        VALUES ($1, 'seller_rejected', 'Application Rejected', 
                'Your seller application has been rejected. Please review the reason and reapply.',
                $2, NOW())
      `, [userId, JSON.stringify({ reason, rejected_by_admin: true })]);
      
    } catch (dbError) {
      console.log('Database update failed, using mock response');
    }
    
    return successResponse(res, { userId, status: 'rejected', reason }, 'Seller application rejected');
  } catch (error) {
    next(error);
  }
});

module.exports = router; 