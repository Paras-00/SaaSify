import { errorResponse, successResponse } from '../../utils/response.js';

import Client from '../../models/Client.js';
import Invoice from '../../models/Invoice.js';
import Transaction from '../../models/Transaction.js';
import invoiceService from '../../services/invoice.service.js';
import logger from '../../utils/logger.js';
import razorpayService from '../../services/razorpay.service.js';
import stripeService from '../../services/stripe.service.js';

/**
 * Payment Gateway Controller
 * Handles payment creation, verification, webhooks, and refunds
 */

/**
 * Create Razorpay order
 */
export const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, currency, invoiceId, notes } = req.body;
    const userId = req.user.userId;

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return errorResponse(res, 'Invoice not found', 404);
    }

    // Verify user has access to this invoice
    const client = await Client.findOne({ userId });
    if (!client || invoice.clientId.toString() !== client._id.toString()) {
      return errorResponse(res, 'Access denied', 403);
    }

    if (invoice.status === 'paid') {
      return errorResponse(res, 'Invoice already paid', 400);
    }

    const order = await razorpayService.createOrder({
      amount,
      currency,
      receipt: invoice.invoiceNumber,
      notes: { ...notes, invoiceId: invoice._id.toString(), clientId: client._id.toString() },
    });

    logger.info(`Razorpay order created for invoice ${invoice.invoiceNumber}`);

    return successResponse(res, 'Order created successfully', {
      order,
      keyId: razorpayService.keyId,
    });
  } catch (error) {
    logger.error('Create Razorpay order failed:', error);
    return errorResponse(res, error.message || 'Failed to create order', 500);
  }
};

/**
 * Verify Razorpay payment
 */
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, invoiceId } = req.body;
    const userId = req.user.userId;

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return errorResponse(res, 'Invoice not found', 404);
    }

    const client = await Client.findOne({ userId });
    if (!client || invoice.clientId.toString() !== client._id.toString()) {
      return errorResponse(res, 'Access denied', 403);
    }

    // Verify signature
    const isValid = razorpayService.verifyPaymentSignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!isValid) {
      logger.warn(`Invalid Razorpay signature for invoice ${invoice.invoiceNumber}`);
      return errorResponse(res, 'Payment verification failed', 400);
    }

    // Get payment details
    const payment = await razorpayService.getPayment(razorpay_payment_id);

    // Create transaction
    const transaction = await Transaction.create({
      clientId: client._id,
      userId,
      invoiceId: invoice._id,
      orderId: invoice.orderId,
      type: 'payment',
      gateway: 'razorpay',
      gatewayTransactionId: payment.id,
      gatewayOrderId: razorpay_order_id,
      amount: payment.amount,
      currency: payment.currency,
      fee: payment.fee,
      netAmount: payment.amount - payment.fee,
      status: payment.status === 'captured' ? 'completed' : 'pending',
      paymentDetails: {
        method: payment.method,
        cardLast4: payment.card?.last4,
        cardBrand: payment.card?.network,
      },
      billingDetails: {
        email: payment.email,
        phone: payment.contact,
      },
      description: `Payment for invoice ${invoice.invoiceNumber}`,
    });

    // Mark invoice as paid
    await invoiceService.markAsPaid(invoiceId, {
      method: payment.method,
      transactionId: transaction.transactionId,
      gateway: 'razorpay',
      amount: payment.amount,
    });

    logger.info(`Razorpay payment verified for invoice ${invoice.invoiceNumber}`);

    return successResponse(res, 'Payment verified successfully', {
      transaction,
      invoice: await Invoice.findById(invoiceId).lean(),
    });
  } catch (error) {
    logger.error('Verify Razorpay payment failed:', error);
    return errorResponse(res, 'Payment verification failed', 500);
  }
};

/**
 * Razorpay webhook handler
 */
export const razorpayWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const body = req.body;

    // Verify webhook signature
    const isValid = razorpayService.verifyWebhookSignature(body, signature);
    if (!isValid) {
      logger.warn('Invalid Razorpay webhook signature');
      return res.status(400).send('Invalid signature');
    }

    const event = body.event;
    const payload = body.payload;

    logger.info(`Razorpay webhook received: ${event}`);

    switch (event) {
      case 'payment.captured':
        await handleRazorpayPaymentCaptured(payload.payment.entity);
        break;

      case 'payment.failed':
        await handleRazorpayPaymentFailed(payload.payment.entity);
        break;

      case 'refund.created':
        await handleRazorpayRefundCreated(payload.refund.entity);
        break;

      default:
        logger.info(`Unhandled Razorpay webhook event: ${event}`);
    }

    res.status(200).send('Webhook received');
  } catch (error) {
    logger.error('Razorpay webhook failed:', error);
    res.status(500).send('Webhook processing failed');
  }
};

