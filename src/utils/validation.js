const { body, param, query, validationResult } = require('express-validator');

/**
 * Validate request and return errors if any
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors.array().map(error => ({
          field: error.path || error.param,
          message: error.msg,
          value: error.value
        }))
      }
    });
  }
  next();
};

/**
 * Common validation rules
 */
const validationRules = {
  // User validations
  email: () => body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  password: () => body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  name: () => body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  username: () => body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and hyphens'),
  
  role: () => body('role')
    .optional()
    .isIn(['buyer', 'seller', 'admin'])
    .withMessage('Role must be either buyer, seller, or admin'),

  // ID validations
  userId: () => param('id')
    .isUUID()
    .withMessage('Invalid user ID format'),
  
  gigId: () => param('id')
    .isUUID()
    .withMessage('Invalid gig ID format'),
  
  orderId: () => param('id')
    .isUUID()
    .withMessage('Invalid order ID format'),

  // Gig validations
  gigTitle: () => body('title')
    .trim()
    .isLength({ min: 10, max: 100 })
    .withMessage('Gig title must be between 10 and 100 characters'),
  
  gigDescription: () => body('description')
    .trim()
    .isLength({ min: 50, max: 2000 })
    .withMessage('Gig description must be between 50 and 2000 characters'),
  
  gigCategory: () => body('category')
    .isIn(['technology', 'fitness', 'beauty', 'gaming', 'business', 'entertainment', 'education', 'food', 'travel', 'lifestyle'])
    .withMessage('Invalid category selected'),
  
  gigPlatform: () => body('platform')
    .isIn(['youtube', 'instagram', 'tiktok', 'facebook', 'twitter', 'twitch', 'linkedin'])
    .withMessage('Invalid platform selected'),
  
  price: () => body('price')
    .isFloat({ min: 5, max: 10000 })
    .withMessage('Price must be between $5 and $10,000'),
  
  deliveryTime: () => body('deliveryTime')
    .isInt({ min: 1, max: 30 })
    .withMessage('Delivery time must be between 1 and 30 days'),

  // Query validations
  page: () => query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  limit: () => query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  sortBy: () => query('sortBy')
    .optional()
    .isIn(['createdAt', 'price', 'rating', 'orders'])
    .withMessage('Invalid sort field'),
  
  sortOrder: () => query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),

  // Review validations
  rating: () => body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  
  reviewComment: () => body('comment')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Review comment must be between 10 and 500 characters'),

  // Message validations
  messageContent: () => body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message content must be between 1 and 1000 characters')
};

/**
 * Validation chain builders
 */
const validate = {
  register: [
    validationRules.email(),
    validationRules.password(),
    validationRules.name(),
    validationRules.username(),
    validationRules.role(),
    validateRequest
  ],

  login: [
    validationRules.email(),
    body('password').notEmpty().withMessage('Password is required'),
    validateRequest
  ],

  createGig: [
    validationRules.gigTitle(),
    validationRules.gigDescription(),
    validationRules.gigCategory(),
    validationRules.gigPlatform(),
    validationRules.price(),
    validationRules.deliveryTime(),
    validateRequest
  ],

  updateGig: [
    validationRules.gigId(),
    validationRules.gigTitle(),
    validationRules.gigDescription(),
    validationRules.gigCategory(),
    validationRules.gigPlatform(),
    validationRules.price(),
    validationRules.deliveryTime(),
    validateRequest
  ],

  createReview: [
    validationRules.rating(),
    validationRules.reviewComment(),
    validateRequest
  ],

  sendMessage: [
    validationRules.messageContent(),
    validateRequest
  ],

  pagination: [
    validationRules.page(),
    validationRules.limit(),
    validationRules.sortBy(),
    validationRules.sortOrder(),
    validateRequest
  ]
};

module.exports = {
  validate,
  validationRules,
  validateRequest
}; 