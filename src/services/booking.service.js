const redisConnection = require('../config/redis.config');
const config = require('../config/app.config');
const logger = require('../config/logger');
const distributedLockService = require('./distributedLock.service');
const Booking = require('../models/Booking.model');
const Seat = require('../models/Seat.model');

class BookingService {
  constructor() {
    this.redisClient = null;
    this.totalSeats = config.booking.totalSeats;
    this.processingMinDelay = config.booking.processingMinDelay;
    this.processingMaxDelay = config.booking.processingMaxDelay;
  }

  async initialize() {
    this.redisClient = redisConnection.getClient();
    await distributedLockService.initialize();
    
    // Initialize available seats if not already done
    const exists = await this.redisClient.exists('available_seats');
    if (!exists) {
      await this.initializeSeats();
    }
    
    logger.success('Booking Service initialized');
  }

  /**
   * Initialize available seats in Redis
   */
  async initializeSeats() {
    try {
      const seats = [];
      for (let i = 1; i <= this.totalSeats; i++) {
        seats.push(i.toString());
      }
      
      if (seats.length > 0) {
        await this.redisClient.sAdd('available_seats', seats);
      }
      
      logger.info(`Initialized ${this.totalSeats} seats`);
    } catch (error) {
      logger.error('Error initializing seats:', error);
      throw error;
    }
  }

  /**
   * Get all available seats
   * @returns {Promise<Array<number>>} - Array of available seat IDs
   */
  async getAvailableSeats() {
    try {
      const seats = await this.redisClient.sMembers('available_seats');
      return seats.map(s => parseInt(s)).sort((a, b) => a - b);
    } catch (error) {
      logger.error('Error fetching available seats:', error);
      throw error;
    }
  }

