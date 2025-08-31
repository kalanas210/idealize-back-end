import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';
import { generateToken, verifyToken } from '../middleware/auth.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { validateEmail, validatePassword, validateUsername } from '../middleware/validation.js';

// Register user
export const register = asyncHandler(async (req, res) => {
  const { email, username, password, firstName, lastName, role = 'buyer' } = req.body;

  // Validate input
  if (!email || !username || !password) {
    throw new AppError('Email, username, and password are required', 400, 'MISSING_FIELDS');
  }

  if (!validateEmail(email)) {
    throw new AppError('Invalid email format', 400, 'INVALID_EMAIL');
  }

  if (!validateUsername(username)) {
    throw new AppError('Username must be 3-30 characters and contain only letters, numbers, and underscores', 400, 'INVALID_USERNAME');
  }

  if (!validatePassword(password)) {
    throw new AppError('Password must be at least 8 characters with uppercase, lowercase, and number', 400, 'INVALID_PASSWORD');
  }

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [
      { email: email.toLowerCase() },
      { username: username.toLowerCase() }
    ]
  });

  if (existingUser) {
    const field = existingUser.email === email.toLowerCase() ? 'email' : 'username';
    throw new AppError(`User with this ${field} already exists`, 409, 'USER_EXISTS');
  }

  // Create user
  const user = await User.create({
    email: email.toLowerCase(),
    username: username.toLowerCase(),
    password,
    firstName,
    lastName,
    displayName: firstName && lastName ? `${firstName} ${lastName}` : username,
    role,
    verified: {
      email: false,
      identity: false,
      phone: false
    }
  });

  // Generate token
  const token = generateToken(user._id);

  // Update login stats
  user.loginCount += 1;
  user.lastLogin = new Date();
  await user.save();

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        verified: user.verified
      },
      token
    }
  });
});

// Login user
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Email and password are required', 400, 'MISSING_CREDENTIALS');
  }

  // Find user and include password for comparison
  const user = await User.findOne({ 
    email: email.toLowerCase() 
  }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  if (user.status !== 'active') {
    throw new AppError('Account is not active', 401, 'ACCOUNT_INACTIVE');
  }

  // Generate token
  const token = generateToken(user._id);

  // Update login stats
  user.loginCount += 1;
  user.lastLogin = new Date();
  await user.save();

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        verified: user.verified,
        avatar: user.avatar
      },
      token
    }
  });
});

// Clerk webhook integration
export const clerkWebhook = asyncHandler(async (req, res) => {
  const { type, data } = req.body;

  switch (type) {
    case 'user.created':
      await handleClerkUserCreated(data);
      break;
    case 'user.updated':
      await handleClerkUserUpdated(data);
      break;
    case 'user.deleted':
      await handleClerkUserDeleted(data);
      break;
    default:
      console.log('Unhandled Clerk webhook event:', type);
  }

  res.json({ success: true });
});

// Handle Clerk user creation
const handleClerkUserCreated = async (clerkUser) => {
  try {
    const email = clerkUser.email_addresses?.[0]?.email_address;
    const firstName = clerkUser.first_name;
    const lastName = clerkUser.last_name;
    
    if (!email) {
      console.error('No email found in Clerk user data');
      return;
    }

    // Check if user already exists
    let user = await User.findOne({ 
      $or: [
        { clerkId: clerkUser.id },
        { email: email.toLowerCase() }
      ]
    });

    if (!user) {
      // Create new user
      const username = email.split('@')[0].toLowerCase() + Math.random().toString(36).substr(2, 4);
      
      user = await User.create({
        clerkId: clerkUser.id,
        email: email.toLowerCase(),
        username,
        firstName,
        lastName,
        displayName: firstName && lastName ? `${firstName} ${lastName}` : username,
        role: 'buyer',
        verified: {
          email: true, // Clerk handles email verification
          identity: false,
          phone: false
        },
        status: 'active'
      });
    } else if (!user.clerkId) {
      // Link existing user with Clerk
      user.clerkId = clerkUser.id;
      user.verified.email = true;
      await user.save();
    }

    console.log('User created/updated from Clerk:', user.email);
  } catch (error) {
    console.error('Error handling Clerk user creation:', error);
  }
};

// Handle Clerk user update
const handleClerkUserUpdated = async (clerkUser) => {
  try {
    const user = await User.findOne({ clerkId: clerkUser.id });
    
    if (user) {
      const email = clerkUser.email_addresses?.[0]?.email_address;
      
      if (email) {
        user.email = email.toLowerCase();
      }
      
      if (clerkUser.first_name) {
        user.firstName = clerkUser.first_name;
      }
      
      if (clerkUser.last_name) {
        user.lastName = clerkUser.last_name;
      }
      
      if (user.firstName && user.lastName) {
        user.displayName = `${user.firstName} ${user.lastName}`;
      }
      
      await user.save();
      console.log('User updated from Clerk:', user.email);
    }
  } catch (error) {
    console.error('Error handling Clerk user update:', error);
  }
};

