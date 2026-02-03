import RedisStore from 'rate-limit-redis'; // Redis-backed storage for limits
import rateLimit from 'express-rate-limit'; // Express rate limiting middleware
import { redis } from '../../config/redis.js'; // Connected Redis client

let apiLimiter, searchLimiter, authLimiter; // Will be initialized after Redis connects

// Call this AFTER Redis connection is ready
export const initRateLimiters = () => {

  apiLimiter = rateLimit({
    store: new RedisStore({
      sendCommand: (...args) => redis.sendCommand(args), // Send commands to Redis
      prefix: 'rl:api:', // Redis key namespace for API limits
    }),
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // Time window
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // Max requests per IP
    standardHeaders: true, // Use modern rate limit headers
    legacyHeaders: false,
  });

  searchLimiter = rateLimit({
    store: new RedisStore({
      sendCommand: (...args) => redis.sendCommand(args),
      prefix: 'rl:search:', // Separate limits for search routes
    }),
    windowMs: 60 * 1000, // 1 minute window
    max: parseInt(process.env.RATE_LIMIT_DOMAIN_SEARCH) || 10, // Limit expensive searches
    standardHeaders: true,
    legacyHeaders: false,
  });

  authLimiter = rateLimit({
    store: new RedisStore({
      sendCommand: (...args) => redis.sendCommand(args),
      prefix: 'rl:auth:', // Separate limits for login attempts
    }),
    windowMs: 15 * 60 * 1000,
    max: 5, // Prevent brute-force login
    skipSuccessfulRequests: true, // Only count failed logins
    standardHeaders: true,
    legacyHeaders: false,
  });
};


// Wrapper prevents crash if Redis/limiters not ready
export const apiLimiterMiddleware = (req, res, next) => {
  if (!apiLimiter) return res.status(503).json({ success: false, error: 'Service temporarily unavailable' });
  return apiLimiter(req, res, next);
};

export const searchLimiterMiddleware = (req, res, next) => {
  if (!searchLimiter) return res.status(503).json({ success: false, error: 'Service temporarily unavailable' });
  return searchLimiter(req, res, next);
};

export const authLimiterMiddleware = (req, res, next) => {
  if (!authLimiter) return res.status(503).json({ success: false, error: 'Service temporarily unavailable' });
  return authLimiter(req, res, next);
};


// For trusted webhooks — limiter effectively disabled
export const noLimit = rateLimit({
  skip: () => true, // Always skip limiting
});
