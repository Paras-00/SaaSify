import { errorResponse, successResponse } from '../../utils/response.js';

import Client from '../../models/Client.js';
import Invoice from '../../models/Invoice.js';
import Transaction from '../../models/Transaction.js';
import invoiceService from '../../services/invoice.service.js';
import logger from '../../utils/logger.js';
import razorpayService from '../../services/razorpay.service.js';
import stripeService from '../../services/stripe.service.js';

/**
 * Wallet Controller
 * Handles wallet balance, transactions, and wallet-based payments
 */

/**
 * Get wallet balance
 */
export const getWalletBalance = async (req, res) => {
  try {
    const userId = req.user.userId;

    const client = await Client.findOne({ userId }, 'walletBalance currency').lean();

    if (!client) {
      return errorResponse(res, 'Client not found', 404);
    }

    return successResponse(res, 'Wallet balance retrieved', {
      balance: client.walletBalance || 0,
      currency: client.currency || 'USD',
    });
  } catch (error) {
    logger.error('Get wallet balance failed:', error);
    return errorResponse(res, 'Failed to retrieve wallet balance', 500);
  }
};

/**
 * Get wallet transactions
 */
export const getWalletTransactions = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10, type } = req.query;

    const client = await Client.findOne({ userId });
    if (!client) {
      return errorResponse(res, 'Client not found', 404);
    }

    const query = {
      clientId: client._id,
      gateway: 'wallet',
    };

    if (type) {
      query.type = type;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-gatewayResponse')
        .lean(),
      Transaction.countDocuments(query),
    ]);

    return successResponse(res, 'Wallet transactions retrieved', {
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    logger.error('Get wallet transactions failed:', error);
    return errorResponse(res, 'Failed to retrieve transactions', 500);
  }
};

/**
 * Add funds to wallet
 */
export const addFundsToWallet = async (req, res) => {
  try {
    const { amount, gateway, paymentData } = req.body;
    const userId = req.user.userId;

    const client = await Client.findOne({ userId });
    if (!client) {
      return errorResponse(res, 'Client not found', 404);
    }

    let paymentResult;
    let gatewayTransactionId;

    // Process payment based on gateway
    if (gateway === 'razorpay') {
      if (!paymentData || !paymentData.razorpay_payment_id) {
        return errorResponse(res, 'Payment data required', 400);
      }

      const isValid = razorpayService.verifyPaymentSignature(paymentData);
      if (!isValid) {
        return errorResponse(res, 'Invalid payment signature', 400);
      }

      const payment = await razorpayService.getPayment(paymentData.razorpay_payment_id);
      paymentResult = payment;
      gatewayTransactionId = payment.id;
    } else if (gateway === 'stripe') {
      if (!paymentData || !paymentData.payment_intent_id) {
        return errorResponse(res, 'Payment intent ID required', 400);
      }

      const payment = await stripeService.getPaymentIntent(paymentData.payment_intent_id);

      if (payment.status !== 'succeeded') {
        return errorResponse(res, 'Payment not completed', 400);
      }

      paymentResult = payment;
      gatewayTransactionId = payment.id;
    } else {
      return errorResponse(res, 'Invalid gateway', 400);
    }

    // Add funds to wallet
    client.walletBalance += amount;
    await client.save();

    // Create transaction record
    const transaction = await Transaction.create({
      clientId: client._id,
      userId,
      type: 'credit',
      gateway,
      gatewayTransactionId,
      amount,
      currency: paymentResult.currency || 'USD',
      netAmount: amount,
      status: 'completed',
      description: `Wallet top-up via ${gateway}`,
    });

    logger.info(`Wallet funds added for client ${client._id}: $${amount}`);

    return successResponse(res, 'Funds added to wallet successfully', {
      newBalance: client.walletBalance,
      transaction,
    });
  } catch (error) {
    logger.error('Add funds to wallet failed:', error);
    return errorResponse(res, 'Failed to add funds', 500);
  }
};