// Handle Clerk user deletion
const handleClerkUserDeleted = async (clerkUser) => {
  try {
    const user = await User.findOne({ clerkId: clerkUser.id });
    
    if (user) {
      // Don't actually delete the user, just mark as inactive
      user.status = 'inactive';
      user.clerkId = null; // Remove Clerk association
      await user.save();
      console.log('User deactivated from Clerk deletion:', user.email);
    }
  } catch (error) {
    console.error('Error handling Clerk user deletion:', error);
  }
};

// Get current user profile
export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        verified: user.verified,
        avatar: user.avatar,
        bio: user.bio,
        location: user.location,
        sellerProfile: user.sellerProfile,
        buyerProfile: user.buyerProfile,
        preferences: user.preferences,
        profileCompletion: user.profileCompletion,
        createdAt: user.createdAt
      }
    }
  });
});

// Update user profile
export const updateProfile = asyncHandler(async (req, res) => {
  const allowedUpdates = [
    'firstName', 'lastName', 'bio', 'location', 'phone',
    'preferences', 'sellerProfile', 'buyerProfile'
  ];
  
  const updates = {};
  
  // Filter allowed updates
  Object.keys(req.body).forEach(key => {
    if (allowedUpdates.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  // Update display name if first/last name changed
  if (updates.firstName || updates.lastName) {
    const firstName = updates.firstName || req.user.firstName;
    const lastName = updates.lastName || req.user.lastName;
    if (firstName && lastName) {
      updates.displayName = `${firstName} ${lastName}`;
    }
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    updates,
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: { user }
  });
});

// Change password
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new AppError('Current password and new password are required', 400, 'MISSING_PASSWORDS');
  }

  if (!validatePassword(newPassword)) {
    throw new AppError('New password must be at least 8 characters with uppercase, lowercase, and number', 400, 'INVALID_PASSWORD');
  }

  // Get user with password
  const user = await User.findById(req.user._id).select('+password');

  if (!user.password || !(await user.comparePassword(currentPassword))) {
    throw new AppError('Current password is incorrect', 400, 'INCORRECT_PASSWORD');
  }

  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
});

// Logout (client-side token removal, but we can track it)
export const logout = asyncHandler(async (req, res) => {
  // In a more advanced implementation, you might maintain a blacklist of tokens
  // For now, we'll just return success as JWT is stateless
  
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Verify token endpoint
export const verifyTokenEndpoint = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    throw new AppError('Token is required', 400, 'TOKEN_REQUIRED');
  }

  const decoded = verifyToken(token);
  
  if (!decoded) {
    throw new AppError('Invalid token', 401, 'INVALID_TOKEN');
  }

  const user = await User.findById(decoded.userId);
  
  if (!user || user.status !== 'active') {
    throw new AppError('User not found or inactive', 401, 'USER_NOT_FOUND');
  }

  res.json({
    success: true,
    data: {
      valid: true,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role
      }
    }
  });
});

// Request password reset (placeholder for email integration)
export const requestPasswordReset = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new AppError('Email is required', 400, 'EMAIL_REQUIRED');
  }

  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    // Don't reveal if user exists or not for security
    return res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent'
    });
  }

  // In a real implementation, you would:
  // 1. Generate a secure reset token
  // 2. Save it to the user record with expiration
  // 3. Send email with reset link
  
  res.json({
    success: true,
    message: 'If an account with that email exists, a password reset link has been sent'
  });
});

// Reset password (placeholder)
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    throw new AppError('Token and new password are required', 400, 'MISSING_FIELDS');
  }

  if (!validatePassword(newPassword)) {
    throw new AppError('Password must be at least 8 characters with uppercase, lowercase, and number', 400, 'INVALID_PASSWORD');
  }

  // In a real implementation, you would:
  // 1. Verify the reset token
  // 2. Find user by token
  // 3. Check token expiration
  // 4. Update password
  
  res.json({
    success: true,
    message: 'Password reset successfully'
  });
});

// Test login for development (creates or logs in test user)
export const testLogin = asyncHandler(async (req, res) => {
  const { email = 'test@example.com' } = req.body;

  // Find or create test user
  let user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    // Create test user
    user = await User.create({
      email: email.toLowerCase(),
      username: 'testuser' + Math.random().toString(36).substr(2, 4),
      password: 'TestPassword123!', // Default test password
      firstName: 'Test',
      lastName: 'User',
      displayName: 'Test User',
      role: 'buyer',
      verified: {
        email: true,
        identity: false,
        phone: false
      },
      status: 'active'
    });
  }

  // Generate token
  const token = generateToken(user._id);

  // Update login stats
  user.loginCount += 1;
  user.lastLogin = new Date();
  await user.save();

  res.json({
    success: true,
    message: 'Test login successful',
    data: {
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        verified: user.verified,
        avatar: user.avatar
      },
      token
    }
  });
});