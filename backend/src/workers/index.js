// Import queue definitions to ensure they're initialized
import '../queues/domain.queue.js';

import dnsUpdateWorker from './dnsUpdate.worker.js';
import domainRegistrationWorker from './domainRegistration.worker.js';
import domainRenewalWorker from './domainRenewal.worker.js';
import domainTransferWorker from './domainTransfer.worker.js';
import emailNotificationWorker from './emailNotification.worker.js';
import logger from '../utils/logger.js';

/**
 * Worker Process Entry Point
 * Starts all queue workers
 * 
 * Run with: npm run worker
 */

logger.info('🚀 Starting all workers...');


logger.info('📊 Workers Status:');
logger.info('  ✅ Domain Registration Worker: Running');
logger.info('  ✅ Domain Renewal Worker: Running');
logger.info('  ✅ DNS Update Worker: Running');
logger.info('  ✅ Domain Transfer Worker: Running');
logger.info('  ✅ Email Notification Worker: Running');

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`\n${signal} received. Closing workers gracefully...`);

  try {
    await Promise.all([
      domainRegistrationWorker.close(),
      domainRenewalWorker.close(),
      dnsUpdateWorker.close(),
      domainTransferWorker.close(),
      emailNotificationWorker.close(),
    ]);

    logger.info('✅ All workers closed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error closing workers:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Keep process alive
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

logger.info('✅ All workers started successfully. Press Ctrl+C to stop.');
