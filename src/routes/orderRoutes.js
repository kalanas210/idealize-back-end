import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { validatePagination } from '../middleware/validation.js';
import { Order } from '../models/index.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';

const router = express.Router();

// Get user's orders
router.get('/', authenticateToken, validatePagination, asyncHandler(async (req, res) => {
  const { page, limit, skip } = req.pagination;
  const { status, type } = req.query;

  let query = {};
  
  if (type === 'buying') {
    query.buyer = req.user._id;
  } else if (type === 'selling') {
    query.seller = req.user._id;
  } else {
    // Return both buying and selling orders
    query.$or = [
      { buyer: req.user._id },
      { seller: req.user._id }
    ];
  }

  if (status) query.status = status;

  const orders = await Order.find(query)
    .populate('buyer', 'username displayName avatar')
    .populate('seller', 'username displayName avatar')
    .populate('gig', 'title images')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await Order.countDocuments(query);

  res.json({
    success: true,
    data: {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

// Create order
router.post('/', authenticateToken, asyncHandler(async (req, res) => {
  const orderData = {
    ...req.body,
    buyer: req.user._id
  };

  const order = await Order.create(orderData);
  await order.populate(['buyer', 'seller', 'gig']);

  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    data: { order }
  });
}));

// Get order by ID
router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('buyer', 'username displayName avatar')
    .populate('seller', 'username displayName avatar')
    .populate('gig', 'title images');

  if (!order) {
    throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
  }

  // Check access
  if (!order.buyer.equals(req.user._id) && !order.seller.equals(req.user._id) && req.user.role !== 'admin') {
    throw new AppError('Access denied', 403, 'ACCESS_DENIED');
  }

  res.json({
    success: true,
    data: { order }
  });
}));

// Update order status
router.patch('/:id/status', authenticateToken, asyncHandler(async (req, res) => {
  const { status } = req.body;
  
  const order = await Order.findById(req.params.id);
  
  if (!order) {
    throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
  }

  // Check permissions based on status change
  if (status === 'accepted' && !order.seller.equals(req.user._id)) {
    throw new AppError('Only seller can accept orders', 403, 'ACCESS_DENIED');
  }

  order.status = status;
  await order.save();

  res.json({
    success: true,
    message: 'Order status updated',
    data: { order }
  });
}));

export default router;
