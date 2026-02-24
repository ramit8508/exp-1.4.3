require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB) || 0
  },
  
  booking: {
    totalSeats: parseInt(process.env.TOTAL_SEATS) || 50,
    lockTimeout: parseInt(process.env.LOCK_TIMEOUT) || 5000, // 5 seconds
    processingMinDelay: parseInt(process.env.PROCESSING_MIN_DELAY) || 100,
    processingMaxDelay: parseInt(process.env.PROCESSING_MAX_DELAY) || 300
  },
  
  api: {
    prefix: '/api',
    version: 'v1'
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
  }
};
