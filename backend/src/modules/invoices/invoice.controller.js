import { errorResponse, successResponse } from '../../utils/response.js';

import Client from '../../models/Client.js';
import Invoice from '../../models/Invoice.js';
import Transaction from '../../models/Transaction.js';
import fs from 'fs';
import invoiceService from '../../services/invoice.service.js';
import logger from '../../utils/logger.js';
import razorpayService from '../../services/razorpay.service.js';
import stripeService from '../../services/stripe.service.js';

/**
 * Invoice Controller
 * Handles invoice CRUD operations and payment processing
 */

/**
 * Get all invoices for authenticated client
 */
export const getMyInvoices = async (req, res) => {
  try {
    const userId = req.user.userId;
    const client = await Client.findOne({ userId });

    if (!client) {
      return errorResponse(res, 'Client not found', 404);
    }

    const { page = 1, limit = 10, status, sortBy = 'createdAt', order = 'desc' } = req.query;

    const query = { clientId: client._id };

    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === 'asc' ? 1 : -1;

    const [invoices, total] = await Promise.all([
      Invoice.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Invoice.countDocuments(query),
    ]);

    return successResponse(res, 'Invoices retrieved successfully', {
      invoices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    logger.error('Get invoices failed:', error);
    return errorResponse(res, 'Failed to retrieve invoices', 500);
  }
};

/**
 * Get invoice by ID
 */
export const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const invoice = await Invoice.findById(id)
      .populate('clientId', 'firstName lastName email companyName')
      .lean();

    if (!invoice) {
      return errorResponse(res, 'Invoice not found', 404);
    }

    // Check if user has access to this invoice
    if (userRole !== 'admin') {
      const client = await Client.findOne({ userId });
      if (!client || invoice.clientId._id.toString() !== client._id.toString()) {
        return errorResponse(res, 'Access denied', 403);
      }
    }

    return successResponse(res, 'Invoice retrieved successfully', { invoice });
  } catch (error) {
    logger.error('Get invoice failed:', error);
    return errorResponse(res, 'Failed to retrieve invoice', 500);
  }
};

/**
 * Download invoice PDF
 */
