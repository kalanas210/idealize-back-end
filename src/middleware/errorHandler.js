/**
 * Global error handling middleware
 * Handles all errors and sends consistent error responses
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error to console for debugging
  console.error(`❌ Error: ${err.message}`.red);
  console.error(err.stack);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = {
      message,
      statusCode: 404
    };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = {
      message,
      statusCode: 400
    };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = {
      message,
      statusCode: 400
    };
  }

  // JWT Error
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = {
      message,
      statusCode: 401
    };
  }

  // JWT Expired Error
  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = {
      message,
      statusCode: 401
    };
  }

  // PostgreSQL errors
  if (err.code) {
    switch (err.code) {
      case '23505': // Unique constraint violation
        error = {
          message: 'Duplicate entry. Resource already exists.',
          statusCode: 409
        };
        break;
      case '23503': // Foreign key constraint violation
        error = {
          message: 'Referenced resource does not exist.',
          statusCode: 400
        };
        break;
      case '23514': // Check constraint violation
        error = {
          message: 'Invalid data provided.',
          statusCode: 400
        };
        break;
      case '42703': // Column does not exist
        error = {
          message: 'Invalid field specified.',
          statusCode: 400
        };
        break;
      default:
        error = {
          message: 'Database error occurred.',
          statusCode: 500
        };
    }
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: {
      message: error.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { 
        stack: err.stack,
        details: err 
      })
    },
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  });
};

module.exports = errorHandler; 