  /**
   * Book a ticket with distributed locking
   * @param {Object} bookingData - Booking information
   * @returns {Promise<Object>} - Booking result
   */
  async bookTicket(bookingData) {
    const { seatId, userName, email, sessionId } = bookingData;
    const startTime = Date.now();
    let lockAcquired = false;

    try {
      logger.info(`Booking attempt: Seat ${seatId} by ${userName} (${sessionId})`);

      // Step 1: Validate booking data
      const booking = new Booking({ seatId, userName, email, sessionId });
      const validation = booking.validate();
      
      if (!validation.isValid) {
        return {
          success: false,
          message: 'Validation failed',
          errors: validation.errors,
          processingTime: Date.now() - startTime
        };
      }

      // Step 2: Check if seat is available
      const isAvailable = await this.redisClient.sIsMember(
        'available_seats',
        seatId.toString()
      );
      
      if (!isAvailable) {
        return {
          success: false,
          message: 'Seat is not available',
          seatId,
          processingTime: Date.now() - startTime
        };
      }

      // Step 3: Acquire distributed lock
      lockAcquired = await distributedLockService.acquireLock(
        `seat:${seatId}`,
        sessionId
      );
      
      if (!lockAcquired) {
        return {
          success: false,
          message: 'Seat is currently being booked. Please try again.',
          seatId,
          processingTime: Date.now() - startTime
        };
      }

      // Step 4: Double-check availability (prevents race conditions)
      const stillAvailable = await this.redisClient.sIsMember(
        'available_seats',
        seatId.toString()
      );
      
      if (!stillAvailable) {
        await distributedLockService.releaseLock(`seat:${seatId}`, sessionId);
        return {
          success: false,
          message: 'Seat was just booked by another user',
          seatId,
          processingTime: Date.now() - startTime
        };
      }

      // Step 5: Simulate processing time (database operations)
      await this.simulateProcessing();

      // Step 6: Complete booking transaction
      await this.completeBooking(booking);

      logger.success(`Seat ${seatId} booked successfully by ${userName}`);

      return {
        success: true,
        message: 'Ticket booked successfully',
        data: booking.toJSON(),
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      logger.error(`Error booking seat ${seatId}:`, error);
      return {
        success: false,
        message: 'Internal server error',
        error: error.message,
        processingTime: Date.now() - startTime
      };
    } finally {
      // Step 7: Always release the lock
      if (lockAcquired) {
        await distributedLockService.releaseLock(`seat:${seatId}`, sessionId);
      }
    }
  }

  /**
   * Complete the booking transaction
   */
  async completeBooking(booking) {
    const { seatId } = booking;
    
    // Use Redis transaction for atomicity
    const multi = this.redisClient.multi();
    
    multi.sRem('available_seats', seatId.toString());
    multi.sAdd('booked_seats', seatId.toString());
    multi.hSet(`booking:${seatId}`, booking.toRedisHash());
    
    await multi.exec();
  }

  /**
   * Get booking details by seat ID
   * @param {number} seatId - Seat identifier
   * @returns {Promise<Booking|null>} - Booking object or null
   */
  async getBookingBySeatId(seatId) {
    try {
      const bookingKey = `booking:${seatId}`;
      const hash = await this.redisClient.hGetAll(bookingKey);
      
      if (Object.keys(hash).length === 0) {
        return null;
      }
      
      return Booking.fromRedisHash(hash);
    } catch (error) {
      logger.error(`Error fetching booking for seat ${seatId}:`, error);
      throw error;
    }
  }

  /**
   * Get all bookings
   * @returns {Promise<Array<Booking>>} - Array of bookings
   */
  async getAllBookings() {
    try {
      const bookedSeats = await this.redisClient.sMembers('booked_seats');
      const bookings = [];

      for (const seatId of bookedSeats) {
        const booking = await this.getBookingBySeatId(parseInt(seatId));
        if (booking) {
          bookings.push(booking.toJSON());
        }
      }

      return bookings.sort((a, b) => a.seatId - b.seatId);
    } catch (error) {
      logger.error('Error fetching all bookings:', error);
      throw error;
    }
  }

  /**
   * Cancel a booking
   * @param {number} seatId - Seat to cancel
   * @param {string} sessionId - Session identifier
   * @returns {Promise<Object>} - Cancellation result
   */
  async cancelBooking(seatId, sessionId) {
    let lockAcquired = false;

    try {
      // Acquire lock for cancellation
      lockAcquired = await distributedLockService.acquireLock(
        `seat:${seatId}`,
        sessionId
      );
      
      if (!lockAcquired) {
        return {
          success: false,
          message: 'Unable to acquire lock for cancellation'
        };
      }

      const bookingKey = `booking:${seatId}`;
      const exists = await this.redisClient.exists(bookingKey);

      if (!exists) {
        return {
          success: false,
          message: 'No booking found for this seat'
        };
      }

      // Use transaction to cancel booking
      const multi = this.redisClient.multi();
      multi.del(bookingKey);
      multi.sRem('booked_seats', seatId.toString());
      multi.sAdd('available_seats', seatId.toString());
      await multi.exec();

      logger.info(`Booking cancelled for seat ${seatId}`);

      return {
        success: true,
        message: 'Booking cancelled successfully',
        seatId
      };

    } catch (error) {
      logger.error(`Error cancelling booking for seat ${seatId}:`, error);
      return {
        success: false,
        message: 'Error cancelling booking',
        error: error.message
      };
    } finally {
      if (lockAcquired) {
        await distributedLockService.releaseLock(`seat:${seatId}`, sessionId);
      }
    }
  }

  /**
   * Get booking statistics
   * @returns {Promise<Object>} - Statistics object
   */
  async getStatistics() {
    try {
      const availableSeats = await this.redisClient.sCard('available_seats');
      const bookedSeats = await this.redisClient.sCard('booked_seats');
      const lockedSeats = await distributedLockService.getLockedResources();

      return {
        totalSeats: this.totalSeats,
        availableSeats,
        bookedSeats,
        currentlyLocked: lockedSeats.length,
        lockedSeatIds: lockedSeats.map(key => key.replace('seat:', '')),
        utilizationPercentage: ((bookedSeats / this.totalSeats) * 100).toFixed(2)
      };
    } catch (error) {
      logger.error('Error fetching statistics:', error);
      throw error;
    }
  }

  /**
   * Reset all bookings (for testing)
   * @returns {Promise<Object>} - Reset result
   */
  async resetAllBookings() {
    try {
      const bookedSeats = await this.redisClient.sMembers('booked_seats');
      
      // Delete all booking records
      const multi = this.redisClient.multi();
      for (const seatId of bookedSeats) {
        multi.del(`booking:${seatId}`);
      }
      multi.del('available_seats');
      multi.del('booked_seats');
      await multi.exec();

      // Reinitialize seats
      await this.initializeSeats();

      logger.warn('All bookings have been reset');

      return {
        success: true,
        message: 'All bookings have been reset',
        resetCount: bookedSeats.length
      };
    } catch (error) {
      logger.error('Error resetting bookings:', error);
      return {
        success: false,
        message: 'Error resetting bookings',
        error: error.message
      };
    }
  }

  /**
   * Simulate processing delay (e.g., database operations)
   */
  async simulateProcessing() {
    const delay = Math.floor(
      Math.random() * (this.processingMaxDelay - this.processingMinDelay + 1)
    ) + this.processingMinDelay;
    
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}

// Singleton instance
const bookingService = new BookingService();

module.exports = bookingService;
