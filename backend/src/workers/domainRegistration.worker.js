import ActivityLog from '../models/ActivityLog.js';
import Domain from '../models/Domain.js';
import Order from '../models/Order.js';
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
 * Domain Registration Worker
 * Processes domain registration orders with GoDaddy
 */
const domainRegistrationWorker = new Worker(
  'domain-registration',
  async (job) => {
    const { orderId, domainId, userId, domainData } = job.data;

    logger.info(`Processing domain registration for order ${orderId}`);

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find the order
      const order = await Order.findById(orderId).session(session);
      if (!order) {
        throw new Error(`Order ${orderId} not found`);
      }

      // Find the domain
      const domain = await Domain.findById(domainId).session(session);
      if (!domain) {
        throw new Error(`Domain ${domainId} not found`);
      }

      // Update order status to processing
      order.status = 'processing';
      await order.save({ session });

      // Attempt domain registration with GoDaddy
      logger.info(`Registering domain ${domain.domainName} with GoDaddy...`);
      const registrationResult = await godaddyService.registerDomain(domainData);

      // Update domain record
      domain.status = 'active';
      domain.registrarDomainId = registrationResult.orderId;
      domain.registeredAt = new Date();
      domain.expiresAt = new Date(
        Date.now() + domain.registrationPeriod * 365 * 24 * 60 * 60 * 1000
      );
      domain.autoRenew = domainData.renewAuto || false;
      domain.privacyProtection = domainData.privacy || false;
      domain.nameServers = domainData.nameServers || [];

      await domain.save({ session });

      // Update order status
      order.status = 'completed';
      order.completedAt = new Date();
      await order.save({ session });

      // Update transaction
      if (order.transactionId) {
        await Transaction.findByIdAndUpdate(
          order.transactionId,
          {
            status: 'completed',
            metadata: {
              ...order.metadata,
              registrarOrderId: registrationResult.orderId,
            },
          },
          { session }
        );
      }

      // Log activity
      await ActivityLog.create(
        [
          {
            userId,
            action: 'domain_registered',
            category: 'domain',
            description: `Successfully registered domain: ${domain.domainName}`,
            metadata: {
              orderId,
              domainId,
              registrarOrderId: registrationResult.orderId,
            },
            status: 'success',
          },
        ],
        { session }
      );

      // Commit transaction
      await session.commitTransaction();

      // Send success email (outside transaction)
      await emailQueue.add('domain-registered', {
        userId,
        domain: domain.domainName,
        expiresAt: domain.expiresAt,
        orderId,
      });

      logger.info(`✅ Domain ${domain.domainName} registered successfully`);

      return {
        success: true,
        domain: domain.domainName,
        orderId: registrationResult.orderId,
      };
    } catch (error) {
      await session.abortTransaction();
      logger.error('Domain registration failed:', error);

      // Update order to failed
      try {
        await Order.findByIdAndUpdate(orderId, {
          status: 'failed',
          failureReason: error.message,
        });

        // Send failure email
        await emailQueue.add('domain-registration-failed', {
          userId,
          domain: domainData.domain,
          error: error.message,
          orderId,
        });

        // Log failure
        await ActivityLog.create({
          userId,
          action: 'domain_registration_failed',
          category: 'domain',
          description: `Failed to register domain: ${domainData.domain}`,
          metadata: {
            orderId,
            error: error.message,
          },
          status: 'failed',
        });
      } catch (updateError) {
        logger.error('Failed to update order status:', updateError);
      }

      throw error;
    } finally {
      session.endSession();
    }
  },
  {
    connection: redisConfig,
    concurrency: 3, // Process 3 registrations at a time
    limiter: {
      max: 10, // Max 10 registrations
      duration: 60000, // Per minute
    },
  }
);

// Worker event handlers
domainRegistrationWorker.on('completed', (job) => {
  logger.info(`Registration job ${job.id} completed`);
});

domainRegistrationWorker.on('failed', (job, error) => {
  logger.error(`Registration job ${job.id} failed:`, error.message);
});

domainRegistrationWorker.on('error', (error) => {
  logger.error('Domain registration worker error:', error);
});

logger.info('✅ Domain registration worker started');

export default domainRegistrationWorker;
