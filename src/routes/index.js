const bookingRoutes = require('./booking.routes');
const healthRoutes = require('./health.routes');
const config = require('../config/app.config');

module.exports = (app) => {
  // Health routes (no prefix)
  app.use('/', healthRoutes);
  
  // API routes (with prefix)
  app.use(config.api.prefix, bookingRoutes);
  
  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      message: 'Endpoint not found',
      path: req.originalUrl,
      method: req.method
    });
  });
};
