const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
// Clerk JWT verification middleware
const { verifyToken } = require('@clerk/backend');
const { v4: uuidv4 } = require('uuid');

/**
 * Generate a consistent UUID for development mode
 */
const generateDevUserId = (token) => {
  // Use a fixed namespace UUID for development
  const namespace = '550e8400-e29b-41d4-a716-446655440000';
  if (token) {
    // Create a consistent ID based on token hash
    const crypto = require('crypto');
    const hash = crypto.createHash('md5').update(token).digest('hex');
    return `${hash.substring(0, 8)}-${hash.substring(8, 12)}-${hash.substring(12, 16)}-${hash.substring(16, 20)}-${hash.substring(20, 32)}`;
  }
  return namespace; // Fallback to namespace UUID
};

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
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'your-secret-key');

    // TODO: Get user from database (placeholder for DB team)
    /*
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
    */

    // Mock user data for development (remove when DB is ready)
    const mockUser = {
      id: decoded.id,
      email: decoded.email || 'test@example.com',
      role: decoded.role || 'buyer',
      verified: true,
      created_at: new Date()
    };

    req.user = mockUser;
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
    
    // Development mode: Always use mock authentication for testing
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️  Development mode: Using mock authentication');
      
      // Create a mock user for development with proper UUID format
      const mockUserId = generateDevUserId(token);
      
      // Try to get the actual user role from database first
      try {
        const result = await query(
          'SELECT id, email, username, name, role, verified FROM users WHERE id = $1',
          [mockUserId]
        );
        
        if (result.rows.length > 0) {
          const dbUser = result.rows[0];
          console.log('✅ Mock user found in database:', dbUser);
          req.user = dbUser;
        } else {
          // Create new mock user with default role
          req.user = {
            id: mockUserId,
            email: 'test@example.com',
            username: 'testuser',
            name: 'Test User',
            role: 'buyer',
            verified: true
          };
          console.log('✅ New mock user created:', req.user);
        }
      } catch (dbError) {
        console.log('⚠️  Database query failed, using default mock user:', dbError.message);
        // Fallback to default mock user
        req.user = {
          id: mockUserId,
          email: 'test@example.com',
          username: 'testuser',
          name: 'Test User',
          role: 'buyer',
          verified: true
        };
        console.log('✅ Fallback mock user created:', req.user);
      }
      
      return next();
    }
    
    // Production mode: Verify Clerk JWT
    if (!process.env.CLERK_SECRET_KEY) {
      return res.status(500).json({
        success: false,
        error: { message: 'Clerk not configured for production', code: 'CLERK_NOT_CONFIGURED' }
      });
    }
    
    try {
      const { payload } = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY
      });
      
      if (!payload || !payload.sub) {
        return res.status(401).json({
          success: false,
          error: { message: 'Invalid Clerk token', code: 'INVALID_TOKEN' }
        });
      }
      
      // Try to get user from database, fallback to creating a user object
      let user;
      try {
        const userResult = await query('SELECT * FROM users WHERE id = $1', [payload.sub]);
        
        if (userResult.rows.length === 0) {
          // Try to create user in DB
          const newUser = await query(
            `INSERT INTO users (id, email, username, name, role, verified, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING *`,
            [
              payload.sub, 
              payload.email || 'user@example.com', 
              payload.username || payload.email?.split('@')[0] || 'user',
              payload.name || payload.firstName || '', 
              'buyer', 
              true
            ]
          );
          user = newUser.rows[0];
        } else {
          user = userResult.rows[0];
        }
      } catch (dbError) {
        // Database not available, create user object from token
        console.log('Database not available, using token data');
        user = {
          id: payload.sub,
          email: payload.email || 'user@example.com',
          username: payload.username || payload.email?.split('@')[0] || 'user',
          name: payload.name || payload.firstName || 'User',
          role: 'buyer',
          verified: true
        };
      }
      
      req.user = user;
      next();
      
    } catch (clerkError) {
      console.error('Clerk verification failed:', clerkError.message);
      
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication failed', code: 'AUTH_FAILED' }
      });
    }
    
  } catch (error) {
    console.error('Authentication error:', error);
    
    // In development, always allow bypass
    if (process.env.NODE_ENV === 'development') {
      const mockUserId = generateDevUserId(token);
      req.user = {
        id: mockUserId,
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
        role: 'buyer',
        verified: true
      };
      console.log('✅ Fallback mock user created:', req.user);
      return next();
    }
    
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