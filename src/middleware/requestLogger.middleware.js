const logger = require('../config/logger');

/**
 * Request logging middleware
 */
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request
  logger.info(`${req.method} ${req.path}`);
  
  // Override res.json to log response
  const originalJson = res.json.bind(res);
  res.json = function (body) {
    const responseTime = Date.now() - startTime;
    logger.http(req.method, req.path, res.statusCode, responseTime);
    return originalJson(body);
  };
  
  next();
};

module.exports = requestLogger;
