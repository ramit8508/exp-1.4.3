class Booking {
  constructor(data) {
    this.seatId = data.seatId;
    this.userName = data.userName;
    this.email = data.email;
    this.sessionId = data.sessionId;
    this.bookedAt = data.bookedAt || new Date().toISOString();
    this.status = data.status || 'confirmed';
  }

  static fromRedisHash(hash) {
    return new Booking({
      seatId: parseInt(hash.seatId),
      userName: hash.userName,
      email: hash.email,
      sessionId: hash.sessionId,
      bookedAt: hash.bookedAt,
      status: hash.status || 'confirmed'
    });
  }

  toRedisHash() {
    return {
      seatId: this.seatId.toString(),
      userName: this.userName,
      email: this.email,
      sessionId: this.sessionId,
      bookedAt: this.bookedAt,
      status: this.status
    };
  }

  toJSON() {
    return {
      seatId: this.seatId,
      userName: this.userName,
      email: this.email,
      sessionId: this.sessionId,
      bookedAt: this.bookedAt,
      status: this.status
    };
  }

  validate() {
    const errors = [];

    if (!this.seatId || typeof this.seatId !== 'number') {
      errors.push('Invalid seat ID');
    }

    if (!this.userName || this.userName.trim().length === 0) {
      errors.push('User name is required');
    }

    if (!this.email || !this.isValidEmail(this.email)) {
      errors.push('Valid email is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

module.exports = Booking;
