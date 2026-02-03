import Domain from '../models/Domain.js';
import cron from 'node-cron';
import { domainTransferQueue } from '../queues/domain.queue.js';
import logger from '../utils/logger.js';

/**
 * Transfer Status Check Cron Job
 * Runs every hour
 * Checks status of pending domain transfers
 */
const transferStatusCron = cron.schedule(
  '0 * * * *', // Every hour at minute 0
  async () => {
    logger.info('🔄 Running transfer status check...');

    try {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Find domains with pending transfers
      // Only check if not checked in the last hour
      const pendingTransfers = await Domain.find({
        status: { $in: ['pending_transfer', 'transfer_initiated'] },
        $or: [
          { transferLastChecked: { $exists: false } },
          { transferLastChecked: { $lt: new Date(now.getTime() - 60 * 60 * 1000) } },
        ],
      })
        .populate('userId', '_id')
        .lean();

      logger.info(`Found ${pendingTransfers.length} pending transfers to check`);

      let queuedCount = 0;

      for (const domain of pendingTransfers) {
        try {
          // Queue transfer status check job
          await domainTransferQueue.add(
            'check-status',
            {
              domainId: domain._id,
              domain: domain.domainName,
              userId: domain.userId._id,
              operation: 'check-status',
            },
            {
              priority: 3,
              attempts: 2,
            }
          );

          queuedCount++;
        } catch (error) {
          logger.error(
            `Failed to queue transfer status check for ${domain.domainName}:`,
            error
          );
        }
      }

      // Check for transfers that have been pending too long (> 14 days)
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      const stalledTransfers = await Domain.find({
        status: { $in: ['pending_transfer', 'transfer_initiated'] },
        createdAt: { $lt: fourteenDaysAgo },
      });

      if (stalledTransfers.length > 0) {
        logger.warn(
          `⚠️ Found ${stalledTransfers.length} transfers pending for more than 14 days`
        );

        for (const domain of stalledTransfers) {
          // Mark as attention needed
          await Domain.findByIdAndUpdate(domain._id, {
            transferStatus: 'stalled',
            transferNeedsAttention: true,
          });

          logger.warn(`Marked transfer as stalled: ${domain.domainName}`);
        }
      }

      // Check for very old pending transfers (> 30 days) and mark as failed
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const failedTransfers = await Domain.find({
        status: { $in: ['pending_transfer', 'transfer_initiated'] },
        createdAt: { $lt: thirtyDaysAgo },
      });

      if (failedTransfers.length > 0) {
        logger.warn(
          `⚠️ Found ${failedTransfers.length} transfers pending for more than 30 days, marking as failed`
        );

        for (const domain of failedTransfers) {
          await Domain.findByIdAndUpdate(domain._id, {
            status: 'transfer_failed',
            transferStatus: 'failed',
            transferFailureReason: 'Transfer timed out after 30 days',
          });

          logger.warn(`Marked transfer as failed: ${domain.domainName}`);
        }
      }

      logger.info(
        `✅ Transfer status check completed. Queued: ${queuedCount}, Stalled: ${stalledTransfers.length}, Failed: ${failedTransfers.length}`
      );
    } catch (error) {
      logger.error('Transfer status cron job failed:', error);
    }
  },
  {
    scheduled: false,
    timezone: 'UTC',
  }
);

export default transferStatusCron;
