/**
 * Standard success response
 */
const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

/**
 * Standard error response
 */
const errorResponse = (res, message = 'Internal Server Error', statusCode = 500, code = null) => {
  return res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(code && { code })
    },
    timestamp: new Date().toISOString()
  });
};

/**
 * Paginated response
 */
const paginatedResponse = (res, data, pagination, message = 'Success') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      currentPage: parseInt(pagination.page) || 1,
      totalPages: Math.ceil(pagination.total / pagination.limit),
      totalItems: pagination.total,
      itemsPerPage: parseInt(pagination.limit) || 10,
      hasNextPage: pagination.page < Math.ceil(pagination.total / pagination.limit),
      hasPrevPage: pagination.page > 1
    },
    timestamp: new Date().toISOString()
  });
};

/**
 * Created response for POST requests
 */
const createdResponse = (res, data, message = 'Resource created successfully') => {
  return successResponse(res, data, message, 201);
};

/**
 * No content response for DELETE requests
 */
const noContentResponse = (res, message = 'Resource deleted successfully') => {
  return res.status(204).json({
    success: true,
    message,
    timestamp: new Date().toISOString()
  });
};

/**
 * Not found response
 */
const notFoundResponse = (res, message = 'Resource not found') => {
  return errorResponse(res, message, 404, 'RESOURCE_NOT_FOUND');
};

/**
 * Unauthorized response
 */
const unauthorizedResponse = (res, message = 'Unauthorized access') => {
  return errorResponse(res, message, 401, 'UNAUTHORIZED');
};

/**
 * Forbidden response
 */
const forbiddenResponse = (res, message = 'Access forbidden') => {
  return errorResponse(res, message, 403, 'FORBIDDEN');
};

/**
 * Bad request response
 */
const badRequestResponse = (res, message = 'Bad request') => {
  return errorResponse(res, message, 400, 'BAD_REQUEST');
};

/**
 * Conflict response
 */
const conflictResponse = (res, message = 'Resource conflict') => {
  return errorResponse(res, message, 409, 'CONFLICT');
};

/**
 * Validation error response
 */
const validationErrorResponse = (res, errors, message = 'Validation failed') => {
  return res.status(400).json({
    success: false,
    error: {
      message,
      code: 'VALIDATION_ERROR',
      details: errors
    },
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  successResponse,
  errorResponse,
  paginatedResponse,
  createdResponse,
  noContentResponse,
  notFoundResponse,
  unauthorizedResponse,
  forbiddenResponse,
  badRequestResponse,
  conflictResponse,
  validationErrorResponse
}; 