# Concurrent Ticket Booking System

**Aim:** To create a concurrent ticket booking system with seat locking using Redis.

## Hardware/Software Requirements

- **Node.js** 18+
- **Redis** 6.0+
- **Express.js** 4.18+
- **Load testing tool**: Artillery

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Features](#features)
4. [Installation](#installation)
5. [Usage](#usage)
6. [API Endpoints](#api-endpoints)
7. [Load Testing](#load-testing)
8. [How It Works](#how-it-works)
9. [Viva Questions](#viva-questions)
10. [Project Structure](#project-structure)

---

## Overview

This system demonstrates how to handle concurrent ticket booking requests using distributed locking with Redis. It prevents race conditions and overbooking by implementing atomic operations and lock mechanisms.

### Key Concepts

- **Distributed Locking**: Ensures only one process can access a shared resource at a time
- **Race Condition Prevention**: Prevents multiple users from booking the same seat
- **Atomic Operations**: Redis operations that are guaranteed to complete without interruption
- **Lock Timeout**: Automatic lock release to prevent deadlocks

---

## Architecture

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Client    │────────▶│   Express   │────────▶│   Booking   │
│  (HTTP)     │         │   Server    │         │   Service   │
└─────────────┘         └─────────────┘         └──────┬──────┘
                                                        │
                                    ┌───────────────────┴──────────┐
                                    ▼                              ▼
                            ┌───────────────┐           ┌──────────────┐
                            │ Lock Manager  │           │    Redis     │
                            │  (Dist Lock)  │───────────│  (Data Store)│
                            └───────────────┘           └──────────────┘
```

---

## Features

✅ **Distributed Locking** - Redis-based seat locking mechanism  
✅ **Concurrent Booking** - Handles multiple simultaneous booking requests  
✅ **Race Condition Prevention** - Double-check validation pattern  
✅ **Automatic Lock Expiry** - Prevents deadlocks with timeouts  
✅ **RESTful API** - Clean API endpoints for all operations  
✅ **Real-time Statistics** - Monitor system status  
✅ **Load Testing** - Artillery configuration for performance testing  
✅ **Graceful Shutdown** - Clean resource cleanup  

---

## Installation

### 1. Prerequisites

Make sure Redis is installed and running:

```bash
# Install Redis (Ubuntu/Debian)
sudo apt update
sudo apt install redis-server

# Start Redis
sudo systemctl start redis
sudo systemctl enable redis

# Verify Redis is running
redis-cli ping
# Should return: PONG
```

### 2. Install Dependencies

```bash
cd exp-1.4.3
npm install
```

### 3. Configure Environment

The `.env` file contains:

```env
PORT=3000
REDIS_HOST=localhost
REDIS_PORT=6379
LOCK_TIMEOUT=5000
TOTAL_SEATS=50
```

---

## Usage

### Start the Server

```bash
npm start
```

You should see:

```
============================================================
🎫 CONCURRENT TICKET BOOKING SYSTEM
============================================================
🚀 Server running on http://localhost:3000
📊 Total Seats: 50
⏱️  Lock Timeout: 5000ms

📚 Available Endpoints:
   GET    /health                    - Health check
   GET    /api/seats/available       - Get available seats
   ...
============================================================
```

### Start Redis (if not running)

```bash
redis-server
```

---

## API Endpoints

### 1. Health Check

```bash
GET /health
```

**Response:**
```json
{
  "status": "OK",
  "service": "Concurrent Ticket Booking System",
  "timestamp": "2026-02-24T10:30:00.000Z"
}
```

### 2. Get Available Seats

```bash
GET /api/seats/available
```

**Response:**
```json
{
  "success": true,
  "count": 45,
  "seats": [1, 2, 3, 4, 5, ...]
}
```

### 3. Book a Ticket

```bash
POST /api/book
Content-Type: application/json

{
  "seatId": 10,
  "userName": "John Doe",
  "email": "john@example.com"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Ticket booked successfully",
  "seatId": 10,
  "userName": "John Doe",
  "email": "john@example.com",
  "bookedAt": "2026-02-24T10:30:00.000Z",
  "processingTime": 245
}
```

**Failure Response (Seat Locked):**
```json
{
  "success": false,
  "message": "Seat is currently being booked by another user. Please try again.",
  "seatId": 10,
  "processingTime": 12
}
```

### 4. Get All Bookings

```bash
GET /api/bookings
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "bookings": [
    {
      "seatId": 10,
      "userName": "John Doe",
      "email": "john@example.com",
      "sessionId": "abc-123",
      "bookedAt": "2026-02-24T10:30:00.000Z"
    }
  ]
}
```

### 5. Get Booking Details

```bash
GET /api/bookings/:seatId
```

### 6. Cancel Booking

```bash
DELETE /api/bookings/:seatId
```

### 7. Get Statistics

```bash
GET /api/stats
```

**Response:**
```json
{
  "success": true,
  "statistics": {
    "totalSeats": 50,
    "availableSeats": 45,
    "bookedSeats": 5,
    "currentlyLocked": 2,
    "lockedSeatIds": ["15", "23"]
  }
}
```

### 8. Reset All Bookings

```bash
POST /api/reset
```

---

## Load Testing

### Run Artillery Load Test

```bash
npm test
```

Or directly:

```bash
artillery run load-test.yml
```

### Load Test Phases

1. **Warm-up**: 10s @ 5 requests/sec
2. **Ramp-up**: 30s @ 10→50 requests/sec
3. **Sustained Load**: 60s @ 50 requests/sec
4. **Spike Test**: 20s @ 100 requests/sec

### Test Scenarios

- **70%** - Book random seat
- **20%** - View available seats
- **10%** - View statistics

---

## How It Works

### Distributed Locking Mechanism

1. **Lock Acquisition**: When a user tries to book a seat, the system acquires a distributed lock using Redis `SET NX PX` command.

```javascript
// Atomically set lock only if it doesn't exist with expiry
await redis.set(lockKey, sessionId, {
  NX: true,    // Only set if not exists
  PX: 5000     // Expire in 5000ms
});
```

2. **Critical Section**: Once lock is acquired, the booking process executes safely.

3. **Double-Check**: Verify seat is still available (prevents race conditions).

4. **Lock Release**: Always release the lock using Lua script (ensures only the lock owner can release it).

```lua
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
end
```

### Booking Flow

```
User Request
    ↓
Check Seat Available
    ↓
Acquire Lock ──→ [FAILED] → Return "Seat locked"
    ↓ [SUCCESS]
Double-Check Availability
    ↓
Process Booking
    ↓
Update Redis (Remove from available, Add to booked)
    ↓
Release Lock
    ↓
Return Success
```

### Preventing Race Conditions

Without locking:
```
User A: Check seat 10 → Available ✓
User B: Check seat 10 → Available ✓
User A: Book seat 10 → Success
User B: Book seat 10 → Success (OVERBOOKING!)
```

With distributed locking:
```
User A: Acquire lock on seat 10 → Success
User B: Acquire lock on seat 10 → Failed (locked)
User A: Book seat 10 → Success
User A: Release lock
User B: Retry → Seat no longer available
```

---

## Viva Questions

### 1. Why is locking needed?

**Answer:** Locking is needed to prevent race conditions and overbooking. When multiple users try to book the same seat simultaneously, without locking, both could see the seat as available and complete the booking, resulting in double-booking. Distributed locks ensure that only one user can proceed with booking at a time.

### 2. What is a distributed lock?

**Answer:** A distributed lock is a synchronization mechanism used in distributed systems to ensure that only one process or instance can access a shared resource at any given time. Unlike traditional locks (which work only within a single process), distributed locks work across multiple servers/instances. In our system, we use Redis to implement distributed locks, allowing multiple server instances to coordinate seat bookings.

### 3. How does Redis help?

**Answer:** Redis provides atomic operations that ensure safe concurrent access:
- **SET NX**: Sets a key only if it doesn't exist (atomic check-and-set)
- **SET PX**: Sets expiry time (prevents deadlocks)
- **Lua Scripts**: Execute multiple commands atomically
- **Fast In-Memory**: Very low latency for lock operations
- **Single-threaded**: Commands execute sequentially, preventing race conditions

### 4. What is the purpose of lock timeout?

**Answer:** Lock timeout prevents deadlocks in case of application failure. If a process acquires a lock and crashes before releasing it, the lock would remain forever without a timeout. By setting an expiry time on the lock (e.g., 5 seconds), Redis automatically releases it after the timeout, allowing other processes to proceed. This ensures system availability even if individual requests fail.

### 5. How to recover from failures?

**Answer:** To recover from failures, we implement:
- **Transaction Logs**: Log all booking attempts for audit and recovery
- **Retry Logic**: Automatically retry failed operations with exponential backoff
- **Lock Timeouts**: Automatic lock expiry prevents permanent deadlocks
- **Idempotency**: Ensure operations can be safely retried
- **Graceful Shutdown**: Clean up resources and release locks on shutdown
- **Health Checks**: Monitor system health and Redis connectivity
- **Compensating Transactions**: Rollback operations if booking fails midway

---

## Project Structure

```
exp-1.4.3/
├── server.js              # Express server and API endpoints
├── bookingService.js      # Ticket booking business logic
├── lockManager.js         # Redis distributed lock implementation
├── load-test.yml          # Artillery load testing configuration
├── test-processor.js      # Artillery test data processor
├── package.json           # Dependencies and scripts
├── .env                   # Environment configuration
├── .gitignore            # Git ignore rules
└── README.md             # This file
```

### File Descriptions

- **server.js**: Main Express application with REST API endpoints
- **bookingService.js**: Core booking logic with Redis operations
- **lockManager.js**: Distributed locking mechanism using Redis
- **load-test.yml**: Artillery configuration for load testing
- **test-processor.js**: Helper functions for generating test data

---

## Technical Details

### Dependencies

```json
{
  "express": "^4.18.2",      // Web framework
  "redis": "^4.6.5",          // Redis client
  "cors": "^2.8.5",           // CORS middleware
  "dotenv": "^16.0.3",        // Environment variables
  "artillery": "^2.0.0"       // Load testing
}
```

### Redis Data Structures

1. **Available Seats**: Redis Set (`available_seats`)
   - Stores seat IDs that are currently available

2. **Booked Seats**: Redis Set (`booked_seats`)
   - Stores seat IDs that have been booked

3. **Booking Details**: Redis Hash (`booking:{seatId}`)
   - Stores complete booking information

4. **Locks**: Redis String (`lock:seat:{seatId}`)
   - Stores session ID with automatic expiry

---

## Testing Scenarios

### Test 1: Single User Booking
```bash
curl -X POST http://localhost:3000/api/book \
  -H "Content-Type: application/json" \
  -d '{"seatId": 10, "userName": "Test User", "email": "test@example.com"}'
```

### Test 2: Concurrent Bookings (Same Seat)
Run multiple times simultaneously to test locking:
```bash
# Terminal 1
curl -X POST http://localhost:3000/api/book \
  -H "Content-Type: application/json" \
  -d '{"seatId": 5, "userName": "User A", "email": "a@example.com"}'

# Terminal 2 (at the same time)
curl -X POST http://localhost:3000/api/book \
  -H "Content-Type: application/json" \
  -d '{"seatId": 5, "userName": "User B", "email": "b@example.com"}'
```

Expected: One succeeds, one gets "seat locked" message.

### Test 3: View Statistics
```bash
curl http://localhost:3000/api/stats
```

---

## Performance Optimization

1. **Redis Connection Pooling**: Reuse Redis connections
2. **Lock Timeout Tuning**: Adjust based on average booking time
3. **Indexed Data**: Use Redis Sets for O(1) lookups
4. **Lua Scripts**: Atomic multi-command operations
5. **Async/Await**: Non-blocking I/O operations

---

## Common Issues and Solutions

### Issue 1: Redis Connection Error
**Solution:** Ensure Redis is running
```bash
sudo systemctl start redis
redis-cli ping
```

### Issue 2: All Seats Booked
**Solution:** Reset bookings
```bash
curl -X POST http://localhost:3000/api/reset
```

### Issue 3: Locks Not Releasing
**Solution:** Locks auto-expire after timeout. Check lock timeout in `.env`

---

## Future Enhancements

- [ ] Database integration (PostgreSQL/MongoDB)
- [ ] User authentication and sessions
- [ ] Payment gateway integration
- [ ] Email notifications
- [ ] Websocket for real-time updates
- [ ] Admin dashboard
- [ ] Booking expiry (hold seat for limited time)
- [ ] Waiting list functionality

---

## License

ISC

## Author

Concurrent Ticket Booking System - Learning Project

---

## Summary

This project demonstrates:
- ✅ Distributed locking with Redis
- ✅ Race condition prevention
- ✅ Concurrent request handling
- ✅ Atomic operations
- ✅ Load testing with Artillery
- ✅ RESTful API design
- ✅ Error handling and recovery

Perfect for understanding concurrency in distributed systems!
