const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
// Clerk JWT verification middleware
const { verifyToken } = require('@clerk/backend');
const { v4: uuidv4 } = require('uuid');

/**
 * Protect routes - verify JWT token
 */
const protect = async (req, res, next) => {
  let token;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Not authorized to access this route',
        code: 'NO_TOKEN_PROVIDED'
      }
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const userResult = await query(
      'SELECT id, email, role, verified, created_at FROM users WHERE id = $1 AND deleted_at IS NULL',
      [decoded.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'User not found or has been deleted',
          code: 'USER_NOT_FOUND'
        }
      });
    }

    req.user = userResult.rows[0];
    next();
  } catch (error) {
    console.error('JWT verification error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Token expired',
          code: 'TOKEN_EXPIRED'
        }
      });
    }

    return res.status(401).json({
      success: false,
      error: {
        message: 'Not authorized to access this route',
        code: 'INVALID_TOKEN'
      }
    });
  }
};

/**
 * Grant access to specific roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'User not authenticated',
          code: 'USER_NOT_AUTHENTICATED'
        }
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          message: `User role ${req.user.role} is not authorized to access this route`,
          code: 'INSUFFICIENT_PERMISSIONS'
        }
      });
    }

    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userResult = await query(
        'SELECT id, email, role, verified, created_at FROM users WHERE id = $1 AND deleted_at IS NULL',
        [decoded.id]
      );

      if (userResult.rows.length > 0) {
        req.user = userResult.rows[0];
      }
    } catch (error) {
      // Ignore token errors for optional auth
      console.log('Optional auth token error:', error.message);
    }
  }

  next();
};

/**
 * Clerk Protect middleware - verifies Clerk JWT and syncs user to DB
 */
const clerkProtect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: { message: 'No token provided', code: 'NO_TOKEN' }
      });
    }
    const token = authHeader.substring(7);
    // Verify Clerk JWT
    const { payload } = await verifyToken(token);
    if (!payload || !payload.sub || !payload.email) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid Clerk token', code: 'INVALID_TOKEN' }
      });
    }
    // Check if user exists in DB
    const userResult = await query('SELECT * FROM users WHERE id = $1', [payload.sub]);
    let user;
    if (userResult.rows.length === 0) {
      // Create user in DB
      const newUser = await query(
        `INSERT INTO users (id, email, username, name, role, verified, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING *`,
        [payload.sub, payload.email, payload.username || payload.email.split('@')[0], payload.name || '', 'buyer', true]
      );
      user = newUser.rows[0];
    } else {
      user = userResult.rows[0];
    }
    req.user = user;
    next();
  } catch (error) {
    console.error('Clerk JWT verification error:', error);
    return res.status(401).json({
      success: false,
      error: { message: 'Unauthorized', code: 'UNAUTHORIZED' }
    });
  }
};

module.exports = {
  protect,
  authorize,
  optionalAuth,
  clerkProtect
}; 