import dotenv from 'dotenv';

// Load environment variables FIRST before any other imports
dotenv.config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

import app from './app.js';
import connectDB from './config/database.js';
import { connectRedis } from './config/redis.js';
import { initRateLimiters } from './middleware/rateLimit.middleware.js';
import logger from './utils/logger.js';

const PORT = process.env.PORT || 4000;

const startServer = async () => {
  try {

    await connectDB();
    logger.info('✓ MongoDB connected');

    await connectRedis();
    logger.info('✓ Redis connected');

    // Initialize rate limiters AFTER Redis is connected
    // (because rate limiters use Redis as storage)
    initRateLimiters();
    logger.info('✓ Rate limiters initialized');

    // Start the Express server and make it listen on the defined PORT
    const server = app.listen(PORT, () => {
      logger.info(`✓ Server running on port ${PORT}`);
      logger.info(`✓ Environment: ${process.env.NODE_ENV}`);
      logger.info(`✓ API URL: http://localhost:${PORT}/api`);
      logger.info('✓ Server started successfully');
    });

    // Graceful shutdown when the app receives a SIGTERM signal
    // (used by hosting providers like Docker, PM2, etc.)
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received. Shutting down gracefully...');
      
      // Stop accepting new requests and close the server
      server.close(() => {
        logger.info('Server closed');
        process.exit(0); // Exit process successfully
      });
    });

    // Graceful shutdown when Ctrl + C is pressed in terminal
    process.on('SIGINT', () => {
      logger.info('SIGINT received. Shutting down gracefully...');
      
      server.close(() => {
        logger.info('Server closed');
        process.exit(0); // Exit process successfully
      });
    });

    // Catch errors that were not handled anywhere in the code
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1); // Exit with failure
    });

    // Catch rejected promises that were not handled with .catch()
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1); // Exit with failure
    });

  } catch (error) {
    // If any error happens while starting the server, log and exit
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Call the function to actually start the server
startServer();
