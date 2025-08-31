import { AppError } from './errorHandler.js';

// Generic validation middleware
export const validateRequest = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const data = req[source];
      const { error, value } = schema.validate(data, { 
        abortEarly: false,
        allowUnknown: false,
        stripUnknown: true
      });

      if (error) {
        const messages = error.details.map(detail => detail.message);
        throw new AppError(messages.join('. '), 400, 'VALIDATION_ERROR');
      }

      req[source] = value;
      next();
    } catch (err) {
      next(err);
    }
  };
};

// Email validation
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation
export const validatePassword = (password) => {
  // At least 8 characters, one uppercase, one lowercase, one number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// Username validation
export const validateUsername = (username) => {
  // 3-30 characters, alphanumeric and underscores only
  const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
  return usernameRegex.test(username);
};

// MongoDB ObjectId validation
export const validateObjectId = (id) => {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  return objectIdRegex.test(id);
};

// URL validation
export const validateUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// File validation middleware
export const validateFile = (options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
    required = false
  } = options;

  return (req, res, next) => {
    try {
      const file = req.file;

      if (!file && required) {
        throw new AppError('File is required', 400, 'FILE_REQUIRED');
      }

      if (file) {
        // Check file size
        if (file.size > maxSize) {
          throw new AppError(
            `File too large. Maximum size is ${Math.round(maxSize / (1024 * 1024))}MB`,
            413,
            'FILE_TOO_LARGE'
          );
        }

        // Check file type
        if (!allowedTypes.includes(file.mimetype)) {
          throw new AppError(
            `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
            400,
            'INVALID_FILE_TYPE'
          );
        }
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

// Rate validation (1-5)
export const validateRating = (rating) => {
  const num = parseInt(rating);
  return num >= 1 && num <= 5;
};

// Price validation
export const validatePrice = (price) => {
  const num = parseFloat(price);
  return !isNaN(num) && num >= 5 && num <= 10000;
};

// Phone number validation (basic)
export const validatePhone = (phone) => {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
};

// Social media URL validation
export const validateSocialUrl = (url, platform) => {
  if (!validateUrl(url)) return false;

  const platformDomains = {
    youtube: ['youtube.com', 'youtu.be'],
    instagram: ['instagram.com'],
    tiktok: ['tiktok.com'],
    facebook: ['facebook.com', 'fb.com'],
    twitter: ['twitter.com', 'x.com'],
    linkedin: ['linkedin.com']
  };

  const domains = platformDomains[platform.toLowerCase()];
  if (!domains) return false;

  try {
    const urlObj = new URL(url);
    return domains.some(domain => urlObj.hostname.includes(domain));
  } catch {
    return false;
  }
};

// Sanitize input
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
};

// Validate pagination parameters
export const validatePagination = (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Validate limits
    if (page < 1) {
      throw new AppError('Page must be greater than 0', 400, 'INVALID_PAGE');
    }

    if (limit < 1 || limit > 100) {
      throw new AppError('Limit must be between 1 and 100', 400, 'INVALID_LIMIT');
    }

    req.pagination = {
      page,
      limit,
      skip: (page - 1) * limit
    };

    next();
  } catch (err) {
    next(err);
  }
};

// Validate sort parameters
export const validateSort = (allowedFields = []) => {
  return (req, res, next) => {
    try {
      const { sort } = req.query;
      
      if (!sort) {
        req.sort = { createdAt: -1 }; // Default sort
        return next();
      }

      const sortObj = {};
      const sortFields = sort.split(',');

      for (const field of sortFields) {
        let sortField = field.trim();
        let sortOrder = 1;

        if (sortField.startsWith('-')) {
          sortOrder = -1;
          sortField = sortField.substring(1);
        }

        if (allowedFields.length > 0 && !allowedFields.includes(sortField)) {
          throw new AppError(
            `Invalid sort field: ${sortField}. Allowed fields: ${allowedFields.join(', ')}`,
            400,
            'INVALID_SORT_FIELD'
          );
        }

        sortObj[sortField] = sortOrder;
      }

      req.sort = sortObj;
      next();
    } catch (err) {
      next(err);
    }
  };
};

// Custom validation for gig packages
export const validateGigPackages = (packages) => {
  const requiredPackages = ['basic'];
  const validPackageTypes = ['basic', 'standard', 'premium'];

  // At least basic package is required
  if (!packages.basic || !packages.basic.isActive) {
    throw new AppError('Basic package is required', 400, 'BASIC_PACKAGE_REQUIRED');
  }

  for (const [type, pkg] of Object.entries(packages)) {
    if (!validPackageTypes.includes(type)) {
      throw new AppError(`Invalid package type: ${type}`, 400, 'INVALID_PACKAGE_TYPE');
    }

    if (pkg && pkg.isActive) {
      if (!pkg.title || !pkg.description || !pkg.price || !pkg.deliveryTime) {
        throw new AppError(
          `${type} package is missing required fields`,
          400,
          'INCOMPLETE_PACKAGE'
        );
      }

      if (!validatePrice(pkg.price)) {
        throw new AppError(
          `${type} package price must be between $5 and $10,000`,
          400,
          'INVALID_PACKAGE_PRICE'
        );
      }

      if (pkg.deliveryTime < 1 || pkg.deliveryTime > 365) {
        throw new AppError(
          `${type} package delivery time must be between 1 and 365 days`,
          400,
          'INVALID_DELIVERY_TIME'
        );
      }
    }
  }

  return true;
};
