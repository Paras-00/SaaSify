import { Queue } from 'bullmq'; // BullMQ queue class for creating job queues
import logger from '../utils/logger.js'; // Custom logger for tracking queue activity

// Redis connection configuration used by all queues
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost', // Redis server host (env in prod, localhost in dev)
  port: parseInt(process.env.REDIS_PORT) || 6379, // Default Redis port
  password: process.env.REDIS_PASSWORD || undefined, // Password if Redis auth is enabled
  maxRetriesPerRequest: null, // Prevents Redis client from retrying forever (important for queue stability)
  enableReadyCheck: false, // Skips initial Redis ready check (avoids startup delays in workers)
};

/**
 * Domain Registration Queue
 * Handles background jobs for buying/registering domains
 */
export const domainRegistrationQueue = new Queue('domain-registration', {
  connection: redisConfig, // Connect queue to Redis
  defaultJobOptions: {
    attempts: 3, // Retry failed job up to 3 times
    backoff: {
      type: 'exponential', // Delay increases after each failure
      delay: 5000, // 5s → 25s → 125s retry pattern
    },
    removeOnComplete: {
      age: 86400, // Auto delete successful jobs after 24 hours
      count: 1000, // Or when 1000 completed jobs stored
    },
    removeOnFail: {
      age: 604800, // Keep failed jobs for 7 days for debugging
      count: 5000,
    },
  },
});

/**
 * Domain Renewal Queue
 * Processes domain renewal tasks
 */
export const domainRenewalQueue = new Queue('domain-renewal', {
  connection: redisConfig,
  defaultJobOptions: {
    attempts: 3, // Retry renewals 3 times
    backoff: {
      type: 'exponential',
      delay: 10000, // Longer retry delay since renewals are not instant-critical
    },
    removeOnComplete: { age: 86400, count: 1000 }, // Clean old success logs
    removeOnFail: { age: 604800, count: 5000 }, // Keep failed ones longer
  },
});

/**
 * DNS Update Queue
 * Handles DNS record modifications (A, CNAME, MX etc.)
 */
export const dnsUpdateQueue = new Queue('dns-update', {
  connection: redisConfig,
  defaultJobOptions: {
    attempts: 5, // DNS updates can fail due to propagation — more retries
    backoff: {
      type: 'exponential',
      delay: 3000, // Short retry delay (DNS APIs usually recover quickly)
    },
    removeOnComplete: { age: 43200, count: 500 }, // Keep only 12h of success jobs
    removeOnFail: { age: 259200, count: 2000 }, // Keep failed jobs for 3 days
  },
});

/**
 * Domain Transfer Queue
 * Handles domain transfers between registrars
 */
export const domainTransferQueue = new Queue('domain-transfer', {
  connection: redisConfig,
  defaultJobOptions: {
    attempts: 2, // Fewer retries to avoid transfer conflicts
    backoff: {
      type: 'fixed', // Fixed delay instead of exponential
      delay: 30000, // Wait 30s between retries (registrars need stable timing)
    },
    removeOnComplete: { age: 86400, count: 500 },
    removeOnFail: { age: 604800, count: 2000 },
  },
});

/**
 * Email Notification Queue
 * Sends transactional emails (receipts, confirmations, alerts)
 */
export const emailQueue = new Queue('email-notification', {
  connection: redisConfig,
  defaultJobOptions: {
    attempts: 5, // Email services often fail temporarily → more retries
    backoff: {
      type: 'exponential',
      delay: 2000, // Short delay because email APIs recover fast
    },
    removeOnComplete: { age: 3600, count: 100 }, // Keep success logs for 1 hour only
    removeOnFail: { age: 86400, count: 1000 }, // Keep failed emails for 24h
  },
});

/**
 * Function to attach event listeners to a queue
 * Helps monitor job lifecycle and errors
 */
const setupQueueEvents = (queue, name) => {
  queue.on('error', (error) => {
    logger.error(`Queue ${name} error:`, error); // Logs Redis/queue system errors
  });

  queue.on('waiting', (jobId) => {
    logger.debug(`Job ${jobId} waiting in ${name} queue`); // Job added but not yet processed
  });

  queue.on('active', (job) => {
    logger.info(`Job ${job.id} active in ${name} queue`); // Worker started processing job
  });

  queue.on('completed', (job) => {
    logger.info(`Job ${job.id} completed in ${name} queue`); // Job finished successfully
  });

  queue.on('failed', (job, error) => {
    logger.error(`Job ${job.id} failed in ${name} queue:`, error); // Job failed after retries
  });
};

// Attach monitoring to all queues
setupQueueEvents(domainRegistrationQueue, 'domain-registration');
setupQueueEvents(domainRenewalQueue, 'domain-renewal');
setupQueueEvents(dnsUpdateQueue, 'dns-update');
setupQueueEvents(domainTransferQueue, 'domain-transfer');
setupQueueEvents(emailQueue, 'email-notification');

logger.info('✅ All domain queues initialized'); // Confirms queues are ready at server startup

/**
 * Graceful shutdown handler
 * Ensures Redis connections close properly when server stops
 */
process.on('SIGTERM', async () => {
  logger.info('Closing domain queues...');

  await Promise.all([
    domainRegistrationQueue.close(), // Close Redis connection safely
    domainRenewalQueue.close(),
    dnsUpdateQueue.close(),
    domainTransferQueue.close(),
    emailQueue.close(),
  ]);

  logger.info('All domain queues closed successfully');
});
