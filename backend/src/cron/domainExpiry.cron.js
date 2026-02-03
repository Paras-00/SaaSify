import Domain from '../models/Domain.js';
import cron from 'node-cron';
import { emailQueue } from '../queues/domain.queue.js';
import logger from '../utils/logger.js';

/**
 * Domain Expiry Monitoring Cron Job
 * Runs daily at 2:00 AM
 * Checks for domains expiring in 30, 7, and 1 day(s) and sends reminders
 */
const domainExpiryCron = cron.schedule(
  '0 2 * * *', // Every day at 2:00 AM
  async () => {
    logger.info('🔄 Running domain expiry check...');

    try {
      const now = new Date();

      // Calculate dates for 30, 7, and 1 day from now
      const dates = [
        { days: 30, start: new Date(now.getTime() + 29 * 24 * 60 * 60 * 1000), end: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) },
        { days: 7, start: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000), end: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) },
        { days: 1, start: new Date(now.getTime() + 0 * 24 * 60 * 60 * 1000), end: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000) },
      ];

      let totalNotifications = 0;

      for (const { days, start, end } of dates) {
        // Find active domains expiring in this window
        const expiringDomains = await Domain.find({
          status: 'active',
          expiresAt: { $gte: start, $lt: end },
          // Don't send notification if already sent today
          $or: [
            { lastExpiryReminderAt: { $exists: false } },
            { lastExpiryReminderAt: { $lt: new Date(now.getTime() - 23 * 60 * 60 * 1000) } },
          ],
        })
          .populate('userId', 'email firstName lastName')
          .lean();

        logger.info(`Found ${expiringDomains.length} domains expiring in ${days} day(s)`);

        // Queue email notifications
        for (const domain of expiringDomains) {
          try {
            await emailQueue.add(
              'domain-expiring',
              {
                userId: domain.userId._id,
                domain: domain.domainName,
                domainId: domain._id,
                expiresAt: domain.expiresAt,
                daysRemaining: days,
              },
              {
                priority: days === 1 ? 1 : days === 7 ? 2 : 3, // Higher priority for closer expiry
              }
            );

            // Update last reminder sent time
            await Domain.findByIdAndUpdate(domain._id, {
              lastExpiryReminderAt: now,
            });

            totalNotifications++;
          } catch (error) {
            logger.error(`Failed to queue expiry reminder for ${domain.domainName}:`, error);
          }
        }
      }

      // Check for already expired domains
      const expiredDomains = await Domain.find({
        status: 'active',
        expiresAt: { $lt: now },
      })
        .populate('userId', 'email firstName lastName')
        .lean();

      logger.info(`Found ${expiredDomains.length} expired domains`);

      for (const domain of expiredDomains) {
        try {
          // Update domain status
          await Domain.findByIdAndUpdate(domain._id, {
            status: 'expired',
            expiredAt: domain.expiresAt,
          });

          // Send expiry notification
          await emailQueue.add(
            'domain-expired',
            {
              userId: domain.userId._id,
              domain: domain.domainName,
              expiredAt: domain.expiresAt,
            },
            { priority: 1 }
          );

          totalNotifications++;
        } catch (error) {
          logger.error(`Failed to process expired domain ${domain.domainName}:`, error);
        }
      }

      logger.info(
        `✅ Domain expiry check completed. Sent ${totalNotifications} notifications, marked ${expiredDomains.length} as expired`
      );
    } catch (error) {
      logger.error('Domain expiry cron job failed:', error);
    }
  },
  {
    scheduled: false, // Don't start automatically
    timezone: 'UTC',
  }
);

export default domainExpiryCron;
