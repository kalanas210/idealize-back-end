const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const { protect, authorize, optionalAuth, clerkProtect } = require('../middleware/auth');
const { validate } = require('../utils/validation');
const {
  successResponse,
  createdResponse,
  paginatedResponse,
  notFoundResponse,
  forbiddenResponse,
  errorResponse
} = require('../utils/response');
const { body, param, validationResult } = require('express-validator');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Gig:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         category:
 *           type: string
 *           enum: [technology, fitness, beauty, gaming, business, entertainment, education, food, travel, lifestyle]
 *         platform:
 *           type: string
 *           enum: [youtube, instagram, tiktok, facebook, twitter, twitch, linkedin]
 *         price:
 *           type: number
 *           minimum: 5
 *           maximum: 10000
 *         deliveryTime:
 *           type: integer
 *           minimum: 1
 *           maximum: 30
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         rating:
 *           type: number
 *         totalReviews:
 *           type: integer
 *         completedOrders:
 *           type: integer
 *         featured:
 *           type: boolean
 *         seller:
 *           $ref: '#/components/schemas/User'
 */

/**
 * @swagger
 * /api/gigs:
 *   get:
 *     summary: Get all gigs with filtering and pagination
 *     tags: [Gigs]
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
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: platform
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of gigs retrieved successfully
 */
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      platform,
      search,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      featured
    } = req.query;

    try {
    let whereConditions = ['g.status = $1'];
    let queryParams = ['active'];
    let paramCount = 1;

    if (category) {
      paramCount++;
        whereConditions.push(`g.category_id = (SELECT id FROM categories WHERE slug = $${paramCount})`);
      queryParams.push(category);
    }

      if (platform) {
        paramCount++;
        whereConditions.push(`g.platform = $${paramCount}`);
        queryParams.push(platform);
      }

      if (search) {
        paramCount++;
        whereConditions.push(`(g.title ILIKE $${paramCount} OR g.description ILIKE $${paramCount})`);
        queryParams.push(`%${search}%`);
      }

      if (minPrice) {
        paramCount++;
        whereConditions.push(`g.price >= $${paramCount}`);
        queryParams.push(parseFloat(minPrice));
      }

      if (maxPrice) {
        paramCount++;
        whereConditions.push(`g.price <= $${paramCount}`);
        queryParams.push(parseFloat(maxPrice));
      }

      if (featured === 'true') {
        paramCount++;
        whereConditions.push(`g.featured = $${paramCount}`);
        queryParams.push(true);
      }

    const dataQuery = `
        SELECT g.*, u.name as seller_name, u.username as seller_username, u.verified as seller_verified
      FROM gigs g
      INNER JOIN users u ON g.seller_id = u.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY g.${sortBy} ${sortOrder.toUpperCase()}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

      const result = await query(dataQuery, [...queryParams, parseInt(limit), (parseInt(page) - 1) * parseInt(limit)]);
      
      const gigs = result.rows.map(gig => ({
        ...gig,
        seller: {
          id: gig.seller_id,
          name: gig.seller_name,
          username: gig.seller_username,
          verified: gig.seller_verified
        }
      }));

      const pagination = { page: parseInt(page), limit: parseInt(limit), total: gigs.length };
      return paginatedResponse(res, gigs, pagination, 'Gigs retrieved successfully');
    } catch (error) {
      console.error('Error fetching gigs:', error);
      // Fallback to mock data if database query fails
    const mockGigs = [
      {
        id: uuidv4(),
        title: 'I will create professional tech review videos for your products',
        description: 'Professional YouTube tech review with in-depth analysis',
        category: 'technology',
        platform: 'youtube',
        price: 299,
        deliveryTime: 3,
        tags: ['tech review', 'youtube', 'product analysis'],
        rating: 4.9,
        totalReviews: 127,
        completedOrders: 234,
        featured: true,
        seller: {
          id: uuidv4(),
          name: 'TechGuru Mike',
          username: 'techguruofficial',
          verified: true
        }
      }
    ];

    const pagination = { page: parseInt(page), limit: parseInt(limit), total: mockGigs.length };
    return paginatedResponse(res, mockGigs, pagination, 'Gigs retrieved successfully');
    }

  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/gigs/{id}:
 *   get:
 *     summary: Get a single gig by ID
 *     tags: [Gigs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Gig retrieved successfully
 *       404:
 *         description: Gig not found
 */
router.get('/:id',
  param('id').isUUID(),
  async (req, res) => {
    try {
      const { id } = req.params;

      // TODO: Replace with actual database query
      /*
      const result = await query(
        `SELECT g.*, 
                array_agg(DISTINCT jsonb_build_object(
                  'tier', gp.tier,
                  'packageName', gp.title,
                  'price', gp.price,
                  'delivery', gp.delivery_time,
                  'revision', gp.revisions,
                  'features', gp.features
                )) as pricing,
                array_agg(DISTINCT jsonb_build_object(
                  'question', gf.question,
                  'answer', gf.answer
                )) as faq
         FROM gigs g
         LEFT JOIN gig_packages gp ON gp.gig_id = g.id
         LEFT JOIN gig_faqs gf ON gf.gig_id = g.id
         WHERE g.id = $1
         GROUP BY g.id`,
        [id]
      );

      if (result.rows.length === 0) {
        return errorResponse(res, 'Gig not found', 404);
      }

      const gig = result.rows[0];
      */

      // Mock response
      const gig = {
        id,
        gigTitle: "I will create amazing social media content",
        category: "Social Media Marketing",
        platform: "Instagram",
        tags: ["social media", "content creation", "marketing"],
        pricing: {
          basic: {
            packageName: "Basic Package",
            price: 50,
            delivery: 2,
            revision: 1,
            features: [
              "1 Social Media Post",
              "Basic Design",
              "24h Delivery"
            ]
          },
          standard: {
            packageName: "Standard Package",
            price: 100,
            delivery: 3,
            revision: 2,
            features: [
              "3 Social Media Posts",
              "Premium Design",
              "Source Files",
              "72h Delivery"
            ]
          },
          premium: {
            packageName: "Premium Package",
            price: 200,
            delivery: 5,
            revision: 3,
            features: [
              "5 Social Media Posts",
              "Premium Design",
              "Source Files",
              "Marketing Strategy",
              "Priority Support"
            ]
          }
        },
        gigDescription: {
          description: "Professional social media content creation service...",
          faq: [
            {
              question: "What do you need from me?",
              answer: "Just your brand guidelines and content preferences..."
            },
            {
              question: "Do you provide revisions?",
              answer: "Yes, revisions are included in each package..."
            }
          ]
        },
        buyerRequirements: [
          "Brand guidelines",
          "Target audience information",
          "Content preferences"
        ],
        gallery: {
          images: [
            "https://example.com/image1.jpg",
            "https://example.com/image2.jpg"
          ],
          video: "https://example.com/video.mp4"
        }
      };

      return successResponse(res, gig, 'Gig retrieved successfully');

    } catch (error) {
      console.error('Error fetching gig:', error);
      return errorResponse(res, 'Failed to fetch gig', 500);
    }
  }
);

/**
 * @swagger
 * /api/gigs:
 *   post:
 *     summary: Create a new gig
 *     tags: [Gigs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - gigTitle
 *               - category
 *               - platform
 *               - pricing
 *               - gigDescription
 *             properties:
 *               gigTitle:
 *                 type: string
 *               category:
 *                 type: string
 *               platform:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               pricing:
 *                 type: object
 *                 properties:
 *                   basic:
 *                     $ref: '#/components/schemas/Package'
 *                   standard:
 *                     $ref: '#/components/schemas/Package'
 *                   premium:
 *                     $ref: '#/components/schemas/Package'
 *               gigDescription:
 *                 type: object
 *                 properties:
 *                   description:
 *                     type: string
 *                   faq:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         question:
 *                           type: string
 *                         answer:
 *                           type: string
 *               buyerRequirements:
 *                 type: array
 *                 items:
 *                   type: string
 *               gallery:
 *                 type: object
 *                 properties:
 *                   images:
 *                     type: array
 *                     items:
 *                       type: string
 *                   video:
 *                     type: string
 *     responses:
 *       201:
 *         description: Gig created successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Only sellers can create gigs
 */
router.post('/', clerkProtect,
  [
    body('gigTitle').trim().isLength({ min: 5, max: 100 })
      .withMessage('Gig title must be between 5 and 100 characters'),
    body('category').trim().notEmpty()
      .withMessage('Category is required'),
    body('platform').trim().notEmpty()
      .withMessage('Platform is required'),
    body('tags').isArray({ max: 10 })
      .withMessage('Maximum 10 tags allowed'),
    body('tags.*').trim().isLength({ min: 2, max: 20 })
      .withMessage('Each tag must be between 2 and 20 characters'),
    body('pricing.*.packageName').trim().isLength({ min: 3, max: 50 })
      .withMessage('Package name must be between 3 and 50 characters'),
    body('pricing.*.price').isFloat({ min: 5 })
      .withMessage('Price must be at least $5'),
    body('pricing.*.delivery').isInt({ min: 1, max: 30 })
      .withMessage('Delivery time must be between 1 and 30 days'),
    body('pricing.*.revision').isInt({ min: 0 })
      .withMessage('Revision count must be 0 or more'),
    body('pricing.*.features').isArray({ min: 1 })
      .withMessage('At least one feature is required'),
    body('gigDescription.description').trim().isLength({ min: 100, max: 2000 })
      .withMessage('Description must be between 100 and 2000 characters'),
    body('gigDescription.faq').isArray()
      .withMessage('FAQ must be an array'),
    body('gigDescription.faq.*.question').trim().isLength({ min: 3, max: 100 })
      .withMessage('FAQ question must be between 3 and 100 characters'),
    body('gigDescription.faq.*.answer').trim().isLength({ min: 10, max: 500 })
      .withMessage('FAQ answer must be between 10 and 500 characters'),
    body('buyerRequirements').isArray()
      .withMessage('Buyer requirements must be an array'),
    body('buyerRequirements.*').trim().isLength({ min: 3, max: 200 })
      .withMessage('Each requirement must be between 3 and 200 characters'),
    body('gallery.images').isArray({ max: 10 })
      .withMessage('Maximum 10 images allowed'),
    body('gallery.images.*').custom((value) => {
      // Allow both full URLs and relative paths
      if (typeof value === 'string' && (value.startsWith('http') || value.startsWith('/uploads/'))) {
        return true;
      }
      throw new Error('Invalid image URL or path');
    }),
    body('gallery.video').optional().custom((value) => {
      if (!value) return true; // Optional field
      // Allow both full URLs and relative paths
      if (typeof value === 'string' && (value.startsWith('http') || value.startsWith('/uploads/'))) {
        return true;
      }
      throw new Error('Invalid video URL or path');
    }),
    body('status').optional().isIn(['draft', 'published'])
      .withMessage('Status must be either draft or published')
  ],
  async (req, res) => {
    try {
      console.log('📝 Received gig creation data:', JSON.stringify(req.body, null, 2));
      
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('❌ Validation errors:', errors.array());
        return errorResponse(res, 'Validation error', 400, errors.array());
      }

      const userId = req.user.id;
      const gigData = req.body;

      // Start transaction
      await query('BEGIN');

      try {
        // Insert gig
        const gigResult = await query(
          `INSERT INTO gigs (
            seller_id, title, category, platform, tags,
            description, requirements, images, video_url, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING *`,
          [
            userId,
            gigData.gigTitle,
            gigData.category,
            gigData.platform,
            gigData.tags || [],
            gigData.gigDescription.description,
            gigData.buyerRequirements || [],
            gigData.gallery?.images || [],
            gigData.gallery?.video || null,
            gigData.status || 'draft'
          ]
        );

        const gigId = gigResult.rows[0].id;
        console.log('✅ Gig created with ID:', gigId);

        // Insert packages
        if (gigData.pricing && Array.isArray(gigData.pricing)) {
          for (const packageData of gigData.pricing) {
            await query(
              `INSERT INTO gig_packages (
                gig_id, tier, package_name, description, price,
                delivery_time, revisions, features
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
              [
                gigId,
                packageData.tier || 'basic',
                packageData.packageName || 'Basic Package',
                packageData.description || '',
                packageData.price || 0,
                packageData.delivery || 1,
                packageData.revision || 0,
                packageData.features || []
              ]
            );
          }
          console.log('✅ Gig packages created');
        }

        // Insert FAQ
        if (gigData.gigDescription?.faq && Array.isArray(gigData.gigDescription.faq)) {
          for (const faqItem of gigData.gigDescription.faq) {
            await query(
              `INSERT INTO gig_faqs (
                gig_id, question, answer
              ) VALUES ($1, $2, $3)`,
              [
                gigId,
                faqItem.question || '',
                faqItem.answer || ''
              ]
            );
          }
          console.log('✅ Gig FAQ created');
        }

        await query('COMMIT');
        console.log('✅ Transaction committed successfully');

        // Fetch complete gig data
        const completeGigResult = await query(
          `SELECT g.*, 
                  json_agg(
                    DISTINCT jsonb_build_object(
                      'tier', gp.tier,
                      'packageName', gp.package_name,
                      'description', gp.description,
                      'price', gp.price,
                      'delivery', gp.delivery_time,
                      'revision', gp.revisions,
                      'features', gp.features
                    )
                  ) FILTER (WHERE gp.id IS NOT NULL) as pricing,
                  json_agg(
                    DISTINCT jsonb_build_object(
                      'question', gf.question,
                      'answer', gf.answer
                    )
                  ) FILTER (WHERE gf.id IS NOT NULL) as faq
           FROM gigs g
           LEFT JOIN gig_packages gp ON gp.gig_id = g.id
           LEFT JOIN gig_faqs gf ON gf.gig_id = g.id
           WHERE g.id = $1
           GROUP BY g.id`,
          [gigId]
        );

        const createdGig = completeGigResult.rows[0];
        console.log('✅ Complete gig data fetched:', createdGig.id);

        return successResponse(res, createdGig, 'Gig created successfully');

      } catch (dbError) {
        await query('ROLLBACK');
        console.error('❌ Database error during gig creation:', dbError);
        throw new Error(`Failed to create gig: ${dbError.message}`);
      }

    } catch (error) {
      console.error('Error creating gig:', error);
      return errorResponse(res, error.message || 'Failed to create gig', 500);
    }
  }
);