/**
 * Create Stripe payment intent
 */
export const createStripeIntent = async (req, res) => {
  try {
    const { amount, currency, invoiceId, description } = req.body;
    const userId = req.user.userId;

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return errorResponse(res, 'Invoice not found', 404);
    }

    const client = await Client.findOne({ userId });
    if (!client || invoice.clientId.toString() !== client._id.toString()) {
      return errorResponse(res, 'Access denied', 403);
    }

    if (invoice.status === 'paid') {
      return errorResponse(res, 'Invoice already paid', 400);
    }

    const intent = await stripeService.createPaymentIntent({
      amount,
      currency,
      metadata: {
        invoiceId: invoice._id.toString(),
        invoiceNumber: invoice.invoiceNumber,
        clientId: client._id.toString(),
      },
      description: description || `Payment for invoice ${invoice.invoiceNumber}`,
    });

    logger.info(`Stripe payment intent created for invoice ${invoice.invoiceNumber}`);

    return successResponse(res, 'Payment intent created successfully', {
      intent,
      publishableKey: stripeService.getPublishableKey(),
    });
  } catch (error) {
    logger.error('Create Stripe intent failed:', error);
    return errorResponse(res, error.message || 'Failed to create payment intent', 500);
  }
};

/**
 * Confirm Stripe payment
 */
export const confirmStripePayment = async (req, res) => {
  try {
    const { payment_intent_id, invoiceId } = req.body;
    const userId = req.user.userId;

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return errorResponse(res, 'Invoice not found', 404);
    }

    const client = await Client.findOne({ userId });
    if (!client || invoice.clientId.toString() !== client._id.toString()) {
      return errorResponse(res, 'Access denied', 403);
    }

    // Get payment intent details
    const paymentIntent = await stripeService.getPaymentIntent(payment_intent_id);

    if (paymentIntent.status !== 'succeeded') {
      return errorResponse(res, 'Payment not completed', 400);
    }

    // Create transaction
    const transaction = await Transaction.create({
      clientId: client._id,
      userId,
      invoiceId: invoice._id,
      orderId: invoice.orderId,
      type: 'payment',
      gateway: 'stripe',
      gatewayTransactionId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      netAmount: paymentIntent.amount,
      status: 'completed',
      description: `Payment for invoice ${invoice.invoiceNumber}`,
    });

    // Mark invoice as paid
    await invoiceService.markAsPaid(invoiceId, {
      method: 'stripe',
      transactionId: transaction.transactionId,
      gateway: 'stripe',
      amount: paymentIntent.amount,
    });

    logger.info(`Stripe payment confirmed for invoice ${invoice.invoiceNumber}`);

    return successResponse(res, 'Payment confirmed successfully', {
      transaction,
      invoice: await Invoice.findById(invoiceId).lean(),
    });
  } catch (error) {
    logger.error('Confirm Stripe payment failed:', error);
    return errorResponse(res, 'Payment confirmation failed', 500);
  }
};

/**
 * Stripe webhook handler
 */
