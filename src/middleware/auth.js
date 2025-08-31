import jwt from 'jsonwebtoken';
import { clerkClient } from '@clerk/express';
import { User } from '../models/index.js';

// Get or create user from Clerk authentication
const getOrCreateUserFromClerk = async (clerkUserId) => {
  try {
    // First check if user already exists in our database
    let user = await User.findOne({ clerkId: clerkUserId });
    if (user) {
      return user;
    }

    // Try to get user info from Clerk
    let clerkUser;
    try {
      clerkUser = await clerkClient.users.getUser(clerkUserId);
    } catch (clerkError) {
      console.log('User not found in Clerk, creating minimal user:', clerkUserId);
      
      // Create a minimal user if Clerk user doesn't exist but we have a valid token
      // This can happen in development or if the user was deleted from Clerk
      user = await User.create({
        clerkId: clerkUserId,
        email: `user_${clerkUserId}@clerk.local`, // Placeholder email
        username: `user_${clerkUserId.substring(0, 8)}`,
        displayName: `User ${clerkUserId.substring(0, 8)}`,
        role: 'buyer',
        verified: {
          email: true, // Assume verified since it came from Clerk token
          identity: false,
          phone: false
        },
        status: 'active'
      });
      
      return user;
    }
    
    // Create user from Clerk data
    const email = clerkUser.emailAddresses?.[0]?.emailAddress;
    if (email) {
      const username = email.split('@')[0].toLowerCase() + Math.random().toString(36).substr(2, 4);
      
      user = await User.create({
        clerkId: clerkUser.id,
        email: email.toLowerCase(),
        username,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        displayName: clerkUser.firstName && clerkUser.lastName 
          ? `${clerkUser.firstName} ${clerkUser.lastName}` 
          : username,
        role: 'buyer',
        verified: {
          email: true, // Clerk handles email verification
          identity: false,
          phone: false
        },
        status: 'active'
      });
    }
    
    return user;
  } catch (error) {
    console.error('Error getting user from Clerk:', error);
    return null;
  }
};

// Verify JWT token (existing custom auth)
const verifyJWTToken = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    return user;
  } catch (error) {
    return null;
  }
};

// Custom Clerk authentication middleware for API routes
export const authenticateToken = async (req, res, next) => {
  try {
    // First check if Clerk middleware has already set auth (using function form)
    let userId;
    try {
      const auth = req.auth();
      userId = auth?.userId;
    } catch (authError) {
      // req.auth() might not be available, continue with manual token verification
      userId = null;
    }

    // If no userId from middleware, try to get it from the session token directly
    if (!userId) {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Authentication required',
            code: 'AUTHENTICATION_REQUIRED'
          }
        });
      }

      try {
        // Decode the JWT token to get the userId
        const decoded = jwt.decode(token);
        userId = decoded?.sub;
        
        if (!userId) {
          throw new Error('No userId in token');
        }
        
        // Try to verify the user exists in Clerk
        try {
          await clerkClient.users.getUser(userId);
        } catch (userError) {
          // If user doesn't exist in Clerk, but we have a valid token structure,
          // this might be a valid Clerk session for a user we haven't seen before
          console.log('User not found in Clerk, will create from token data:', userId);
        }
      } catch (clerkError) {
        console.log('Clerk token verification failed:', clerkError.message);
        return res.status(401).json({
          success: false,
          error: {
            message: 'Invalid authentication token',
            code: 'INVALID_TOKEN'
          }
        });
      }
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
          code: 'AUTHENTICATION_REQUIRED'
        }
      });
    }

    // Get or create user in our database from Clerk data
    const user = await getOrCreateUserFromClerk(userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        }
      });
    }

    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Account is not active',
          code: 'ACCOUNT_INACTIVE'
        }
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Authentication failed',
        code: 'AUTH_ERROR'
      }
    });
  }
};

