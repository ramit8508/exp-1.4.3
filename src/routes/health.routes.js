const express = require('express');
const router = express.Router();
const healthController = require('../controllers/health.controller');

router.get('/health', healthController.healthCheck.bind(healthController));
router.get('/info', healthController.apiInfo.bind(healthController));

module.exports = router;
