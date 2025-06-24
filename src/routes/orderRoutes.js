const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const { protect, authorize } = require('../middleware/auth');
const { successResponse, createdResponse, paginatedResponse, notFoundResponse } = require('../utils/response');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Order:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         gigId:
 *           type: string
 *           format: uuid
 *         buyerId:
 *           type: string
 *           format: uuid
 *         sellerId:
 *           type: string
 *           format: uuid
 *         package:
 *           type: string
 *           enum: [basic, standard, premium]
 *         price:
 *           type: number
 *         status:
 *           type: string
 *           enum: [pending, in_progress, completed, cancelled, disputed]
 *         deliveryTime:
 *           type: integer
 *         requirements:
 *           type: object
 *         deliverables:
 *           type: array
 *           items:
 *             type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - gigId
 *               - package
 *               - requirements
 *             properties:
 *               gigId:
 *                 type: string
 *                 format: uuid
 *               package:
 *                 type: string
 *                 enum: [basic, standard, premium]
 *               requirements:
 *                 type: object
 *                 description: Custom requirements from buyer
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Gig not found
 */
router.post('/', protect, async (req, res, next) => {
  try {
    const { gigId, package, requirements } = req.body;
    const orderId = uuidv4();

    // TODO: Get gig details and create order
    /*
    const gigResult = await query('SELECT * FROM gigs WHERE id = $1 AND status = $2', [gigId, 'active']);
    if (gigResult.rows.length === 0) {
      return notFoundResponse(res, 'Gig not found or not available');
    }

    const gig = gigResult.rows[0];
    const packageDetails = gig.packages.find(p => p.id === package);
    
    const newOrder = await query(`
      INSERT INTO orders (id, gig_id, buyer_id, seller_id, package, price, delivery_time, requirements, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING *
    `, [orderId, gigId, req.user.id, gig.seller_id, package, packageDetails.price, packageDetails.deliveryTime, JSON.stringify(requirements), 'pending']);
    */

    // Mock response
    const newOrder = {
      id: orderId,
      gigId,
      buyerId: req.user.id,
      package,
      requirements,
      status: 'pending',
      price: 299,
      deliveryTime: 3,
      createdAt: new Date()
    };

    return createdResponse(res, newOrder, 'Order created successfully');

  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get user orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in_progress, completed, cancelled, disputed]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [buying, selling]
 *         description: Filter orders by buyer or seller perspective
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
router.get('/', protect, async (req, res, next) => {
  try {
    const { status, type, page = 1, limit = 10 } = req.query;

    // TODO: Get orders with filtering
    /*
    let whereConditions = [];
    let params = [];
    let paramCount = 0;

    if (type === 'buying') {
      paramCount++;
      whereConditions.push(`o.buyer_id = $${paramCount}`);
      params.push(req.user.id);
    } else if (type === 'selling') {
      paramCount++;
      whereConditions.push(`o.seller_id = $${paramCount}`);
      params.push(req.user.id);
    } else {
      paramCount++;
      whereConditions.push(`(o.buyer_id = $${paramCount} OR o.seller_id = $${paramCount})`);
      params.push(req.user.id);
    }

    if (status) {
      paramCount++;
      whereConditions.push(`o.status = $${paramCount}`);
      params.push(status);
    }

    const ordersResult = await query(`
      SELECT o.*, g.title as gig_title, u.name as other_party_name
      FROM orders o
      INNER JOIN gigs g ON o.gig_id = g.id
      INNER JOIN users u ON (CASE WHEN o.buyer_id = $1 THEN o.seller_id ELSE o.buyer_id END) = u.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY o.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `, [...params, parseInt(limit), (parseInt(page) - 1) * parseInt(limit)]);
    */

    // Mock orders
    const orders = [
      {
        id: uuidv4(),
        gigId: uuidv4(),
        gigTitle: 'Tech Review Video',
        buyerId: req.user.id,
        sellerId: 'seller-id',
        otherPartyName: 'TechGuru Mike',
        status: 'in_progress',
        price: 299,
        package: 'standard',
        createdAt: new Date()
      }
    ];

    const pagination = { page: parseInt(page), limit: parseInt(limit), total: 1 };
    return paginatedResponse(res, orders, pagination, 'Orders retrieved successfully');

  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get order details
 *     tags: [Orders]
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
 *         description: Order details retrieved successfully
 *       404:
 *         description: Order not found
 *       403:
 *         description: Not authorized to view this order
 */
router.get('/:id', protect, async (req, res, next) => {
  try {
    const { id } = req.params;

    // TODO: Get order details with authorization check
    /*
    const orderResult = await query(`
      SELECT o.*, g.title as gig_title, g.description as gig_description,
             buyer.name as buyer_name, seller.name as seller_name
      FROM orders o
      INNER JOIN gigs g ON o.gig_id = g.id
      INNER JOIN users buyer ON o.buyer_id = buyer.id
      INNER JOIN users seller ON o.seller_id = seller.id
      WHERE o.id = $1 AND (o.buyer_id = $2 OR o.seller_id = $2)
    `, [id, req.user.id]);

    if (orderResult.rows.length === 0) {
      return notFoundResponse(res, 'Order not found or access denied');
    }
    */

    // Mock order details
    const orderDetails = {
      id,
      gigTitle: 'Professional Tech Review Video',
      status: 'in_progress',
      price: 299,
      package: 'standard',
      buyerName: 'John Doe',
      sellerName: 'TechGuru Mike',
      requirements: { productName: 'iPhone 15', specifications: 'Latest model' },
      deliverables: [],
      createdAt: new Date(),
      expectedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
    };

    return successResponse(res, orderDetails, 'Order details retrieved successfully');

  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/orders/{id}/status:
 *   put:
 *     summary: Update order status
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [in_progress, completed, cancelled]
 *               message:
 *                 type: string
 *                 description: Optional message for status change
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *       403:
 *         description: Not authorized to update this order
 *       404:
 *         description: Order not found
 */
router.put('/:id/status', protect, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, message } = req.body;

    // TODO: Update order status with proper authorization
    /*
    const orderCheck = await query(
      'SELECT seller_id, buyer_id, status as current_status FROM orders WHERE id = $1',
      [id]
    );

    if (orderCheck.rows.length === 0) {
      return notFoundResponse(res, 'Order not found');
    }

    const order = orderCheck.rows[0];
    
    // Only seller can mark as in_progress or completed
    // Only buyer can cancel before in_progress
    const canUpdate = (
      (req.user.id === order.seller_id && ['in_progress', 'completed'].includes(status)) ||
      (req.user.id === order.buyer_id && status === 'cancelled' && order.current_status === 'pending')
    );

    if (!canUpdate) {
      return forbiddenResponse(res, 'Not authorized to change order status');
    }

    await query(
      'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, id]
    );
    */

    const updatedOrder = {
      id,
      status,
      message,
      updatedAt: new Date()
    };

    return successResponse(res, updatedOrder, 'Order status updated successfully');

  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/orders/{id}/deliver:
 *   post:
 *     summary: Submit delivery for an order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - deliverables
 *             properties:
 *               deliverables:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: URLs or file paths to deliverables
 *               message:
 *                 type: string
 *                 description: Delivery message to buyer
 *     responses:
 *       200:
 *         description: Delivery submitted successfully
 *       403:
 *         description: Only seller can submit delivery
 *       404:
 *         description: Order not found
 */
router.post('/:id/deliver', protect, authorize('seller'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { deliverables, message } = req.body;

    // TODO: Submit delivery
    /*
    const orderCheck = await query(
      'SELECT seller_id FROM orders WHERE id = $1 AND status = $2',
      [id, 'in_progress']
    );

    if (orderCheck.rows.length === 0 || orderCheck.rows[0].seller_id !== req.user.id) {
      return forbiddenResponse(res, 'Not authorized or order not in progress');
    }

    await query(
      'UPDATE orders SET deliverables = $1, delivery_message = $2, status = $3, delivered_at = NOW(), updated_at = NOW() WHERE id = $4',
      [JSON.stringify(deliverables), message, 'completed', id]
    );
    */

    const delivery = {
      orderId: id,
      deliverables,
      message,
      deliveredAt: new Date()
    };

    return successResponse(res, delivery, 'Delivery submitted successfully');

  } catch (error) {
    next(error);
  }
});

module.exports = router;