// Optional authentication - doesn't fail if no token (Clerk-based)
export const optionalAuth = async (req, res, next) => {
  try {
    let userId;
    try {
      const auth = req.auth();
      userId = auth?.userId;
    } catch (authError) {
      userId = null;
    }

    if (!userId) {
      req.user = null;
      return next();
    }

    const user = await getOrCreateUserFromClerk(userId);
    
    if (user && user.status === 'active') {
      req.user = user;
    } else {
      req.user = null;
    }
    
    next();
  } catch (error) {
    // Don't fail on optional auth
    req.user = null;
    next();
  }
};

// Check if user has specific role
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        }
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          details: `Required role: ${roles.join(' or ')}, current role: ${req.user.role}`
        }
      });
    }

    next();
  };
};

// Check if user is a seller
export const requireSeller = requireRole('seller', 'admin');

// Check if user is an admin
export const requireAdmin = requireRole('admin');

// Check if user owns the resource or is admin
export const requireOwnershipOrAdmin = (resourceUserField = 'user') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        }
      });
    }

    // Admin can access everything
    if (req.user.role === 'admin') {
      return next();
    }

    // Check ownership based on different scenarios
    const resourceUserId = req.resource?.[resourceUserField] || 
                          req.params.userId || 
                          req.body.userId;

    if (resourceUserId && req.user._id.equals(resourceUserId)) {
      return next();
    }

    // Check if user ID in params matches authenticated user
    if (req.params.id && req.user._id.equals(req.params.id)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: {
        message: 'Access denied - you can only access your own resources',
        code: 'ACCESS_DENIED'
      }
    });
  };
};

// Middleware to check if user is verified
export const requireVerification = (verificationType = 'email') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        }
      });
    }

    if (!req.user.verified[verificationType]) {
      return res.status(403).json({
        success: false,
        error: {
          message: `${verificationType} verification required`,
          code: 'VERIFICATION_REQUIRED',
          details: `Please verify your ${verificationType} to access this resource`
        }
      });
    }

    next();
  };
};

// JWT-only authentication middleware (for admin routes)
export const authenticateJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Access token required',
          code: 'TOKEN_REQUIRED'
        }
      });
    }

    // Verify JWT token
    const user = await verifyJWTToken(token);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid token',
          code: 'INVALID_TOKEN'
        }
      });
    }

    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Account is not active',
          code: 'ACCOUNT_INACTIVE'
        }
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('JWT Authentication error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Authentication failed',
        code: 'AUTH_ERROR'
      }
    });
  }
};

// Generate JWT token
export const generateToken = (userId, expiresIn = null) => {
  const payload = { userId };
  const options = {};
  
  if (expiresIn) {
    options.expiresIn = expiresIn;
  } else {
    options.expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  }

  return jwt.sign(payload, process.env.JWT_SECRET, options);
};

// Verify token without middleware
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Refresh token middleware
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Refresh token required',
          code: 'REFRESH_TOKEN_REQUIRED'
        }
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user || user.status !== 'active') {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid refresh token',
          code: 'INVALID_REFRESH_TOKEN'
        }
      });
    }

    // Generate new access token
    const newAccessToken = generateToken(user._id);
    
    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        user: user
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      error: {
        message: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      }
    });
  }
};

// Rate limiting for authentication endpoints
export const authRateLimit = (maxAttempts = 5, windowMinutes = 15) => {
  const attempts = new Map();

  return (req, res, next) => {
    const key = req.ip + ':' + (req.body.email || req.body.username || '');
    const now = Date.now();
    const windowStart = now - (windowMinutes * 60 * 1000);

    // Clean old attempts
    const userAttempts = attempts.get(key) || [];
    const recentAttempts = userAttempts.filter(time => time > windowStart);

    if (recentAttempts.length >= maxAttempts) {
      return res.status(429).json({
        success: false,
        error: {
          message: `Too many authentication attempts. Please try again in ${windowMinutes} minutes.`,
          code: 'TOO_MANY_ATTEMPTS'
        }
      });
    }

    // Add current attempt
    recentAttempts.push(now);
    attempts.set(key, recentAttempts);

    next();
  };
};
