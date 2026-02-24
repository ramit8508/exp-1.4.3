const { createClient } = require('redis');
const config = require('./app.config');

class RedisConnection {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      this.client = createClient({
        socket: {
          host: config.redis.host,
          port: config.redis.port
        },
        password: config.redis.password,
        database: config.redis.db
      });

      this.client.on('error', (err) => {
        console.error('❌ Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('🔗 Connecting to Redis...');
      });

      this.client.on('ready', () => {
        console.log('✅ Redis connection ready');
        this.isConnected = true;
      });

      this.client.on('end', () => {
        console.log('⚠️  Redis connection closed');
        this.isConnected = false;
      });

      await this.client.connect();
      return this.client;
    } catch (error) {
      console.error('❌ Failed to connect to Redis:', error);
      throw error;
    }
  }

  getClient() {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client is not connected');
    }
    return this.client;
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
      console.log('✅ Redis disconnected successfully');
    }
  }

  async healthCheck() {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      return false;
    }
  }
}

// Singleton instance
const redisConnection = new RedisConnection();

module.exports = redisConnection;
