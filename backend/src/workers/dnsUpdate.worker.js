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
 * DNS Update Worker
 * Handles DNS record updates for domains
 */
const dnsUpdateWorker = new Worker(
  'dns-update',
  async (job) => {
    const { domainId, domain, record, operation, userId, type, name } = job.data;

    logger.info(`Processing DNS ${operation} for domain ${domain}`);

    try {
      let result;

      switch (operation) {
        case 'upsert':
          result = await godaddyService.upsertDNSRecord(domain, record);
          break;

        case 'delete':
          result = await godaddyService.deleteDNSRecord(domain, type, name);
          break;

        case 'bulk-update':
          // Handle multiple DNS record updates
          const records = job.data.records || [];
          const results = await Promise.allSettled(
            records.map((rec) => godaddyService.upsertDNSRecord(domain, rec))
          );
          result = {
            success: results.filter((r) => r.status === 'fulfilled').length,
            failed: results.filter((r) => r.status === 'rejected').length,
            results,
          };
          break;

        default:
          throw new Error(`Unknown DNS operation: ${operation}`);
      }

      // Update domain's last DNS update timestamp
      if (domainId) {
        await Domain.findByIdAndUpdate(domainId, {
          lastDnsUpdateAt: new Date(),
        });
      }

      // Log activity
      if (userId) {
        await ActivityLog.create({
          userId,
          action: `dns_${operation}`,
          category: 'domain',
          description: `DNS ${operation} completed for ${domain}`,
          metadata: {
            domainId,
            domain,
            record: operation === 'upsert' ? record : undefined,
            type: operation === 'delete' ? type : undefined,
            name: operation === 'delete' ? name : undefined,
          },
          status: 'success',
        });
      }

      logger.info(`✅ DNS ${operation} completed for ${domain}`);

      return {
        success: true,
        domain,
        operation,
        result,
      };
    } catch (error) {
      logger.error(`DNS ${operation} failed for ${domain}:`, error);

      // Log failure
      if (userId) {
        await ActivityLog.create({
          userId,
          action: `dns_${operation}_failed`,
          category: 'domain',
          description: `DNS ${operation} failed for ${domain}`,
          metadata: {
            domainId,
            domain,
            error: error.message,
          },
          status: 'failed',
        });
      }

      // Send notification email for critical failures
      if (job.attemptsMade >= 3 && userId) {
        await emailQueue.add('dns-update-failed', {
          userId,
          domain,
          operation,
          error: error.message,
        });
      }

      throw error;
    }
  },
  {
    connection: redisConfig,
    concurrency: 5, // Process 5 DNS updates at a time
    limiter: {
      max: 20,
      duration: 60000, // Max 20 updates per minute
    },
  }
);

// Worker event handlers
dnsUpdateWorker.on('completed', (job) => {
  logger.info(`DNS update job ${job.id} completed`);
});

dnsUpdateWorker.on('failed', (job, error) => {
  logger.error(`DNS update job ${job.id} failed:`, error.message);
});

dnsUpdateWorker.on('error', (error) => {
  logger.error('DNS update worker error:', error);
});

logger.info('✅ DNS update worker started');

export default dnsUpdateWorker;