/**
 * @swagger
 * /api/gigs/{id}:
 *   put:
 *     summary: Update a gig
 *     tags: [Gigs]
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
 *             $ref: '#/components/schemas/Gig'
 *     responses:
 *       200:
 *         description: Gig updated successfully
 *       403:
 *         description: Not authorized to update this gig
 *       404:
 *         description: Gig not found
 */
router.put('/:id', clerkProtect, authorize('seller'), async (req, res, next) => {
  try {
    const { id } = req.params;

    // TODO: Check ownership and update
    /*
    const gigCheck = await query('SELECT seller_id FROM gigs WHERE id = $1', [id]);
    if (gigCheck.rows.length === 0) {
      return notFoundResponse(res, 'Gig not found');
    }
    if (gigCheck.rows[0].seller_id !== req.user.id) {
      return forbiddenResponse(res, 'Not authorized to update this gig');
    }
    */

    const updatedGig = { id, ...req.body, updatedAt: new Date() };
    return successResponse(res, updatedGig, 'Gig updated successfully');

  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/gigs/{id}:
 *   delete:
 *     summary: Delete a gig
 *     tags: [Gigs]
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
 *         description: Gig deleted successfully
 *       403:
 *         description: Not authorized to delete this gig
 *       404:
 *         description: Gig not found
 */
router.delete('/:id', clerkProtect, authorize('seller'), async (req, res, next) => {
  try {
    const { id } = req.params;

    // TODO: Soft delete implementation
    /*
    await query('UPDATE gigs SET status = $1, updated_at = NOW() WHERE id = $2', ['deleted', id]);
    */

    return successResponse(res, null, 'Gig deleted successfully');

  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/gigs/{gigId}/packages:
 *   post:
 *     summary: Create or update gig packages
 *     tags: [Gigs]
 *     security:
 *       - bearerAuth: []
 *     description: Create or update packages for a gig (requires seller role)
 *     parameters:
 *       - in: path
 *         name: gigId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the gig
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - packages
 *             properties:
 *               packages:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - tier
 *                     - title
 *                     - description
 *                     - price
 *                     - delivery_time
 *                     - features
 *                   properties:
 *                     tier:
 *                       type: string
 *                       enum: [basic, standard, premium]
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     price:
 *                       type: number
 *                       minimum: 5
 *                     delivery_time:
 *                       type: integer
 *                       minimum: 1
 *                       maximum: 30
 *                     revisions:
 *                       type: integer
 *                       minimum: 0
 *                     features:
 *                       type: array
 *                       items:
 *                         type: string
 *     responses:
 *       200:
 *         description: Packages created/updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not a seller or not the gig owner
 *       404:
 *         description: Gig not found
 *       500:
 *         description: Server error
 */
router.post('/:gigId/packages', clerkProtect,
  [
    param('gigId').isUUID(),
    body('packages').isArray({ min: 1, max: 3 })
      .withMessage('Must provide between 1 and 3 packages'),
    body('packages.*.tier').isIn(['basic', 'standard', 'premium'])
      .withMessage('Invalid package tier'),
    body('packages.*.title').trim().isLength({ min: 5, max: 100 })
      .withMessage('Package title must be between 5 and 100 characters'),
    body('packages.*.description').trim().isLength({ min: 20, max: 1000 })
      .withMessage('Package description must be between 20 and 1000 characters'),
    body('packages.*.price').isFloat({ min: 5 })
      .withMessage('Price must be at least $5'),
    body('packages.*.delivery_time').isInt({ min: 1, max: 30 })
      .withMessage('Delivery time must be between 1 and 30 days'),
    body('packages.*.revisions').optional().isInt({ min: 0 })
      .withMessage('Revisions must be 0 or more'),
    body('packages.*.features').isArray({ min: 1 })
      .withMessage('Must provide at least one feature'),
    body('packages.*.features.*').trim().isLength({ min: 3, max: 100 })
      .withMessage('Each feature must be between 3 and 100 characters')
  ],
  async (req, res) => {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 'Validation error', 400, errors.array());
      }

      const { gigId } = req.params;
      const { packages } = req.body;
      const userId = req.user.id;

      // TODO: Replace with actual database queries
      /*
      // Check if user is a seller and owns the gig
      const gig = await pool.query(
        `SELECT g.id 
         FROM gigs g
         JOIN users u ON u.id = g.seller_id
         WHERE g.id = $1 AND g.seller_id = $2 AND u.role = 'seller'`,
        [gigId, userId]
      );

      if (gig.rows.length === 0) {
        return errorResponse(res, 'Gig not found or you do not have permission', 404);
      }

      // Start transaction
      await pool.query('BEGIN');

      // Delete existing packages
      await pool.query(
        'DELETE FROM gig_packages WHERE gig_id = $1',
        [gigId]
      );

      // Insert new packages
      const packagePromises = packages.map(pkg => 
        pool.query(
          `INSERT INTO gig_packages 
           (gig_id, tier, title, description, price, delivery_time, revisions, features)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING *`,
          [
            gigId,
            pkg.tier,
            pkg.title,
            pkg.description,
            pkg.price,
            pkg.delivery_time,
            pkg.revisions || 1,
            pkg.features
          ]
        )
      );

      const results = await Promise.all(packagePromises);
      const savedPackages = results.map(r => r.rows[0]);

      await pool.query('COMMIT');
      */

      // Mock response
      const savedPackages = packages.map(pkg => ({
        id: 'mock-uuid',
        gig_id: gigId,
        ...pkg,
        created_at: new Date(),
        updated_at: new Date()
      }));

      return successResponse(res, 'Packages updated successfully', savedPackages);

    } catch (error) {
      // TODO: Rollback transaction if error occurs
      // await pool.query('ROLLBACK');
      
      console.error('Error updating gig packages:', error);
      return errorResponse(res, 'Failed to update packages', 500);
    }
  }
);

/**
 * @swagger
 * /api/gigs/{gigId}/packages:
 *   get:
 *     summary: Get gig packages
 *     tags: [Gigs]
 *     description: Get all packages for a specific gig
 *     parameters:
 *       - in: path
 *         name: gigId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the gig
 *     responses:
 *       200:
 *         description: Packages retrieved successfully
 *       404:
 *         description: Gig not found
 *       500:
 *         description: Server error
 */
router.get('/:gigId/packages',
  param('gigId').isUUID(),
  async (req, res) => {
    try {
      const { gigId } = req.params;

      // TODO: Replace with actual database query
      /*
      const result = await pool.query(
        `SELECT * FROM gig_packages 
         WHERE gig_id = $1 
         ORDER BY 
           CASE tier 
             WHEN 'basic' THEN 1 
             WHEN 'standard' THEN 2 
             WHEN 'premium' THEN 3 
           END`,
        [gigId]
      );

      if (result.rows.length === 0) {
        return errorResponse(res, 'No packages found for this gig', 404);
      }

      const packages = result.rows;
      */

      // Mock response
      const packages = [
        {
          id: 'mock-uuid-1',
          gig_id: gigId,
          tier: 'basic',
          title: 'Basic Package',
          description: 'Basic service package',
          price: 5.00,
          delivery_time: 3,
          revisions: 1,
          features: ['Feature 1', 'Feature 2'],
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 'mock-uuid-2',
          gig_id: gigId,
          tier: 'standard',
          title: 'Standard Package',
          description: 'Standard service package',
          price: 10.00,
          delivery_time: 5,
          revisions: 2,
          features: ['Feature 1', 'Feature 2', 'Feature 3'],
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      return successResponse(res, 'Packages retrieved successfully', packages);

    } catch (error) {
      console.error('Error fetching gig packages:', error);
      return errorResponse(res, 'Failed to fetch packages', 500);
    }
  }
);

module.exports = router;
