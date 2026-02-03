import { domainRenewalQueue, emailQueue } from '../queues/domain.queue.js';

import Client from '../models/Client.js';
import Domain from '../models/Domain.js';
import Invoice from '../models/Invoice.js';
import cron from 'node-cron';
import godaddyService from '../services/godaddy.service.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

/**
 * Auto-Renewal Cron Job
 * Runs daily at 3:00 AM
 * Automatically renews domains with auto-renew enabled that are expiring within 7 days
 */
const autoRenewCron = cron.schedule(
  '0 3 * * *', // Every day at 3:00 AM
  async () => {
    logger.info('🔄 Running auto-renewal check...');

    try {
      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Find domains eligible for auto-renewal
      const domainsToRenew = await Domain.find({
        status: 'active',
        autoRenew: true,
        expiresAt: { $lte: sevenDaysFromNow, $gte: now },
        // Don't attempt if already tried 3+ times
        $or: [
          { autoRenewAttempts: { $exists: false } },
          { autoRenewAttempts: { $lt: 3 } },
        ],
      })
        .populate('userId', '_id')
        .lean();

      logger.info(`Found ${domainsToRenew.length} domains eligible for auto-renewal`);

      let successCount = 0;
      let failCount = 0;

      for (const domain of domainsToRenew) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
          // Get client wallet balance
          const client = await Client.findOne({ userId: domain.userId._id })
            .session(session);

          if (!client) {
            throw new Error('Client not found');
          }

          // Get domain pricing
          const tld = domain.domainName.split('.').pop();
          const pricing = await godaddyService.getDomainPricing(tld);
          const renewalPrice = pricing.prices.renewal[1];

          // Check if client has sufficient balance
          if (client.walletBalance < renewalPrice) {
            throw new Error(
              `Insufficient wallet balance. Required: $${renewalPrice}, Available: $${client.walletBalance}`
            );
          }

          // Deduct from wallet
          client.walletBalance -= renewalPrice;
          await client.save({ session });

          // Create invoice for the renewal
          const invoice = await Invoice.create(
            [
              {
                userId: domain.userId._id,
                clientId: client._id,
                invoiceNumber: `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                items: [
                  {
                    description: `Domain Renewal - ${domain.domainName}`,
                    quantity: 1,
                    unitPrice: renewalPrice,
                    total: renewalPrice,
                  },
                ],
                subtotal: renewalPrice,
                tax: 0,
                total: renewalPrice,
                status: 'paid',
                paidAt: now,
                dueDate: now,
                paymentMethod: 'wallet',
              },
            ],
            { session }
          );

          await session.commitTransaction();

          // Queue renewal job
          await domainRenewalQueue.add(
            'auto-renew',
            {
              domainId: domain._id,
              userId: domain.userId._id,
              period: 1,
              invoiceId: invoice[0]._id,
            },
            {
              priority: 2, // Higher priority for auto-renewals
              attempts: 3,
            }
          );

          successCount++;
          logger.info(`✅ Queued auto-renewal for ${domain.domainName}`);
        } catch (error) {
          await session.abortTransaction();

          failCount++;
          logger.error(`Failed to auto-renew ${domain.domainName}:`, error.message);

          // Increment attempt counter
          await Domain.findByIdAndUpdate(domain._id, {
            $inc: { autoRenewAttempts: 1 },
          });

          // Send notification about failed auto-renewal
          await emailQueue.add('auto-renew-failed', {
            userId: domain.userId._id,
            domain: domain.domainName,
            reason: error.message,
            expiresAt: domain.expiresAt,
          });

          // If max attempts reached, disable auto-renewal
          const updatedDomain = await Domain.findById(domain._id);
          if (updatedDomain.autoRenewAttempts >= 3) {
            updatedDomain.autoRenew = false;
            await updatedDomain.save();
            logger.warn(
              `Auto-renewal disabled for ${domain.domainName} after 3 failed attempts`
            );
          }
        } finally {
          session.endSession();
        }
      }

      logger.info(
        `✅ Auto-renewal check completed. Success: ${successCount}, Failed: ${failCount}`
      );
    } catch (error) {
      logger.error('Auto-renewal cron job failed:', error);
    }
  },
  {
    scheduled: false,
    timezone: 'UTC',
  }
);

export default autoRenewCron;
