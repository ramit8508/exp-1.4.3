const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');

// GET routes
router.get('/seats/available', bookingController.getAvailableSeats.bind(bookingController));
router.get('/bookings', bookingController.getAllBookings.bind(bookingController));
router.get('/bookings/:seatId', bookingController.getBookingBySeatId.bind(bookingController));
router.get('/stats', bookingController.getStatistics.bind(bookingController));

// POST routes
router.post('/bookings', bookingController.bookTicket.bind(bookingController));
router.post('/bookings/reset', bookingController.resetAllBookings.bind(bookingController));

// DELETE routes
router.delete('/bookings/:seatId', bookingController.cancelBooking.bind(bookingController));

module.exports = router;
