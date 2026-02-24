const bookingService = require('../services/booking.service');
const ApiResponse = require('../models/ApiResponse.model');
const logger = require('../config/logger');
const { randomUUID } = require('crypto');

class BookingController {
  /**
   * Get all available seats
   * @route GET /api/seats/available
   */
  async getAvailableSeats(req, res) {
    try {
      const seats = await bookingService.getAvailableSeats();
      
      res.json(ApiResponse.success(
        { seats, count: seats.length },
        'Available seats fetched successfully'
      ));
    } catch (error) {
      logger.error('Error in getAvailableSeats:', error);
      res.status(500).json(
        ApiResponse.error('Failed to fetch available seats', error.message)
      );
    }
  }

  /**
   * Get all bookings
   * @route GET /api/bookings
   */
  async getAllBookings(req, res) {
    try {
      const bookings = await bookingService.getAllBookings();
      
      res.json(ApiResponse.success(
        { bookings, count: bookings.length },
        'Bookings fetched successfully'
      ));
    } catch (error) {
      logger.error('Error in getAllBookings:', error);
      res.status(500).json(
        ApiResponse.error('Failed to fetch bookings', error.message)
      );
    }
  }

  /**
   * Get booking by seat ID
   * @route GET /api/bookings/:seatId
   */
  async getBookingBySeatId(req, res) {
    try {
      const seatId = parseInt(req.params.seatId);
      
      if (isNaN(seatId)) {
        return res.status(400).json(
          ApiResponse.error('Invalid seat ID', 'Seat ID must be a number', 400)
        );
      }

      const booking = await bookingService.getBookingBySeatId(seatId);
      
      if (!booking) {
        return res.status(404).json(
          ApiResponse.error('Booking not found', 'No booking exists for this seat', 404)
        );
      }

      res.json(ApiResponse.success(
        { booking: booking.toJSON() },
        'Booking details fetched successfully'
      ));
    } catch (error) {
      logger.error('Error in getBookingBySeatId:', error);
      res.status(500).json(
        ApiResponse.error('Failed to fetch booking details', error.message)
      );
    }
  }

  /**
   * Book a ticket
   * @route POST /api/bookings
   */
  async bookTicket(req, res) {
    try {
      const { seatId, userName, email } = req.body;

      // Validation
      if (!seatId || !userName || !email) {
        return res.status(400).json(
          ApiResponse.error(
            'Validation failed',
            'seatId, userName, and email are required',
            400
          )
        );
      }

      // Generate unique session ID for this booking attempt
      const sessionId = req.sessionId || randomUUID();

      const result = await bookingService.bookTicket({
        seatId: parseInt(seatId),
        userName,
        email,
        sessionId
      });

      if (!result.success) {
        const statusCode = result.message.includes('not available') ? 409 : 
                          result.message.includes('Validation') ? 400 : 409;
        
        return res.status(statusCode).json(result);
      }

      res.status(201).json(result);
    } catch (error) {
      logger.error('Error in bookTicket:', error);
      res.status(500).json(
        ApiResponse.error('Failed to process booking', error.message, 500)
      );
    }
  }

  /**
   * Cancel a booking
   * @route DELETE /api/bookings/:seatId
   */
  async cancelBooking(req, res) {
    try {
      const seatId = parseInt(req.params.seatId);
      
      if (isNaN(seatId)) {
        return res.status(400).json(
          ApiResponse.error('Invalid seat ID', 'Seat ID must be a number', 400)
        );
      }

      const sessionId = req.sessionId || randomUUID();
      const result = await bookingService.cancelBooking(seatId, sessionId);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error) {
      logger.error('Error in cancelBooking:', error);
      res.status(500).json(
        ApiResponse.error('Failed to cancel booking', error.message)
      );
    }
  }

  /**
   * Get booking statistics
   * @route GET /api/stats
   */
  async getStatistics(req, res) {
    try {
      const stats = await bookingService.getStatistics();
      
      res.json(ApiResponse.success(
        { statistics: stats },
        'Statistics fetched successfully'
      ));
    } catch (error) {
      logger.error('Error in getStatistics:', error);
      res.status(500).json(
        ApiResponse.error('Failed to fetch statistics', error.message)
      );
    }
  }

  /**
   * Reset all bookings (admin/testing)
   * @route POST /api/bookings/reset
   */
  async resetAllBookings(req, res) {
    try {
      const result = await bookingService.resetAllBookings();
      
      res.json(result);
    } catch (error) {
      logger.error('Error in resetAllBookings:', error);
      res.status(500).json(
        ApiResponse.error('Failed to reset bookings', error.message)
      );
    }
  }
}

module.exports = new BookingController();
