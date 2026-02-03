import Client from '../models/Client.js';
import Invoice from '../models/Invoice.js';
import cron from 'node-cron';
import { emailQueue } from '../queues/domain.queue.js';
import logger from '../utils/logger.js';

/**
 * Payment Reminders Cron Job
 * Runs daily at 10:00 AM UTC
 * Sends payment reminders for unpaid and overdue invoices
 */

const startPaymentRemindersCron = () => {
  // Schedule: Every day at 10:00 AM UTC
  cron.schedule('0 10 * * *', async () => {
    logger.info('🔔 Starting payment reminders cron job...');

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find unpaid invoices that are overdue
      const overdueInvoices = await Invoice.find({
        status: 'unpaid',
        dueDate: { $lt: today },
        lastReminderAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Not reminded in last 24h
      })
        .populate('clientId', 'firstName lastName email')
        .lean();

      logger.info(`Found ${overdueInvoices.length} overdue invoices requiring reminders`);

      // Find invoices due in 3 days (warning)
      const dueSoonDate = new Date();
      dueSoonDate.setDate(dueSoonDate.getDate() + 3);
      dueSoonDate.setHours(23, 59, 59, 999);

      const dueSoonInvoices = await Invoice.find({
        status: 'unpaid',
        dueDate: {
          $gte: today,
          $lte: dueSoonDate,
        },
        lastReminderAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Not reminded in last 24h
      })
        .populate('clientId', 'firstName lastName email')
        .lean();

      logger.info(`Found ${dueSoonInvoices.length} invoices due soon requiring reminders`);

      // Send overdue reminders
      for (const invoice of overdueInvoices) {
        try {
          const daysOverdue = Math.floor((today - new Date(invoice.dueDate)) / (1000 * 60 * 60 * 24));

          // Queue email notification
          await emailQueue.add(
            'send-email',
            {
              type: 'invoice-overdue',
              to: invoice.clientId.email,
              data: {
                clientName: `${invoice.clientId.firstName} ${invoice.clientId.lastName}`,
                invoiceNumber: invoice.invoiceNumber,
                amount: invoice.total,
                currency: invoice.currency || 'USD',
                dueDate: invoice.dueDate,
                daysOverdue,
                viewInvoiceUrl: `${process.env.FRONTEND_URL}/invoices/${invoice._id}`,
              },
            },
            {
              attempts: 3,
              backoff: { type: 'exponential', delay: 60000 },
              priority: daysOverdue > 7 ? 1 : 2, // Higher priority for severely overdue
            }
          );

          // Update invoice status to overdue and set last reminder time
          await Invoice.findByIdAndUpdate(invoice._id, {
            status: 'overdue',
            lastReminderAt: new Date(),
          });

          logger.info(`Overdue reminder sent for invoice ${invoice.invoiceNumber} (${daysOverdue} days)`);
        } catch (error) {
          logger.error(`Failed to send overdue reminder for invoice ${invoice.invoiceNumber}:`, error);
        }
      }

      // Send due soon reminders
      for (const invoice of dueSoonInvoices) {
        try {
          const daysUntilDue = Math.ceil((new Date(invoice.dueDate) - today) / (1000 * 60 * 60 * 24));

          // Queue email notification
          await emailQueue.add(
            'send-email',
            {
              type: 'invoice-due-soon',
              to: invoice.clientId.email,
              data: {
                clientName: `${invoice.clientId.firstName} ${invoice.clientId.lastName}`,
                invoiceNumber: invoice.invoiceNumber,
                amount: invoice.total,
                currency: invoice.currency || 'USD',
                dueDate: invoice.dueDate,
                daysUntilDue,
                viewInvoiceUrl: `${process.env.FRONTEND_URL}/invoices/${invoice._id}`,
              },
            },
            {
              attempts: 3,
              backoff: { type: 'exponential', delay: 60000 },
              priority: 3,
            }
          );

          // Update last reminder time
          await Invoice.findByIdAndUpdate(invoice._id, {
            lastReminderAt: new Date(),
          });

          logger.info(`Due soon reminder sent for invoice ${invoice.invoiceNumber} (${daysUntilDue} days)`);
        } catch (error) {
          logger.error(`Failed to send due soon reminder for invoice ${invoice.invoiceNumber}:`, error);
        }
      }

      logger.info(`✅ Payment reminders cron completed. Sent ${overdueInvoices.length + dueSoonInvoices.length} reminders`);
    } catch (error) {
      logger.error('❌ Payment reminders cron failed:', error);
    }
  });

  logger.info('✅ Payment reminders cron job scheduled (daily at 10:00 AM UTC)');
};

export default startPaymentRemindersCron;
