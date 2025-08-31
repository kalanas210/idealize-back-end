import mongoose from 'mongoose';

// Custom error class
export class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// MongoDB/Mongoose error handler
const handleMongoError = (error) => {
  let message = 'Database error';
  let statusCode = 500;
  let code = 'DATABASE_ERROR';

  // Duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    const value = error.keyValue[field];
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} '${value}' already exists`;
    statusCode = 409;
    code = 'DUPLICATE_FIELD';
  }
  
  // Validation error
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(val => val.message);
    message = errors.join('. ');
    statusCode = 400;
    code = 'VALIDATION_ERROR';
  }
  
  // Cast error (invalid ObjectId)
  if (error.name === 'CastError') {
    message = `Invalid ${error.path}: ${error.value}`;
    statusCode = 400;
    code = 'INVALID_ID';
  }

  return new AppError(message, statusCode, code);
};

// JWT error handler
const handleJWTError = (error) => {
  if (error.name === 'JsonWebTokenError') {
    return new AppError('Invalid token', 401, 'INVALID_TOKEN');
  }
  if (error.name === 'TokenExpiredError') {
    return new AppError('Token expired', 401, 'TOKEN_EXPIRED');
  }
  return new AppError('Authentication failed', 401, 'AUTH_ERROR');
};

// Main error handler middleware
export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error details in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error details:', {
      message: err.message,
      stack: err.stack,
      name: err.name,
      code: err.code
    });
  } else {
    // Log only essential info in production
    console.error('Error:', err.message);
  }

  // Handle specific error types
  if (err.name === 'CastError' || err.name === 'ValidationError' || err.code === 11000) {
    error = handleMongoError(err);
  }
  
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    error = handleJWTError(err);
  }

  // Handle multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = new AppError('File too large', 413, 'FILE_TOO_LARGE');
  }
  
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error = new AppError('Unexpected file field', 400, 'INVALID_FILE_FIELD');
  }

  // Default error response
  const statusCode = error.statusCode || 500;
  const message = error.isOperational ? error.message : 'Something went wrong';
  const code = error.code || 'INTERNAL_SERVER_ERROR';

  // Prepare error response
  const errorResponse = {
    success: false,
    error: {
      message,
      code,
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        details: error
      })
    }
  };

  res.status(statusCode).json(errorResponse);
};

// Async error wrapper
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Validation error helper
export const createValidationError = (message, field = null) => {
  const error = new AppError(message, 400, 'VALIDATION_ERROR');
  if (field) {
    error.field = field;
  }
  return error;
};

// Not found error helper
export const createNotFoundError = (resource = 'Resource') => {
  return new AppError(`${resource} not found`, 404, 'NOT_FOUND');
};

// Forbidden error helper
export const createForbiddenError = (message = 'Access denied') => {
  return new AppError(message, 403, 'FORBIDDEN');
};

// Unauthorized error helper
export const createUnauthorizedError = (message = 'Unauthorized') => {
  return new AppError(message, 401, 'UNAUTHORIZED');
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('Unhandled Promise Rejection:', err.message);
  console.error('Shutting down the server due to unhandled promise rejection');
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  console.error('Shutting down the server due to uncaught exception');
  process.exit(1);
});
