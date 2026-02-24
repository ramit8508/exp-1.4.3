const redisConnection = require('../config/redis.config');
const config = require('../config/app.config');
const logger = require('../config/logger');

class DistributedLockService {
  constructor() {
    this.redisClient = null;
    this.lockTimeout = config.booking.lockTimeout;
  }

  async initialize() {
    this.redisClient = redisConnection.getClient();
    logger.info('Distributed Lock Service initialized');
  }

  /**
   * Acquire a distributed lock using Redis SET NX PX
   * @param {string|number} resourceId - Resource to lock (e.g., seatId)
   * @param {string} sessionId - Unique session identifier
   * @param {number} timeout - Lock timeout in milliseconds
   * @returns {Promise<boolean>} - True if lock acquired, false otherwise
   */
  async acquireLock(resourceId, sessionId, timeout = this.lockTimeout) {
    try {
      const lockKey = this.getLockKey(resourceId);
      
      // SET with NX (only if not exists) and PX (expiry in milliseconds)
      const result = await this.redisClient.set(lockKey, sessionId, {
        NX: true,
        PX: timeout
      });

      if (result === 'OK') {
        logger.debug(`Lock acquired: ${lockKey} by session ${sessionId}`);
        return true;
      }

      logger.debug(`Lock acquisition failed: ${lockKey} - already locked`);
      return false;
    } catch (error) {
      logger.error(`Error acquiring lock for ${resourceId}:`, error);
      return false;
    }
  }

  /**
   * Release a distributed lock (only if owned by the session)
   * @param {string|number} resourceId - Resource to unlock
   * @param {string} sessionId - Session identifier that owns the lock
   * @returns {Promise<boolean>} - True if lock released, false otherwise
   */
  async releaseLock(resourceId, sessionId) {
    try {
      const lockKey = this.getLockKey(resourceId);
      
      // Lua script ensures atomic check-and-delete
      // Only delete if the lock value matches our sessionId
      const luaScript = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;

      const result = await this.redisClient.eval(luaScript, {
        keys: [lockKey],
        arguments: [sessionId]
      });

      if (result === 1) {
        logger.debug(`Lock released: ${lockKey} by session ${sessionId}`);
        return true;
      }

      logger.warn(`Lock release failed: ${lockKey} - not owned by session ${sessionId}`);
      return false;
    } catch (error) {
      logger.error(`Error releasing lock for ${resourceId}:`, error);
      return false;
    }
  }

  /**
   * Check if a resource is currently locked
   * @param {string|number} resourceId - Resource to check
   * @returns {Promise<boolean>} - True if locked, false otherwise
   */
  async isLocked(resourceId) {
    try {
      const lockKey = this.getLockKey(resourceId);
      const value = await this.redisClient.get(lockKey);
      return value !== null;
    } catch (error) {
      logger.error(`Error checking lock for ${resourceId}:`, error);
      return false;
    }
  }

  /**
   * Extend lock expiry time (for long-running operations)
   * @param {string|number} resourceId - Resource identifier
   * @param {string} sessionId - Session identifier
   * @param {number} additionalTime - Additional time in milliseconds
   * @returns {Promise<boolean>} - True if extended, false otherwise
   */
  async extendLock(resourceId, sessionId, additionalTime) {
    try {
      const lockKey = this.getLockKey(resourceId);
      
      // Lua script to extend expiry only if we own the lock
      const luaScript = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("pexpire", KEYS[1], ARGV[2])
        else
          return 0
        end
      `;

      const result = await this.redisClient.eval(luaScript, {
        keys: [lockKey],
        arguments: [sessionId, additionalTime.toString()]
      });

      if (result === 1) {
        logger.debug(`Lock extended: ${lockKey} for ${additionalTime}ms`);
        return true;
      }

      return false;
    } catch (error) {
      logger.error(`Error extending lock for ${resourceId}:`, error);
      return false;
    }
  }

  /**
   * Get all currently locked resources
   * @returns {Promise<Array>} - Array of locked resource IDs
   */
  async getLockedResources() {
    try {
      const keys = await this.redisClient.keys('lock:*');
      return keys.map(key => key.replace('lock:', ''));
    } catch (error) {
      logger.error('Error getting locked resources:', error);
      return [];
    }
  }

  /**
   * Force release a lock (admin function - use with caution)
   * @param {string|number} resourceId - Resource to unlock
   * @returns {Promise<boolean>} - True if released, false otherwise
   */
  async forceReleaseLock(resourceId) {
    try {
      const lockKey = this.getLockKey(resourceId);
      const result = await this.redisClient.del(lockKey);
      
      if (result === 1) {
        logger.warn(`Lock force-released: ${lockKey}`);
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error(`Error force-releasing lock for ${resourceId}:`, error);
      return false;
    }
  }

  /**
   * Get standardized lock key
   * @param {string|number} resourceId - Resource identifier
   * @returns {string} - Redis lock key
   */
  getLockKey(resourceId) {
    return `lock:${resourceId}`;
  }

  /**
   * Get lock owner (session ID)
   * @param {string|number} resourceId - Resource identifier
   * @returns {Promise<string|null>} - Session ID or null
   */
  async getLockOwner(resourceId) {
    try {
      const lockKey = this.getLockKey(resourceId);
      return await this.redisClient.get(lockKey);
    } catch (error) {
      logger.error(`Error getting lock owner for ${resourceId}:`, error);
      return null;
    }
  }
}

// Singleton instance
const distributedLockService = new DistributedLockService();

module.exports = distributedLockService;
