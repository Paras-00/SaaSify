import Client from '../models/Client.js';
import User from '../models/User.js';
import { Worker } from 'bullmq';
import emailService from '../services/email.service.js';
import logger from '../utils/logger.js';

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
};

/**
 * Email Notification Worker
 * Handles all email notifications for the platform
 */
const emailNotificationWorker = new Worker(
  'email-notification',
  async (job) => {
    const { userId, clientId, type } = job.data;

    logger.info(`Processing email: ${type} for user ${userId || clientId}`);

    try {
      // Get user/client email
      let email, name;

      if (userId) {
        const user = await User.findById(userId).select('email firstName lastName');
        if (!user) {
          throw new Error(`User ${userId} not found`);
        }
        email = user.email;
        name = `${user.firstName} ${user.lastName}`;
      } else if (clientId) {
        const client = await Client.findById(clientId).select('email firstName lastName');
        if (!client) {
          throw new Error(`Client ${clientId} not found`);
        }
        email = client.email;
        name = `${client.firstName} ${client.lastName}`;
      } else {
        throw new Error('No userId or clientId provided');
      }

      // Send email based on type
      let result;

      switch (type) {
        case 'domain-registered':
          result = await emailService.sendEmail({
            to: email,
            subject: `Domain Registration Successful - ${job.data.domain}`,
            template: 'domain-registered',
            context: {
              name,
              domain: job.data.domain,
              expiresAt: new Date(job.data.expiresAt).toLocaleDateString(),
              orderId: job.data.orderId,
            },
          });
          break;

        case 'domain-registration-failed':
          result = await emailService.sendEmail({
            to: email,
            subject: `Domain Registration Failed - ${job.data.domain}`,
            template: 'domain-registration-failed',
            context: {
              name,
              domain: job.data.domain,
              error: job.data.error,
              orderId: job.data.orderId,
            },
          });
          break;

        case 'domain-renewed':
          result = await emailService.sendEmail({
            to: email,
            subject: `Domain Renewed - ${job.data.domain}`,
            template: 'domain-renewed',
            context: {
              name,
              domain: job.data.domain,
              period: job.data.period,
              newExpiry: new Date(job.data.newExpiry).toLocaleDateString(),
              amount: job.data.amount,
            },
          });
          break;

        case 'domain-renewal-failed':
          result = await emailService.sendEmail({
            to: email,
            subject: `Domain Renewal Failed - ${job.data.domain}`,
            template: 'domain-renewal-failed',
            context: {
              name,
              domain: job.data.domain,
              error: job.data.error,
            },
          });
          break;

        case 'domain-expiring':
          result = await emailService.sendEmail({
            to: email,
            subject: `Domain Expiring Soon - ${job.data.domain}`,
            template: 'domain-expiring',
            context: {
              name,
              domain: job.data.domain,
              expiresAt: new Date(job.data.expiresAt).toLocaleDateString(),
              daysRemaining: job.data.daysRemaining,
              renewalUrl: `${process.env.FRONTEND_URL}/domains/${job.data.domainId}/renew`,
            },
          });
          break;

        case 'domain-expired':
          result = await emailService.sendEmail({
            to: email,
            subject: `Domain Expired - ${job.data.domain}`,
            template: 'domain-expired',
            context: {
              name,
              domain: job.data.domain,
              expiredAt: new Date(job.data.expiredAt).toLocaleDateString(),
              gracePeriodDays: 30,
            },
          });
          break;

        case 'domain-transfer-complete':
          result = await emailService.sendEmail({
            to: email,
            subject: `Domain Transfer Complete - ${job.data.domain}`,
            template: 'domain-transfer-complete',
            context: {
              name,
              domain: job.data.domain,
            },
          });
          break;

        case 'domain-transfer-failed':
          result = await emailService.sendEmail({
            to: email,
            subject: `Domain Transfer Failed - ${job.data.domain}`,
            template: 'domain-transfer-failed',
            context: {
              name,
              domain: job.data.domain,
              reason: job.data.reason,
            },
          });
          break;

        case 'dns-update-failed':
          result = await emailService.sendEmail({
            to: email,
            subject: `DNS Update Failed - ${job.data.domain}`,
            template: 'dns-update-failed',
            context: {
              name,
              domain: job.data.domain,
              operation: job.data.operation,
              error: job.data.error,
            },
          });
          break;

        case 'auto-renew-failed':
          result = await emailService.sendEmail({
            to: email,
            subject: `Auto-Renewal Failed - ${job.data.domain}`,
            template: 'auto-renew-failed',
            context: {
              name,
              domain: job.data.domain,
              reason: job.data.reason,
              expiresAt: new Date(job.data.expiresAt).toLocaleDateString(),
            },
          });
          break;

        default:
          throw new Error(`Unknown email type: ${type}`);
      }

      logger.info(`✅ Email sent successfully: ${type} to ${email}`);

      return {
        success: true,
        type,
        email,
        messageId: result?.messageId,
      };
    } catch (error) {
      logger.error(`Failed to send email ${type}:`, error);

      // Don't retry for certain errors
      if (error.message.includes('not found') || error.message.includes('invalid email')) {
        logger.warn(`Skipping retry for email ${type} due to: ${error.message}`);
        return {
          success: false,
          type,
          error: error.message,
          skipRetry: true,
        };
      }

      throw error;
    }
  },
  {
    connection: redisConfig,
    concurrency: 10, // Process 10 emails at a time
    limiter: {
      max: 100,
      duration: 60000, // Max 100 emails per minute
    },
  }
);

// Worker event handlers
emailNotificationWorker.on('completed', (job) => {
  logger.info(`Email job ${job.id} completed`);
});

emailNotificationWorker.on('failed', (job, error) => {
  // Check if we should skip retry
  if (job.returnvalue?.skipRetry) {
    logger.warn(`Email job ${job.id} failed (no retry): ${error.message}`);
  } else {
    logger.error(`Email job ${job.id} failed:`, error.message);
  }
});

emailNotificationWorker.on('error', (error) => {
  logger.error('Email notification worker error:', error);
});

logger.info('✅ Email notification worker started');

export default emailNotificationWorker;