export const stripeWebhook = async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    const body = req.body;

    // Verify webhook signature and construct event
    const event = stripeService.verifyWebhookSignature(body, signature);
    if (!event) {
      logger.warn('Invalid Stripe webhook signature');
      return res.status(400).send('Invalid signature');
    }

    logger.info(`Stripe webhook received: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handleStripePaymentSucceeded(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handleStripePaymentFailed(event.data.object);
        break;

      case 'charge.refunded':
        await handleStripeRefund(event.data.object);
        break;

      default:
        logger.info(`Unhandled Stripe webhook event: ${event.type}`);
    }

    res.status(200).send('Webhook received');
  } catch (error) {
    logger.error('Stripe webhook failed:', error);
    res.status(500).send('Webhook processing failed');
  }
};

/**
 * Get Stripe config
 */
export const getStripeConfig = async (req, res) => {
  try {
    return successResponse(res, 'Stripe config retrieved', {
      publishableKey: stripeService.getPublishableKey(),
    });
  } catch (error) {
    logger.error('Get Stripe config failed:', error);
    return errorResponse(res, 'Failed to retrieve config', 500);
  }
};

/**
 * Create refund
 */
export const createRefund = async (req, res) => {
  try {
    const { transactionId, amount, reason } = req.body;
    const userRole = req.user.role;

    if (userRole !== 'admin') {
      return errorResponse(res, 'Access denied', 403);
    }

    const transaction = await Transaction.findOne({ transactionId });
    if (!transaction) {
      return errorResponse(res, 'Transaction not found', 404);
    }

    if (transaction.status !== 'completed') {
      return errorResponse(res, 'Cannot refund incomplete transaction', 400);
    }

    let refund;

    if (transaction.gateway === 'razorpay') {
      refund = await razorpayService.refundPayment(
        transaction.gatewayTransactionId,
        amount,
        { reason }
      );
    } else if (transaction.gateway === 'stripe') {
      refund = await stripeService.createRefund(
        transaction.gatewayTransactionId,
        amount,
        reason
      );
    } else {
      return errorResponse(res, 'Refunds not supported for this gateway', 400);
    }

    // Create refund transaction
    const refundTransaction = await Transaction.create({
      clientId: transaction.clientId,
      userId: transaction.userId,
      invoiceId: transaction.invoiceId,
      orderId: transaction.orderId,
      type: 'refund',
      gateway: transaction.gateway,
      gatewayTransactionId: refund.id,
      amount: refund.amount,
      currency: refund.currency,
      netAmount: refund.amount,
      status: refund.status === 'processed' || refund.status === 'succeeded' ? 'completed' : 'pending',
      description: `Refund for transaction ${transactionId}`,
    });

    // Add refunded amount to wallet
    const client = await Client.findById(transaction.clientId);
    if (client) {
      client.walletBalance += refund.amount;
      await client.save();
    }

    logger.info(`Refund created for transaction ${transactionId}`);

    return successResponse(res, 'Refund created successfully', {
      refund,
      transaction: refundTransaction,
    });
  } catch (error) {
    logger.error('Create refund failed:', error);
    return errorResponse(res, error.message || 'Failed to create refund', 500);
  }
};

/**
 * Get refund status
 */
export const getRefundStatus = async (req, res) => {
  try {
    const { refundId } = req.params;

    const transaction = await Transaction.findOne({
      gatewayTransactionId: refundId,
      type: 'refund',
    });

    if (!transaction) {
      return errorResponse(res, 'Refund not found', 404);
    }

    let refundDetails;

    if (transaction.gateway === 'razorpay') {
      refundDetails = await razorpayService.getRefund(refundId);
    } else if (transaction.gateway === 'stripe') {
      refundDetails = await stripeService.getRefund(refundId);
    }

    return successResponse(res, 'Refund status retrieved', {
      transaction,
      refundDetails,
    });
  } catch (error) {
    logger.error('Get refund status failed:', error);
    return errorResponse(res, 'Failed to retrieve refund status', 500);
  }
};

/**
 * Helper: Handle Razorpay payment captured
 */
async function handleRazorpayPaymentCaptured(payment) {
  try {
    logger.info(`Processing Razorpay payment captured: ${payment.id}`);
    // Additional processing if needed
  } catch (error) {
    logger.error('Handle Razorpay payment captured failed:', error);
  }
}

/**
 * Helper: Handle Razorpay payment failed
 */
async function handleRazorpayPaymentFailed(payment) {
  try {
    logger.info(`Processing Razorpay payment failed: ${payment.id}`);
    // Send notification to client
  } catch (error) {
    logger.error('Handle Razorpay payment failed:', error);
  }
}

/**
 * Helper: Handle Razorpay refund created
 */
async function handleRazorpayRefundCreated(refund) {
  try {
    logger.info(`Processing Razorpay refund created: ${refund.id}`);
    // Update transaction status
  } catch (error) {
    logger.error('Handle Razorpay refund created failed:', error);
  }
}

/**
 * Helper: Handle Stripe payment succeeded
 */
async function handleStripePaymentSucceeded(paymentIntent) {
  try {
    logger.info(`Processing Stripe payment succeeded: ${paymentIntent.id}`);
    // Additional processing if needed
  } catch (error) {
    logger.error('Handle Stripe payment succeeded failed:', error);
  }
}

/**
 * Helper: Handle Stripe payment failed
 */
async function handleStripePaymentFailed(paymentIntent) {
  try {
    logger.info(`Processing Stripe payment failed: ${paymentIntent.id}`);
    // Send notification to client
  } catch (error) {
    logger.error('Handle Stripe payment failed failed:', error);
  }
}

/**
 * Helper: Handle Stripe refund
 */
async function handleStripeRefund(charge) {
  try {
    logger.info(`Processing Stripe refund: ${charge.id}`);
    // Update transaction status
  } catch (error) {
    logger.error('Handle Stripe refund failed:', error);
  }
}

export default {
  createRazorpayOrder,
  verifyRazorpayPayment,
  razorpayWebhook,
  createStripeIntent,
  confirmStripePayment,
  stripeWebhook,
  getStripeConfig,
  createRefund,
  getRefundStatus,
};
