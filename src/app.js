const express = require('express');
const cors = require('cors');
const config = require('./config/app.config');
const requestLogger = require('./middleware/requestLogger.middleware');
const sessionId = require('./middleware/sessionId.middleware');
const errorHandler = require('./middleware/errorHandler.middleware');
const setupRoutes = require('./routes');

class App {
  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    // CORS
    this.app.use(cors(config.cors));
    
    // Body parsers
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    // Custom middleware
    this.app.use(sessionId);
    this.app.use(requestLogger);
    
    // Security headers
    this.app.use((req, res, next) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      next();
    });
  }

  setupRoutes() {
    setupRoutes(this.app);
  }

  setupErrorHandling() {
    this.app.use(errorHandler);
  }

  getApp() {
    return this.app;
  }
}

module.exports = new App().getApp();
