import Invoice from '../models/Invoice.js';
import Service from '../models/Service.js';
import cron from 'node-cron';
import logger from '../utils/logger.js';

/**
 * Service Suspension Cron Job
 * Runs every 6 hours
 * Suspends services with overdue invoices
 */

const startServiceSuspensionCron = () => {
  // Schedule: Every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    logger.info('⚠️  Starting service suspension cron job...');

    try {
      const suspensionThreshold = new Date();
      suspensionThreshold.setDate(suspensionThreshold.getDate() - 7); // 7 days past due

      // Find services that should be suspended
      const overdueInvoices = await Invoice.find({
        status: 'overdue',
        dueDate: { $lt: suspensionThreshold },
      })
        .select('_id orderId clientId')
        .lean();

      logger.info(`Found ${overdueInvoices.length} invoices with services to suspend`);

      let suspendedCount = 0;

      for (const invoice of overdueInvoices) {
        try {
          // Find services associated with this invoice/order
          const services = await Service.find({
            $or: [{ orderId: invoice.orderId }, { nextInvoiceId: invoice._id }],
            status: 'active',
          });

          for (const service of services) {
            // Suspend the service
            service.status = 'suspended';
            service.suspendedAt = new Date();
            service.suspensionReason = 'Payment overdue';
            await service.save();

            suspendedCount++;
            logger.info(`Service ${service._id} suspended due to overdue invoice ${invoice._id}`);
          }
        } catch (error) {
          logger.error(`Failed to suspend services for invoice ${invoice._id}:`, error);
        }
      }

      logger.info(`✅ Service suspension cron completed. Suspended ${suspendedCount} services`);
    } catch (error) {
      logger.error('❌ Service suspension cron failed:', error);
    }
  });

  logger.info('✅ Service suspension cron job scheduled (every 6 hours)');
};

export default startServiceSuspensionCron;
