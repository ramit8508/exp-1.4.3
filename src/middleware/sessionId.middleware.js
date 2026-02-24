const { randomUUID } = require('crypto');

/**
 * Attach unique session ID to each request
 */
const sessionId = (req, res, next) => {
  req.sessionId = req.headers['x-session-id'] || randomUUID();
  res.setHeader('x-session-id', req.sessionId);
  next();
};

module.exports = sessionId;
