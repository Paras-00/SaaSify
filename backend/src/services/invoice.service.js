import Client from '../models/Client.js';
import Invoice from '../models/Invoice.js';
import PDFDocument from 'pdfkit';
import { fileURLToPath } from 'url';
import fs from 'fs';
import logger from '../utils/logger.js';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Invoice Service
 * Handles invoice generation, PDF creation, and invoice management
 */
class InvoiceService {
  constructor() {
    this.invoiceDir = path.join(__dirname, '../../storage/invoices');
    this.ensureStorageDirectory();
  }

  /**
   * Ensure storage directory exists
   */
  ensureStorageDirectory() {
    if (!fs.existsSync(this.invoiceDir)) {
      fs.mkdirSync(this.invoiceDir, { recursive: true });
      logger.info('Created invoice storage directory');
    }
  }

  /**
   * Generate unique invoice number
   */
  async generateInvoiceNumber() {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');

    // Count invoices this month
    const startOfMonth = new Date(year, new Date().getMonth(), 1);
    const count = await Invoice.countDocuments({
      createdAt: { $gte: startOfMonth },
    });

    const sequence = String(count + 1).padStart(4, '0');
    return `INV-${year}${month}-${sequence}`;
  }

  /**
   * Create invoice from order
   */
  async createInvoiceFromOrder(order, client) {
    try {
      const invoiceNumber = await this.generateInvoiceNumber();
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7); // 7 days payment term

      const invoice = await Invoice.create({
        invoiceNumber,
        clientId: client._id,
        userId: order.userId,
        orderId: order._id,
        invoiceDate: new Date(),
        dueDate,
        items: order.items.map((item) => ({
          type: item.type,
          description: item.name,
          serviceId: item.serviceId,
          domainId: item.domainId,
          quantity: item.quantity,
          unitPrice: item.price,
          discount: 0,
          taxAmount: 0,
          total: item.total,
        })),
        subtotal: order.subtotal,
        totalDiscount: order.discount || 0,
        totalTax: order.tax || 0,
        total: order.totalAmount,
        currency: order.currency || 'USD',
        status: order.status === 'paid' ? 'paid' : 'unpaid',
        paidAt: order.paidAt,
        paymentMethod: order.paymentMethod,
      });

      logger.info(`Invoice ${invoiceNumber} created for order ${order.orderNumber}`);
      return invoice;
    } catch (error) {
      logger.error('Failed to create invoice:', error);
      throw error;
    }
  }

  /**
   * Generate PDF invoice
   */
  async generatePDF(invoiceId) {
    try {
      const invoice = await Invoice.findById(invoiceId)
        .populate('clientId', 'firstName lastName email companyName address phone')
        .lean();

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      const client = invoice.clientId;
      const filename = `${invoice.invoiceNumber}.pdf`;
      const filepath = path.join(this.invoiceDir, filename);

      // Create PDF document
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      // Header with company info
      doc
        .fontSize(20)
        .fillColor('#667eea')
        .text('SaaSify', 50, 45)
        .fontSize(10)
        .fillColor('#666666')
        .text('Domain & Hosting Platform', 50, 70)
        .text('support@saasify.com', 50, 85)
        .text('https://saasify.com', 50, 100);

      // Invoice title
      doc
        .fontSize(28)
        .fillColor('#000000')
        .text('INVOICE', 400, 45, { align: 'right' });

      // Invoice details box
      doc
        .fontSize(10)
        .fillColor('#666666')
        .text(`Invoice #: ${invoice.invoiceNumber}`, 400, 85, { align: 'right' })
        .text(`Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}`, 400, 100, { align: 'right' })
        .text(`Due: ${new Date(invoice.dueDate).toLocaleDateString()}`, 400, 115, { align: 'right' });

      // Status badge
      const statusColors = {
        paid: '#10b981',
        unpaid: '#f59e0b',
        overdue: '#ef4444',
        cancelled: '#6b7280',
      };
      doc
        .rect(480, 130, 80, 20)
        .fillAndStroke(statusColors[invoice.status] || '#6b7280', statusColors[invoice.status] || '#6b7280')
        .fontSize(10)
        .fillColor('#ffffff')
        .text(invoice.status.toUpperCase(), 480, 135, { width: 80, align: 'center' });

      // Bill to section
      doc.fillColor('#000000');
      doc
        .fontSize(12)
        .text('BILL TO:', 50, 180)
        .fontSize(10)
        .fillColor('#333333')
        .text(client.companyName || `${client.firstName} ${client.lastName}`, 50, 200)
        .text(client.email, 50, 215);

      if (client.phone) {
        doc.text(client.phone, 50, 230);
      }

      if (client.address) {
        doc.text(client.address.street || '', 50, 245);
        doc.text(
          `${client.address.city || ''}, ${client.address.state || ''} ${client.address.zipCode || ''}`,
          50,
          260
        );
        doc.text(client.address.country || '', 50, 275);
      }

      // Items table
      const tableTop = 330;
      const itemsPerPage = 15;
      let currentY = tableTop;

      // Table headers
      doc.fillColor('#667eea');
      doc.rect(50, currentY - 10, 495, 30).fill();

      doc
        .fontSize(10)
        .fillColor('#ffffff')
        .text('Description', 60, currentY, { width: 250 })
        .text('Qty', 320, currentY, { width: 40, align: 'center' })
        .text('Unit Price', 370, currentY, { width: 70, align: 'right' })
        .text('Total', 450, currentY, { width: 85, align: 'right' });

      currentY += 30;

      // Table items
      doc.fillColor('#333333');
      const currencySymbol = invoice.currency === 'INR' ? 'Rs' : '$';

      invoice.items.forEach((item, index) => {
        if (index > 0 && index % itemsPerPage === 0) {
          doc.addPage();
          currentY = 50;
        }

        // Alternate row background
        if (index % 2 === 1) {
          doc.rect(50, currentY - 5, 495, 25).fillAndStroke('#f9fafb', '#f9fafb');
        }

        doc
          .fontSize(9)
          .fillColor('#333333')
          .text(item.description, 60, currentY, { width: 250 })
          .text(item.quantity.toString(), 320, currentY, { width: 40, align: 'center' })
          .text(`${currencySymbol}${item.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 370, currentY, { width: 70, align: 'right' })
          .text(`${currencySymbol}${item.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 450, currentY, { width: 85, align: 'right' });

        currentY += 25;
      });

      // Totals section
      currentY += 20;
      const totalsX = 370;

      doc
        .fontSize(10)
        .fillColor('#666666')
        .text('Subtotal:', totalsX, currentY, { width: 70, align: 'right' })
        .fillColor('#333333')
        .text(`${currencySymbol}${invoice.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 450, currentY, { width: 85, align: 'right' });

      currentY += 20;

      if (invoice.totalDiscount > 0) {
        doc
          .fillColor('#666666')
          .text('Discount:', totalsX, currentY, { width: 70, align: 'right' })
          .fillColor('#10b981')
          .text(`-${currencySymbol}${invoice.totalDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 450, currentY, { width: 85, align: 'right' });
        currentY += 20;
      }

      if (invoice.totalTax > 0) {
        doc
          .fillColor('#666666')
          .text('Tax:', totalsX, currentY, { width: 70, align: 'right' })
          .fillColor('#333333')
          .text(`${currencySymbol}${invoice.totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 450, currentY, { width: 85, align: 'right' });
        currentY += 20;
      }

      // Total
      doc.rect(totalsX - 10, currentY - 5, 175, 30).fillAndStroke('#f3f4f6', '#f3f4f6');
      doc
        .fontSize(12)
        .fillColor('#000000')
        .text('TOTAL:', totalsX, currentY + 5, { width: 70, align: 'right' })
        .fontSize(14)
        .fillColor('#667eea')
        .text(`${currencySymbol}${invoice.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 450, currentY + 5, { width: 85, align: 'right' });

      // Footer
      const footerY = doc.page.height - 100;
      doc
        .fontSize(9)
        .fillColor('#999999')
        .text('Thank you for your business!', 50, footerY, { align: 'center', width: 495 })
        .text('For questions about this invoice, contact support@saasify.com', 50, footerY + 15, {
          align: 'center',
          width: 495,
        });

      // Payment info if unpaid
      if (invoice.status === 'unpaid') {
        doc
          .fontSize(8)
          .fillColor('#f59e0b')
          .text(
            `Payment due by ${new Date(invoice.dueDate).toLocaleDateString()}`,
            50,
            footerY + 40,
            { align: 'center', width: 495 }
          );
      }

      // Finalize PDF
      doc.end();

      // Wait for stream to finish
      await new Promise((resolve, reject) => {
        stream.on('finish', resolve);
        stream.on('error', reject);
      });

      // Update invoice with PDF path
      await Invoice.findByIdAndUpdate(invoiceId, {
        pdfPath: filepath,
        pdfGenerated: true,
      });

      logger.info(`PDF generated for invoice ${invoice.invoiceNumber}`);

      return {
        filename,
        filepath,
        url: `/invoices/${filename}`,
      };
    } catch (error) {
      logger.error('Failed to generate PDF:', error);
      throw error;
    }
  }

  /**
   * Get invoice PDF path
   */
  getInvoicePath(invoiceNumber) {
    return path.join(this.invoiceDir, `${invoiceNumber}.pdf`);
  }

  /**
   * Mark invoice as paid
   */
  async markAsPaid(invoiceId, paymentDetails) {
    try {
      const invoice = await Invoice.findById(invoiceId);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Use model's markAsPaid method for consistent logic
      await invoice.markAsPaid(
        paymentDetails.transactionId,
        paymentDetails.amount
      );

      // Update payment method specifically
      if (paymentDetails.method) {
        invoice.paymentMethod = paymentDetails.method;
        await invoice.save();
      }

      logger.info(`Invoice ${invoice.invoiceNumber} marked as paid`);
      return invoice;
    } catch (error) {
      logger.error('Failed to mark invoice as paid:', error);
      throw error;
    }
  }

  /**
   * Send invoice email
   */
  async sendInvoiceEmail(invoiceId) {
    try {
      const invoice = await Invoice.findById(invoiceId)
        .populate('clientId', 'email firstName lastName');

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Generate PDF if not already generated
      if (!invoice.pdfGenerated) {
        await this.generatePDF(invoiceId);
      }

      // TODO: Integrate with email service
      logger.info(`Invoice ${invoice.invoiceNumber} email queued`);

      return { success: true };
    } catch (error) {
      logger.error('Failed to send invoice email:', error);
      throw error;
    }
  }
}

// Export singleton instance
const invoiceService = new InvoiceService();
export default invoiceService;