/**
 * Pay invoice from wallet
 */
export const payInvoiceFromWallet = async (req, res) => {
  try {
    const { invoiceId } = req.body;
    const userId = req.user.userId;

    const client = await Client.findOne({ userId });
    if (!client) {
      return errorResponse(res, 'Client not found', 404);
    }

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return errorResponse(res, 'Invoice not found', 404);
    }

    // Check access
    if (invoice.clientId.toString() !== client._id.toString()) {
      return errorResponse(res, 'Access denied', 403);
    }

    // Check if already paid
    if (invoice.status === 'paid') {
      return errorResponse(res, 'Invoice already paid', 400);
    }

    // Check wallet balance
    if (client.walletBalance < invoice.total) {
      return errorResponse(res, 'Insufficient wallet balance', 400);
    }

    // Deduct from wallet
    client.walletBalance -= invoice.total;
    await client.save();

    // Create transaction
    const transaction = await Transaction.create({
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
      description: `Payment for invoice ${invoice.invoiceNumber} via wallet`,
    });

    // Mark invoice as paid
    await invoiceService.markAsPaid(invoiceId, {
      method: 'wallet',
      transactionId: transaction.transactionId,
      gateway: 'wallet',
      amount: invoice.total,
    });

    logger.info(`Invoice ${invoice.invoiceNumber} paid from wallet`);

    return successResponse(res, 'Invoice paid successfully', {
      newBalance: client.walletBalance,
      transaction,
      invoice: await Invoice.findById(invoiceId).lean(),
    });
  } catch (error) {
    logger.error('Pay invoice from wallet failed:', error);
    return errorResponse(res, 'Failed to pay invoice', 500);
  }
};

/**
 * Adjust wallet balance (Admin only)
 */
export const adjustWalletBalance = async (req, res) => {
  try {
    const { clientId, amount, type, reason } = req.body;
    const adminUserId = req.user.userId;

    const client = await Client.findById(clientId);
    if (!client) {
      return errorResponse(res, 'Client not found', 404);
    }

    const adjustmentAmount = type === 'credit' ? amount : -amount;

    // Check if debit would result in negative balance
    if (type === 'debit' && client.walletBalance < amount) {
      return errorResponse(res, 'Insufficient balance for debit', 400);
    }

    // Update balance
    client.walletBalance += adjustmentAmount;
    await client.save();

    // Create transaction record
    const transaction = await Transaction.create({
      clientId: client._id,
      userId: client.userId,
      type: type === 'credit' ? 'credit' : 'debit',
      gateway: 'admin',
      amount: Math.abs(amount),
      currency: client.currency || 'USD',
      netAmount: Math.abs(amount),
      status: 'completed',
      description: `Admin adjustment: ${reason}`,
    });

    logger.info(`Wallet adjusted for client ${clientId} by admin ${adminUserId}: ${type} $${amount}`);

    return successResponse(res, 'Wallet balance adjusted successfully', {
      newBalance: client.walletBalance,
      transaction,
    });
  } catch (error) {
    logger.error('Adjust wallet balance failed:', error);
    return errorResponse(res, 'Failed to adjust wallet balance', 500);
  }
};

/**
 * Get all wallet transactions (Admin only)
 */
export const getAllWalletTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 10, clientId, type } = req.query;

    const query = { gateway: 'wallet' };

    if (clientId) {
      query.clientId = clientId;
    }

    if (type) {
      query.type = type;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .populate('clientId', 'firstName lastName email companyName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-gatewayResponse')
        .lean(),
      Transaction.countDocuments(query),
    ]);

    return successResponse(res, 'Wallet transactions retrieved', {
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    logger.error('Get all wallet transactions failed:', error);
    return errorResponse(res, 'Failed to retrieve transactions', 500);
  }
};

export default {
  getWalletBalance,
  getWalletTransactions,
  addFundsToWallet,
  payInvoiceFromWallet,
  adjustWalletBalance,
  getAllWalletTransactions,
};
