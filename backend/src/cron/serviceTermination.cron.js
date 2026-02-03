import Invoice from '../models/Invoice.js';
import Service from '../models/Service.js';
import cron from 'node-cron';
import logger from '../utils/logger.js';

/**
 * Service Termination Cron Job
 * Runs daily at 3:00 AM UTC
 * Terminates services with invoices overdue for 30+ days
 */

const startServiceTerminationCron = () => {
  // Schedule: Every day at 3:00 AM UTC
  cron.schedule('0 3 * * *', async () => {
    logger.info('🛑 Starting service termination cron job...');

    try {
      const terminationThreshold = new Date();
      terminationThreshold.setDate(terminationThreshold.getDate() - 30); // 30 days past due

      // Find services that should be terminated
      const veryOverdueInvoices = await Invoice.find({
        status: 'overdue',
        dueDate: { $lt: terminationThreshold },
      })
        .select('_id orderId clientId')
        .lean();

      logger.info(`Found ${veryOverdueInvoices.length} invoices with services to terminate`);

      let terminatedCount = 0;

      for (const invoice of veryOverdueInvoices) {
        try {
          // Find services associated with this invoice/order
          const services = await Service.find({
            $or: [{ orderId: invoice.orderId }, { nextInvoiceId: invoice._id }],
            status: { $in: ['active', 'suspended'] },
          });

          for (const service of services) {
            // Terminate the service
            service.status = 'terminated';
            service.terminatedAt = new Date();
            service.terminationReason = 'Payment overdue for 30+ days';
            await service.save();

            terminatedCount++;
            logger.info(`Service ${service._id} terminated due to long overdue invoice ${invoice._id}`);
          }

          // Mark invoice as cancelled
          await Invoice.findByIdAndUpdate(invoice._id, {
            status: 'cancelled',
          });
        } catch (error) {
          logger.error(`Failed to terminate services for invoice ${invoice._id}:`, error);
        }
      }

      logger.info(`✅ Service termination cron completed. Terminated ${terminatedCount} services`);
    } catch (error) {
      logger.error('❌ Service termination cron failed:', error);
    }
  });

  logger.info('✅ Service termination cron job scheduled (daily at 3:00 AM UTC)');
};

export default startServiceTerminationCron;
