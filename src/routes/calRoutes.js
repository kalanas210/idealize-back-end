const express = require('express');
const router = express.Router();
const CalService = require('../services/calService');
const { protect, authorize } = require('../middleware/auth');
const { successResponse, errorResponse } = require('../utils/response');

const calService = new CalService();

/**
 * @swagger
 * /api/cal/health:
 *   get:
 *     summary: Check Cal.com service health
 *     tags: [Cal.com]
 *     responses:
 *       200:
 *         description: Service health status
 */
router.get('/health', async (req, res) => {
  try {
    const isConfigured = calService.isConfigured();
    
    return successResponse(res, {
      service: 'Cal.com',
      configured: isConfigured,
      status: isConfigured ? 'ready' : 'not_configured',
      timestamp: new Date().toISOString()
    }, 'Cal.com service health check');
  } catch (error) {
    return errorResponse(res, 'Health check failed', 500);
  }
});

/**
 * @swagger
 * /api/cal/booking-link/{sellerId}:
 *   get:
 *     summary: Get booking link for a seller
 *     tags: [Cal.com]
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking link generated successfully
 */
router.get('/booking-link/:sellerId', async (req, res) => {
  try {
    const { sellerId } = req.params;
    
    // In a real implementation, you'd fetch seller data from database
    const sellerData = {
      id: sellerId,
      name: 'Sample Seller',
      username: process.env.CAL_USERNAME || 'demo'
    };

    const result = await calService.createBookingLink(sellerData);
    
    if (!result.success) {
      return errorResponse(res, result.error, 400);
    }

    return successResponse(res, result, 'Booking link generated successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to generate booking link', 500);
  }
});

/**
 * @swagger
 * /api/cal/available-slots:
 *   get:
 *     summary: Get available time slots for a seller
 *     tags: [Cal.com]
 *     parameters:
 *       - in: query
 *         name: sellerUsername
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: duration
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Available slots retrieved successfully
 */
router.get('/available-slots', async (req, res) => {
  try {
    const { sellerUsername, date, duration = 30 } = req.query;
    
    if (!sellerUsername || !date) {
      return errorResponse(res, 'sellerUsername and date are required', 400);
    }

    const result = await calService.getAvailableSlots(sellerUsername, date, duration);
    
    if (!result.success) {
      return errorResponse(res, result.error, 400);
    }

    return successResponse(res, result, 'Available slots retrieved successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to get available slots', 500);
  }
});

/**
 * @swagger
 * /api/cal/book:
 *   post:
 *     summary: Create a new meeting booking
 *     tags: [Cal.com]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventTypeId
 *               - startTime
 *               - endTime
 *               - buyerEmail
 *               - buyerName
 *               - gigId
 *               - sellerId
 *             properties:
 *               eventTypeId:
 *                 type: string
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               buyerEmail:
 *                 type: string
 *                 format: email
 *               buyerName:
 *                 type: string
 *               gigId:
 *                 type: string
 *               sellerId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Booking created successfully
 */
router.post('/book', protect, async (req, res) => {
  try {
    const {
      eventTypeId,
      startTime,
      endTime,
      buyerEmail,
      buyerName,
      gigId,
      sellerId
    } = req.body;

    // Validate required fields
    if (!eventTypeId || !startTime || !endTime || !buyerEmail || !buyerName || !gigId || !sellerId) {
      return errorResponse(res, 'All required fields must be provided', 400);
    }

    const bookingData = {
      eventTypeId,
      startTime,
      endTime,
      buyerEmail,
      buyerName,
      gigId,
      sellerId,
      buyerId: req.user.id
    };

    const result = await calService.createBooking(bookingData);
    
    if (!result.success) {
      return errorResponse(res, result.error, 400);
    }

    return successResponse(res, result, 'Meeting booked successfully', 201);
  } catch (error) {
    return errorResponse(res, 'Failed to create booking', 500);
  }
});

/**
 * @swagger
 * /api/cal/bookings/{bookingId}:
 *   get:
 *     summary: Get booking details
 *     tags: [Cal.com]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking details retrieved successfully
 */
router.get('/bookings/:bookingId', protect, async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    const result = await calService.getBooking(bookingId);
    
    if (!result.success) {
      return errorResponse(res, result.error, 400);
    }

    return successResponse(res, result, 'Booking details retrieved successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to get booking details', 500);
  }
});

/**
 * @swagger
 * /api/cal/bookings/{bookingId}/cancel:
 *   delete:
 *     summary: Cancel a booking
 *     tags: [Cal.com]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 */
router.delete('/bookings/:bookingId/cancel', protect, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body;
    
    const result = await calService.cancelBooking(bookingId, reason);
    
    if (!result.success) {
      return errorResponse(res, result.error, 400);
    }

    return successResponse(res, result, 'Booking cancelled successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to cancel booking', 500);
  }
});

/**
 * @swagger
 * /api/cal/event-types/{sellerUsername}:
 *   get:
 *     summary: Get seller's event types
 *     tags: [Cal.com]
 *     parameters:
 *       - in: path
 *         name: sellerUsername
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event types retrieved successfully
 */
router.get('/event-types/:sellerUsername', async (req, res) => {
  try {
    const { sellerUsername } = req.params;
    
    const result = await calService.getEventTypes(sellerUsername);
    
    if (!result.success) {
      return errorResponse(res, result.error, 400);
    }

    return successResponse(res, result, 'Event types retrieved successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to get event types', 500);
  }
});

/**
 * @swagger
 * /api/cal/embed/{sellerUsername}:
 *   get:
 *     summary: Get embed code for seller's booking page
 *     tags: [Cal.com]
 *     parameters:
 *       - in: path
 *         name: sellerUsername
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: eventTypeId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Embed code generated successfully
 */
router.get('/embed/:sellerUsername', async (req, res) => {
  try {
    const { sellerUsername } = req.params;
    const { eventTypeId } = req.query;
    
    const embedCode = calService.generateEmbedCode(sellerUsername, eventTypeId);
    
    if (!embedCode) {
      return errorResponse(res, 'Failed to generate embed code', 400);
    }

    return successResponse(res, embedCode, 'Embed code generated successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to generate embed code', 500);
  }
});

module.exports = router;
