const validator = {
  /**
   * Validate booking request body
   */
  validateBooking: (req, res, next) => {
    const { seatId, userName, email } = req.body;
    const errors = [];

    if (!seatId) {
      errors.push('seatId is required');
    } else if (isNaN(parseInt(seatId))) {
      errors.push('seatId must be a number');
    }

    if (!userName || typeof userName !== 'string' || userName.trim().length === 0) {
      errors.push('userName is required and must be a non-empty string');
    }

    if (!email || typeof email !== 'string') {
      errors.push('email is required');
    } else if (!validator.isValidEmail(email)) {
      errors.push('email must be a valid email address');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    next();
  },

  /**
   * Validate seat ID parameter
   */
  validateSeatId: (req, res, next) => {
    const { seatId } = req.params;

    if (!seatId || isNaN(parseInt(seatId))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid seat ID',
        errors: ['seatId must be a valid number']
      });
    }

    next();
  },

  /**
   * Email validation helper
   */
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
};

module.exports = validator;
