import ActivityLog from '../models/ActivityLog.js';
import Domain from '../models/Domain.js';
import { Worker } from 'bullmq';
import { emailQueue } from '../queues/domain.queue.js';
import godaddyService from '../services/godaddy.service.js';
import logger from '../utils/logger.js';

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
};

/**
 * Domain Transfer Worker
 * Handles domain transfer status checks and updates
 */
const domainTransferWorker = new Worker(
  'domain-transfer',
  async (job) => {
    const { domainId, domain, userId, operation = 'check-status' } = job.data;

    logger.info(`Processing transfer ${operation} for domain ${domain}`);

    try {
      if (operation === 'check-status') {
        // Check transfer status from GoDaddy
        const transferStatus = await godaddyService.getTransferStatus(domain);

        // Find domain in database
        const domainRecord = await Domain.findById(domainId);
        if (!domainRecord) {
          throw new Error(`Domain ${domainId} not found`);
        }

        const previousStatus = domainRecord.transferStatus;
        const currentStatus = transferStatus.status || 'unknown';

        // Update domain if status changed
        if (previousStatus !== currentStatus) {
          domainRecord.transferStatus = currentStatus;
          domainRecord.transferLastChecked = new Date();

          // If transfer completed successfully
          if (currentStatus === 'complete' || currentStatus === 'completed') {
            domainRecord.status = 'active';
            domainRecord.registeredAt = new Date();

            // Set expiry date (1 year from now by default)
            if (!domainRecord.expiresAt) {
              domainRecord.expiresAt = new Date(
                Date.now() + 365 * 24 * 60 * 60 * 1000
              );
            }

            // Send success email
            await emailQueue.add('domain-transfer-complete', {
              userId,
              domain,
              domainId,
            });

            logger.info(`✅ Transfer completed for ${domain}`);
          }

          // If transfer failed
          if (currentStatus === 'failed' || currentStatus === 'cancelled') {
            domainRecord.status = 'transfer_failed';

            // Send failure email
            await emailQueue.add('domain-transfer-failed', {
              userId,
              domain,
              reason: transferStatus.reason || 'Unknown reason',
            });

            logger.warn(`Transfer failed for ${domain}: ${transferStatus.reason}`);
          }

          await domainRecord.save();

          // Log activity if status changed
          await ActivityLog.create({
            userId,
            action: 'domain_transfer_status_updated',
            category: 'domain',
            description: `Transfer status updated for ${domain}: ${previousStatus} → ${currentStatus}`,
            metadata: {
              domainId,
              domain,
              previousStatus,
              currentStatus,
              transferStatus,
            },
            status: 'success',
          });
        } else {
          // Status unchanged, just update last checked time
          domainRecord.transferLastChecked = new Date();
          await domainRecord.save();
        }

        return {
          success: true,
          domain,
          status: currentStatus,
          statusChanged: previousStatus !== currentStatus,
        };
      }

      throw new Error(`Unknown transfer operation: ${operation}`);
    } catch (error) {
      logger.error(`Transfer ${operation} failed for ${domain}:`, error);

      // Log failure
      if (userId) {
        await ActivityLog.create({
          userId,
          action: 'domain_transfer_check_failed',
          category: 'domain',
          description: `Failed to check transfer status for ${domain}`,
          metadata: {
            domainId,
            domain,
            error: error.message,
          },
          status: 'failed',
        });
      }

      throw error;
    }
  },
  {
    connection: redisConfig,
    concurrency: 3, // Process 3 transfer checks at a time
    limiter: {
      max: 10,
      duration: 60000, // Max 10 checks per minute
    },
  }
);

// Worker event handlers
domainTransferWorker.on('completed', (job) => {
  logger.info(`Transfer job ${job.id} completed`);
});

domainTransferWorker.on('failed', (job, error) => {
  logger.error(`Transfer job ${job.id} failed:`, error.message);
});

domainTransferWorker.on('error', (error) => {
  logger.error('Domain transfer worker error:', error);
});

logger.info('✅ Domain transfer worker started');

export default domainTransferWorker;
