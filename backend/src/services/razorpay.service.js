import Razorpay from 'razorpay';
import crypto from 'crypto';
import logger from '../utils/logger.js';

/**
 * Razorpay Payment Gateway Service
 * Handles Razorpay payment creation, verification, and webhooks
 */
class RazorpayService {
  constructor() {
    this.keyId = process.env.RAZORPAY_KEY_ID;
    this.keySecret = process.env.RAZORPAY_KEY_SECRET;
    this.webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!this.keyId || !this.keySecret) {
      logger.warn('Razorpay credentials not configured. Payment features will be limited.');
      this.client = null;
    } else {
      this.client = new Razorpay({
        key_id: this.keyId,
        key_secret: this.keySecret,
      });
      logger.info('✅ Razorpay service initialized');
    }
  }

  /**
   * Create Razorpay order
   */
  async createOrder(orderData) {
    try {
      if (!this.client) {
        throw new Error('Razorpay not configured');
      }

      const { amount, currency = 'INR', receipt, notes } = orderData;

      // Razorpay expects amount in smallest currency unit (paise for INR)
      const amountInPaise = Math.round(amount * 100);

      const order = await this.client.orders.create({
        amount: amountInPaise,
        currency,
        receipt,
        notes: notes || {},
        payment_capture: 1, // Auto-capture payment
      });

      logger.info(`Razorpay order created: ${order.id}`);

      return {
        orderId: order.id,
        amount: order.amount / 100, // Convert back to main currency unit
        currency: order.currency,
        receipt: order.receipt,
        status: order.status,
        createdAt: new Date(order.created_at * 1000),
      };
    } catch (error) {
      logger.error('Razorpay order creation failed:', error);
      throw new Error(`Failed to create Razorpay order: ${error.message}`);
    }
  }

  /**
   * Verify payment signature
   */
  verifyPaymentSignature(paymentData) {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData;

      const generatedSignature = crypto
        .createHmac('sha256', this.keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      const isValid = generatedSignature === razorpay_signature;

      if (isValid) {
        logger.info(`Payment signature verified for order ${razorpay_order_id}`);
      } else {
        logger.warn(`Invalid payment signature for order ${razorpay_order_id}`);
      }

      return isValid;
    } catch (error) {
      logger.error('Payment signature verification failed:', error);
      return false;
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(body, signature) {
    try {
      if (!this.webhookSecret) {
        logger.warn('Webhook secret not configured, skipping verification');
        return false;
      }

      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(JSON.stringify(body))
        .digest('hex');

      return expectedSignature === signature;
    } catch (error) {
      logger.error('Webhook signature verification failed:', error);
      return false;
    }
  }

  /**
   * Get payment details
   */
  async getPayment(paymentId) {
    try {
      if (!this.client) {
        throw new Error('Razorpay not configured');
      }

      const payment = await this.client.payments.fetch(paymentId);

      return {
        id: payment.id,
        orderId: payment.order_id,
        amount: payment.amount / 100,
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        email: payment.email,
        contact: payment.contact,
        cardId: payment.card_id,
        card: payment.card ? {
          last4: payment.card.last4,
          network: payment.card.network,
          type: payment.card.type,
        } : null,
        createdAt: new Date(payment.created_at * 1000),
        captured: payment.captured,
        fee: payment.fee ? payment.fee / 100 : 0,
        tax: payment.tax ? payment.tax / 100 : 0,
      };
    } catch (error) {
      logger.error('Failed to fetch payment:', error);
      throw error;
    }
  }

  /**
   * Capture payment (for manual capture)
   */
  async capturePayment(paymentId, amount) {
    try {
      if (!this.client) {
        throw new Error('Razorpay not configured');
      }

      const amountInPaise = Math.round(amount * 100);
      const payment = await this.client.payments.capture(paymentId, amountInPaise);

      logger.info(`Payment ${paymentId} captured successfully`);

      return {
        id: payment.id,
        amount: payment.amount / 100,
        status: payment.status,
        captured: payment.captured,
      };
    } catch (error) {
      logger.error('Payment capture failed:', error);
      throw error;
    }
  }

  /**
   * Refund payment
   */
  async refundPayment(paymentId, amount, notes = {}) {
    try {
      if (!this.client) {
        throw new Error('Razorpay not configured');
      }

      const refundData = {
        notes,
      };

      // If amount provided, do partial refund
      if (amount) {
        refundData.amount = Math.round(amount * 100);
      }

      const refund = await this.client.payments.refund(paymentId, refundData);

      logger.info(`Refund ${refund.id} created for payment ${paymentId}`);

      return {
        id: refund.id,
        paymentId: refund.payment_id,
        amount: refund.amount / 100,
        currency: refund.currency,
        status: refund.status,
        createdAt: new Date(refund.created_at * 1000),
      };
    } catch (error) {
      logger.error('Payment refund failed:', error);
      throw error;
    }
  }

  /**
   * Get refund status
   */
  async getRefund(refundId) {
    try {
      if (!this.client) {
        throw new Error('Razorpay not configured');
      }

      const refund = await this.client.refunds.fetch(refundId);

      return {
        id: refund.id,
        paymentId: refund.payment_id,
        amount: refund.amount / 100,
        currency: refund.currency,
        status: refund.status,
        createdAt: new Date(refund.created_at * 1000),
      };
    } catch (error) {
      logger.error('Failed to fetch refund:', error);
      throw error;
    }
  }

  /**
   * Create customer
   */
  async createCustomer(customerData) {
    try {
      if (!this.client) {
        throw new Error('Razorpay not configured');
      }

      const { name, email, contact, notes } = customerData;

      const customer = await this.client.customers.create({
        name,
        email,
        contact,
        notes: notes || {},
      });

      logger.info(`Razorpay customer created: ${customer.id}`);

      return {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        contact: customer.contact,
        createdAt: new Date(customer.created_at * 1000),
      };
    } catch (error) {
      logger.error('Customer creation failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
const razorpayService = new RazorpayService();
export default razorpayService;
