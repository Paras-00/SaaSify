import { createClient } from 'redis';
import logger from '../utils/logger.js';

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  database: parseInt(process.env.REDIS_DB) || 0,
};

// Create Redis client
export const redis = createClient({
  socket: {
    host: redisConfig.host,
    port: redisConfig.port,
    tls: process.env.REDIS_TLS === 'true',
  },
  password: redisConfig.password,
  database: redisConfig.database,
});

// Error handling
redis.on('error', (err) => {
  logger.error('Redis Client Error:', err);
});

redis.on('connect', () => {
  logger.info('Redis Client Connecting...');
});

redis.on('ready', () => {
  logger.info(`Redis Connected: ${redisConfig.host}:${redisConfig.port}`);
});

redis.on('reconnecting', () => {
  logger.warn('Redis Client Reconnecting...');
});

redis.on('end', () => {
  logger.warn('Redis Client Connection Ended');
});

// Connect to Redis
export const connectRedis = async () => {
  try {
    await redis.connect();
  } catch (error) {
    logger.error('Redis connection failed:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  await redis.quit();
  logger.info('Redis connection closed due to app termination');
  process.exit(0);
});

export default redis;
