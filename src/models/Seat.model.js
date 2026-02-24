class Seat {
  constructor(seatId, status = 'available') {
    this.seatId = seatId;
    this.status = status; // 'available', 'locked', 'booked'
  }

  static STATUSES = {
    AVAILABLE: 'available',
    LOCKED: 'locked',
    BOOKED: 'booked'
  };

  isAvailable() {
    return this.status === Seat.STATUSES.AVAILABLE;
  }

  isLocked() {
    return this.status === Seat.STATUSES.LOCKED;
  }

  isBooked() {
    return this.status === Seat.STATUSES.BOOKED;
  }

  toJSON() {
    return {
      seatId: this.seatId,
      status: this.status
    };
  }
}

module.exports = Seat;
