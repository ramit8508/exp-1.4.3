const logger = require('../config/logger');
const ApiResponse = require('../models/ApiResponse.model');

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  logger.error('Unhandled error:', err);

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json(
      ApiResponse.error('Validation Error', err.message, 400)
    );
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json(
      ApiResponse.error('Unauthorized', err.message, 401)
    );
  }

  // Default error response
  res.status(err.statusCode || 500).json(
    ApiResponse.error(
      err.message || 'Internal Server Error',
      err.stack || 'Unknown error',
      err.statusCode || 500
    )
  );
};

module.exports = errorHandler;
