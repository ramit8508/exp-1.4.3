const redisConnection = require('../config/redis.config');
const ApiResponse = require('../models/ApiResponse.model');
const logger = require('../config/logger');

class HealthController {
  /**
   * Health check endpoint
   * @route GET /health
   */
  async healthCheck(req, res) {
    try {
      const redisHealthy = await redisConnection.healthCheck();
      
      const health = {
        status: redisHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        service: 'Concurrent Ticket Booking System',
        version: '1.0.0',
        uptime: process.uptime(),
        redis: {
          connected: redisHealthy,
          status: redisHealthy ? 'OK' : 'Error'
        },
        memory: {
          used: process.memoryUsage().heapUsed,
          total: process.memoryUsage().heapTotal,
          external: process.memoryUsage().external
        }
      };

      const statusCode = redisHealthy ? 200 : 503;
      res.status(statusCode).json(health);
    } catch (error) {
      logger.error('Error in healthCheck:', error);
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  }

  /**
   * API info endpoint
   * @route GET /api/info
   */
  async apiInfo(req, res) {
    try {
      const info = {
        service: 'Concurrent Ticket Booking System',
        version: '1.0.0',
        description: 'Ticket booking system with Redis-based distributed locking',
        endpoints: {
          health: 'GET /health',
          availableSeats: 'GET /api/seats/available',
          allBookings: 'GET /api/bookings',
          bookingDetails: 'GET /api/bookings/:seatId',
          bookTicket: 'POST /api/bookings',
          cancelBooking: 'DELETE /api/bookings/:seatId',
          statistics: 'GET /api/stats',
          reset: 'POST /api/bookings/reset'
        },
        features: [
          'Distributed locking with Redis',
          'Race condition prevention',
          'Concurrent request handling',
          'Atomic operations',
          'Real-time statistics'
        ]
      };

      res.json(ApiResponse.success(info, 'API information'));
    } catch (error) {
      logger.error('Error in apiInfo:', error);
      res.status(500).json(
        ApiResponse.error('Failed to fetch API info', error.message)
      );
    }
  }
}

module.exports = new HealthController();
