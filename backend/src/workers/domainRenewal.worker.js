import ActivityLog from '../models/ActivityLog.js';
import Domain from '../models/Domain.js';
import Invoice from '../models/Invoice.js';
import Transaction from '../models/Transaction.js';
import { Worker } from 'bullmq';
import { emailQueue } from '../queues/domain.queue.js';
import godaddyService from '../services/godaddy.service.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
};

/**
 * Domain Renewal Worker
 * Processes domain renewal requests
 */
const domainRenewalWorker = new Worker(
  'domain-renewal',
  async (job) => {
    const { domainId, userId, period = 1, invoiceId } = job.data;

    logger.info(`Processing renewal for domain ${domainId}`);

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find the domain
      const domain = await Domain.findById(domainId).session(session);
      if (!domain) {
        throw new Error(`Domain ${domainId} not found`);
      }

      if (domain.status !== 'active') {
        throw new Error(`Domain ${domain.domainName} is not active (status: ${domain.status})`);
      }

      // Renew domain with GoDaddy
      logger.info(`Renewing domain ${domain.domainName} for ${period} year(s)...`);
      const renewalResult = await godaddyService.renewDomain(domain.domainName, period);

      // Update domain expiry date
      const currentExpiry = new Date(domain.expiresAt);
      const newExpiry = new Date(
        currentExpiry.getTime() + period * 365 * 24 * 60 * 60 * 1000
      );

      domain.expiresAt = newExpiry;
      domain.lastRenewalAt = new Date();
      domain.autoRenewAttempts = 0; // Reset auto-renew attempts

      await domain.save({ session });

      // Update invoice if provided
      if (invoiceId) {
        const invoice = await Invoice.findById(invoiceId).session(session);
        if (invoice) {
          invoice.status = 'paid';
          invoice.paidAt = new Date();
          await invoice.save({ session });

          // Update transaction
          if (invoice.transactionId) {
            await Transaction.findByIdAndUpdate(
              invoice.transactionId,
              {
                status: 'completed',
                metadata: {
                  ...invoice.metadata,
                  renewalOrderId: renewalResult.orderId,
                },
              },
              { session }
            );
          }
        }
      }

      // Log activity
      await ActivityLog.create(
        [
          {
            userId,
            action: 'domain_renewed',
            category: 'domain',
            description: `Successfully renewed domain: ${domain.domainName} for ${period} year(s)`,
            metadata: {
              domainId,
              period,
              newExpiry: newExpiry.toISOString(),
              renewalOrderId: renewalResult.orderId,
            },
            status: 'success',
          },
        ],
        { session }
      );

      // Commit transaction
      await session.commitTransaction();

      // Send renewal confirmation email
      await emailQueue.add('domain-renewed', {
        userId,
        domain: domain.domainName,
        period,
        newExpiry,
        amount: renewalResult.total,
      });

      logger.info(`✅ Domain ${domain.domainName} renewed successfully`);

      return {
        success: true,
        domain: domain.domainName,
        newExpiry,
        orderId: renewalResult.orderId,
      };
    } catch (error) {
      await session.abortTransaction();
      logger.error('Domain renewal failed:', error);

      // Increment auto-renew attempts if auto-renew triggered this
      try {
        const domain = await Domain.findById(domainId);
        if (domain && domain.autoRenew) {
          domain.autoRenewAttempts = (domain.autoRenewAttempts || 0) + 1;
          await domain.save();
        }

        // Send failure email
        await emailQueue.add('domain-renewal-failed', {
          userId,
          domain: domain?.domainName || 'Unknown',
          error: error.message,
          domainId,
        });

        // Log failure
        await ActivityLog.create({
          userId,
          action: 'domain_renewal_failed',
          category: 'domain',
          description: `Failed to renew domain: ${domain?.domainName || domainId}`,
          metadata: {
            domainId,
            error: error.message,
          },
          status: 'failed',
        });
      } catch (updateError) {
        logger.error('Failed to update domain after renewal failure:', updateError);
      }

      throw error;
    } finally {
      session.endSession();
    }
  },
  {
    connection: redisConfig,
    concurrency: 2, // Process 2 renewals at a time
    limiter: {
      max: 5,
      duration: 60000, // Max 5 renewals per minute
    },
  }
);

// Worker event handlers
domainRenewalWorker.on('completed', (job) => {
  logger.info(`Renewal job ${job.id} completed`);
});

domainRenewalWorker.on('failed', (job, error) => {
  logger.error(`Renewal job ${job.id} failed:`, error.message);
});

domainRenewalWorker.on('error', (error) => {
  logger.error('Domain renewal worker error:', error);
});

logger.info('✅ Domain renewal worker started');

export default domainRenewalWorker;
