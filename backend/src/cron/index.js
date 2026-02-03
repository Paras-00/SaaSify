import autoRenewCron from './autoRenew.cron.js';
import domainExpiryCron from './domainExpiry.cron.js';
import logger from '../utils/logger.js';
import paymentRemindersCron from './paymentReminders.cron.js';
import serviceSuspensionCron from './serviceSuspension.cron.js';
import serviceTerminationCron from './serviceTermination.cron.js';
import transferStatusCron from './transferStatus.cron.js';

/**
 * Cron Jobs Manager
 * Starts all scheduled cron jobs
 */

logger.info('🕐 Starting all cron jobs...');

// Start domain-related cron jobs
domainExpiryCron.start();
autoRenewCron.start();
transferStatusCron.start();

// Start billing-related cron jobs
paymentRemindersCron();
serviceSuspensionCron();
serviceTerminationCron();

logger.info('📅 Cron Jobs Scheduled:');
logger.info('  ✅ Domain Expiry Check: Daily at 2:00 AM UTC');
logger.info('  ✅ Auto-Renewal: Daily at 3:00 AM UTC');
logger.info('  ✅ Transfer Status Check: Every hour');
logger.info('  ✅ Payment Reminders: Daily at 10:00 AM UTC');
logger.info('  ✅ Service Suspension: Every 6 hours');
logger.info('  ✅ Service Termination: Daily at 3:00 AM UTC');

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`\n${signal} received. Stopping all cron jobs...`);

  domainExpiryCron.stop();
  autoRenewCron.stop();
  transferStatusCron.stop();

  logger.info('✅ All cron jobs stopped successfully');
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

logger.info('✅ All cron jobs started successfully. Press Ctrl+C to stop.');
