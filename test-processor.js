module.exports = {
  selectRandomSeat
};

function selectRandomSeat(context, events, done) {
  // Get available seats from previous response
  const availableSeats = context.vars.availableSeats;
  
  if (!availableSeats || availableSeats.length === 0) {
    // If no seats available, use a random seat number (will fail but test continues)
    context.vars.seatId = Math.floor(Math.random() * 50) + 1;
  } else {
    // Select a random seat from available seats
    const randomIndex = Math.floor(Math.random() * availableSeats.length);
    context.vars.seatId = availableSeats[randomIndex];
  }
  
  return done();
}
