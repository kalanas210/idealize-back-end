const express = require('express');
const { successResponse, paginatedResponse } = require('../utils/response');

const router = express.Router();

/**
 * @swagger
 * /api/influencers:
 *   get:
 *     summary: Get all influencers
 *     tags: [Influencers]
 *     parameters:
 *       - in: query
 *         name: platform
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Influencers retrieved successfully
 */
router.get('/', async (req, res, next) => {
  try {
    // TODO: Get influencers from database
    const mockInfluencers = [{
      id: '1',
      name: 'TechGuru Mike',
      username: 'techguruofficial',
      verified: true,
      followers: '250K',
      rating: 4.9
    }];

    const pagination = { page: 1, limit: 10, total: 1 };
    return paginatedResponse(res, mockInfluencers, pagination);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/influencers/{id}:
 *   get:
 *     summary: Get influencer profile
 *     tags: [Influencers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Influencer profile retrieved
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    // TODO: Get influencer profile
    const profile = {
      id,
      name: 'TechGuru Mike',
      username: 'techguruofficial',
      bio: 'Tech reviewer and content creator',
      verified: true,
      stats: { followers: '250K', engagement: '4.2%' }
    };

    return successResponse(res, profile);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
