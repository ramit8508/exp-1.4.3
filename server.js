require('dotenv').config();
const app = require('./src/app');
const config = require('./src/config/app.config');
const logger = require('./src/config/logger');
const redisConnection = require('./src/config/redis.config');
const bookingService = require('./src/services/booking.service');

class Server {
  constructor() {
    this.server = null;
  }

  async initialize() {
    try {
      // Connect to Redis
      logger.info('Connecting to Redis...');
      await redisConnection.connect();
      
      // Initialize booking service
      logger.info('Initializing Booking Service...');
      await bookingService.initialize();
      
      logger.success('All systems initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize server:', error);
      throw error;
    }
  }

  async start() {
    try {
      await this.initialize();
      
      this.server = app.listen(config.port, () => {
        this.printBanner();
      });

      // Setup graceful shutdown
      this.setupGracefulShutdown();
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  printBanner() {
    const banner = `
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║       🎫  CONCURRENT TICKET BOOKING SYSTEM  🎫                ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝

  🚀 Server running on: http://localhost:${config.port}
  📊 Total Seats: ${config.booking.totalSeats}
  ⏱️  Lock Timeout: ${config.booking.lockTimeout}ms
  🌍 Environment: ${config.nodeEnv}
  
╔════════════════════════════════════════════════════════════════╗
║  📚 API ENDPOINTS                                              ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  Health & Info:                                                ║
║    GET    /health              - Health check                  ║
║    GET    /info                - API information               ║
║                                                                ║
║  Seats:                                                        ║
║    GET    /api/seats/available - Get available seats           ║
║                                                                ║
║  Bookings:                                                     ║
║    GET    /api/bookings        - Get all bookings              ║
║    GET    /api/bookings/:id    - Get booking details           ║
║    POST   /api/bookings        - Book a ticket                 ║
║    DELETE /api/bookings/:id    - Cancel booking                ║
║                                                                ║
║  Statistics:                                                   ║
║    GET    /api/stats           - Get booking statistics        ║
║                                                                ║
║  Admin:                                                        ║
║    POST   /api/bookings/reset  - Reset all bookings            ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝

  💡 Press Ctrl+C to stop the server
`;
    console.log(banner);
  }

  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      logger.info(`\n${signal} signal received. Starting graceful shutdown...`);
      
      // Stop accepting new connections
      if (this.server) {
        this.server.close(() => {
          logger.info('HTTP server closed');
        });
      }

      try {
        // Disconnect from Redis
        await redisConnection.disconnect();
        
        logger.success('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      shutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      shutdown('unhandledRejection');
    });
  }
}

// Start the server
const server = new Server();
server.start();

module.exports = server;