export const downloadInvoicePDF = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const invoice = await Invoice.findById(id);

    if (!invoice) {
      return errorResponse(res, 'Invoice not found', 404);
    }

    // Check access
    if (userRole !== 'admin') {
      const client = await Client.findOne({ userId });
      if (!client || invoice.clientId.toString() !== client._id.toString()) {
        return errorResponse(res, 'Access denied', 403);
      }
    }

    // Generate PDF if not exists
    if (!invoice.pdfGenerated) {
      await invoiceService.generatePDF(id);
    }

    const pdfPath = invoiceService.getInvoicePath(invoice.invoiceNumber);

    if (!fs.existsSync(pdfPath)) {
      return errorResponse(res, 'Invoice PDF not found', 404);
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`);

    const fileStream = fs.createReadStream(pdfPath);
    fileStream.pipe(res);
  } catch (error) {
    logger.error('Download PDF failed:', error);
    return errorResponse(res, 'Failed to download invoice PDF', 500);
  }
};

/**
 * Pay invoice
 */
export const payInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const { gateway, paymentMethod, paymentData } = req.body;
    const userId = req.user.userId;

    const invoice = await Invoice.findById(id);

    if (!invoice) {
      return errorResponse(res, 'Invoice not found', 404);
    }

    // Check access
    const client = await Client.findOne({ userId });
    if (!client || invoice.clientId.toString() !== client._id.toString()) {
      return errorResponse(res, 'Access denied', 403);
    }

    // Check if already paid
    if (invoice.status === 'paid') {
      return errorResponse(res, 'Invoice already paid', 400);
    }

    let paymentResult;
    let transaction;

    switch (gateway) {
      case 'wallet':
        // Pay from wallet balance
        if (client.walletBalance < invoice.total) {
          return errorResponse(res, 'Insufficient wallet balance', 400);
        }

        client.walletBalance -= invoice.total;
        await client.save();

        transaction = await Transaction.create({
          clientId: client._id,
          userId,
          invoiceId: invoice._id,
          orderId: invoice.orderId,
          type: 'payment',
          gateway: 'wallet',
          amount: invoice.total,
          currency: invoice.currency || 'USD',
          netAmount: invoice.total,
          status: 'completed',
          description: `Payment for invoice ${invoice.invoiceNumber}`,
        });

        await invoiceService.markAsPaid(id, {
          method: 'wallet',
          transactionId: transaction.transactionId,
          gateway: 'wallet',
          amount: invoice.total,
        });

        paymentResult = { success: true, method: 'wallet' };
        break;

      case 'razorpay':
        // Verify Razorpay payment
        if (!paymentData || !paymentData.razorpay_payment_id) {
          return errorResponse(res, 'Payment data required', 400);
        }

        const isValid = razorpayService.verifyPaymentSignature(paymentData);
        if (!isValid) {
          return errorResponse(res, 'Invalid payment signature', 400);
        }

        const razorpayPayment = await razorpayService.getPayment(paymentData.razorpay_payment_id);

        transaction = await Transaction.create({
          clientId: client._id,
          userId,
          invoiceId: invoice._id,
          orderId: invoice.orderId,
          type: 'payment',
          gateway: 'razorpay',
          gatewayTransactionId: razorpayPayment.id,
          gatewayOrderId: razorpayPayment.orderId,
          amount: razorpayPayment.amount,
          currency: razorpayPayment.currency,
          fee: razorpayPayment.fee || 0,
          netAmount: razorpayPayment.amount - (razorpayPayment.fee || 0),
          status: razorpayPayment.status === 'captured' ? 'completed' : 'pending',
          paymentDetails: {
            method: razorpayPayment.method,
            cardLast4: razorpayPayment.card?.last4,
            cardBrand: razorpayPayment.card?.network,
          },
          billingDetails: {
            email: razorpayPayment.email,
            phone: razorpayPayment.contact,
          },
          description: `Payment for invoice ${invoice.invoiceNumber}`,
        });

        await invoiceService.markAsPaid(id, {
          method: razorpayPayment.method,
          transactionId: transaction.transactionId,
          gateway: 'razorpay',
          amount: razorpayPayment.amount,
        });

        paymentResult = { success: true, method: 'razorpay', paymentId: razorpayPayment.id };
        break;

      case 'stripe':
        // Verify Stripe payment
        if (!paymentData || !paymentData.payment_intent_id) {
          return errorResponse(res, 'Payment intent ID required', 400);
        }

        const stripePayment = await stripeService.getPaymentIntent(paymentData.payment_intent_id);

        if (stripePayment.status !== 'succeeded') {
          return errorResponse(res, 'Payment not completed', 400);
        }

        transaction = await Transaction.create({
          clientId: client._id,
          userId,
          invoiceId: invoice._id,
          orderId: invoice.orderId,
          type: 'payment',
          gateway: 'stripe',
          gatewayTransactionId: stripePayment.id,
          amount: stripePayment.amount,
          currency: stripePayment.currency,
          netAmount: stripePayment.amount,
          status: 'completed',
          description: `Payment for invoice ${invoice.invoiceNumber}`,
        });

        await invoiceService.markAsPaid(id, {
          method: 'stripe',
          transactionId: transaction.transactionId,
          gateway: 'stripe',
          amount: stripePayment.amount,
        });

        paymentResult = { success: true, method: 'stripe', paymentId: stripePayment.id };
        break;

      default:
        return errorResponse(res, 'Invalid payment gateway', 400);
    }

    logger.info(`Invoice ${invoice.invoiceNumber} paid via ${gateway}`);

    return successResponse(res, 'Payment successful', {
      invoice: await Invoice.findById(id).lean(),
      transaction,
      payment: paymentResult,
    });
  } catch (error) {
    logger.error('Pay invoice failed:', error);
    return errorResponse(res, 'Payment failed', 500);
  }
};

/**
 * Create invoice (Admin only)
 */
export const createInvoice = async (req, res) => {
  try {
    const { clientId, orderId, items, dueDate, notes } = req.body;

    const client = await Client.findById(clientId);
    if (!client) {
      return errorResponse(res, 'Client not found', 404);
    }

    // Calculate totals
    let subtotal = 0;
    const processedItems = items.map((item) => {
      const total = item.quantity * item.unitPrice - item.discount + item.taxAmount;
      subtotal += total;
      return { ...item, total };
    });

    const invoiceNumber = await invoiceService.generateInvoiceNumber();
    const invoiceDueDate = dueDate ? new Date(dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invoice = await Invoice.create({
      invoiceNumber,
      clientId,
      userId: client.userId,
      orderId,
      invoiceDate: new Date(),
      dueDate: invoiceDueDate,
      items: processedItems,
      subtotal,
      totalDiscount: 0,
      totalTax: 0,
      total: subtotal,
      status: 'unpaid',
      notes,
    });

    // Generate PDF
    await invoiceService.generatePDF(invoice._id);

    logger.info(`Invoice ${invoiceNumber} created by admin`);

    return successResponse(res, 'Invoice created successfully', { invoice }, 201);
  } catch (error) {
    logger.error('Create invoice failed:', error);
    return errorResponse(res, 'Failed to create invoice', 500);
  }
};

/**
 * Get all invoices (Admin only)
 */
export const getAllInvoices = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, clientId, sortBy = 'createdAt', order = 'desc' } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (clientId) {
      query.clientId = clientId;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === 'asc' ? 1 : -1;

    const [invoices, total] = await Promise.all([
      Invoice.find(query)
        .populate('clientId', 'firstName lastName email companyName')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Invoice.countDocuments(query),
    ]);

    return successResponse(res, 'Invoices retrieved successfully', {
      invoices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    logger.error('Get all invoices failed:', error);
    return errorResponse(res, 'Failed to retrieve invoices', 500);
  }
};

/**
 * Update invoice (Admin only)
 */
export const updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return errorResponse(res, 'Invoice not found', 404);
    }

    // Recalculate totals if items updated
    if (updates.items) {
      let subtotal = 0;
      updates.items = updates.items.map((item) => {
        const total = item.quantity * item.unitPrice - item.discount + item.taxAmount;
        subtotal += total;
        return { ...item, total };
      });
      updates.subtotal = subtotal;
      updates.total = subtotal;
    }

    Object.assign(invoice, updates);
    await invoice.save();

    logger.info(`Invoice ${invoice.invoiceNumber} updated`);

    return successResponse(res, 'Invoice updated successfully', { invoice });
  } catch (error) {
    logger.error('Update invoice failed:', error);
    return errorResponse(res, 'Failed to update invoice', 500);
  }
};

/**
 * Delete invoice (Admin only)
 */
export const deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return errorResponse(res, 'Invoice not found', 404);
    }

    if (invoice.status === 'paid') {
      return errorResponse(res, 'Cannot delete paid invoice', 400);
    }

    await invoice.deleteOne();

    logger.info(`Invoice ${invoice.invoiceNumber} deleted`);

    return successResponse(res, 'Invoice deleted successfully');
  } catch (error) {
    logger.error('Delete invoice failed:', error);
    return errorResponse(res, 'Failed to delete invoice', 500);
  }
};

/**
 * Send invoice email (Admin only)
 */
export const sendInvoiceEmail = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return errorResponse(res, 'Invoice not found', 404);
    }

    await invoiceService.sendInvoiceEmail(id);

    return successResponse(res, 'Invoice email sent successfully');
  } catch (error) {
    logger.error('Send invoice email failed:', error);
    return errorResponse(res, 'Failed to send invoice email', 500);
  }
};

export default {
  getMyInvoices,
  getInvoiceById,
  downloadInvoicePDF,
  payInvoice,
  createInvoice,
  getAllInvoices,
  updateInvoice,
  deleteInvoice,
  sendInvoiceEmail,
};
