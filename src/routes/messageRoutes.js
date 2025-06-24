const express = require('express');
const { protect } = require('../middleware/auth');
const { successResponse, createdResponse, paginatedResponse } = require('../utils/response');

const router = express.Router();

/**
 * @swagger
 * /api/messages:
 *   get:
 *     summary: Get user conversations
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Conversations retrieved successfully
 */
router.get('/', protect, async (req, res, next) => {
  try {
    // TODO: Get user conversations
    const conversations = [{
      id: '1',
      otherUser: { name: 'John Doe', avatar: 'avatar.jpg' },
      lastMessage: 'Thanks for the great work!',
      unreadCount: 0,
      updatedAt: new Date()
    }];

    const pagination = { page: 1, limit: 10, total: 1 };
    return paginatedResponse(res, conversations, pagination);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/messages/{conversationId}:
 *   get:
 *     summary: Get messages in a conversation
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 */
router.get('/:conversationId', protect, async (req, res, next) => {
  try {
    // TODO: Get conversation messages
    const messages = [{
      id: '1',
      senderId: req.user.id,
      content: 'Hello, I have a question about your gig',
      createdAt: new Date()
    }];

    return successResponse(res, messages);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/messages:
 *   post:
 *     summary: Send a message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               recipientId:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Message sent successfully
 */
router.post('/', protect, async (req, res, next) => {
  try {
    const { recipientId, content } = req.body;
    
    // TODO: Send message
    const message = {
      id: '1',
      senderId: req.user.id,
      recipientId,
      content,
      createdAt: new Date()
    };

    return createdResponse(res, message, 'Message sent successfully');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
