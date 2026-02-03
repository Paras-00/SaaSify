import Stripe from 'stripe';
import logger from '../utils/logger.js';

/**
 * Stripe Payment Gateway Service
 * Handles Stripe payment intents, webhooks, and payment management
 */
class StripeService {
  constructor() {
    this.secretKey = process.env.STRIPE_SECRET_KEY;
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    this.publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;

    if (!this.secretKey) {
      logger.warn('Stripe credentials not configured. Payment features will be limited.');
      this.stripe = null;
    } else {
      this.stripe = new Stripe(this.secretKey, {
        apiVersion: '2023-10-16',
      });
      logger.info('✅ Stripe service initialized');
    }
  }

  /**
   * Create payment intent
   */
  async createPaymentIntent(paymentData) {
    try {
      if (!this.stripe) {
        throw new Error('Stripe not configured');
      }

      const { amount, currency = 'usd', metadata, customer, description } = paymentData;

      // Stripe expects amount in smallest currency unit (cents for USD)
      const amountInCents = Math.round(amount * 100);

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amountInCents,
        currency: currency.toLowerCase(),
        metadata: metadata || {},
        customer,
        description,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      logger.info(`Stripe payment intent created: ${paymentIntent.id}`);

      return {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        createdAt: new Date(paymentIntent.created * 1000),
      };
    } catch (error) {
      logger.error('Stripe payment intent creation failed:', error);
      throw new Error(`Failed to create payment intent: ${error.message}`);
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(body, signature) {
    try {
      if (!this.stripe || !this.webhookSecret) {
        logger.warn('Stripe webhook secret not configured');
        return null;
      }

      const event = this.stripe.webhooks.constructEvent(body, signature, this.webhookSecret);

      logger.info(`Webhook verified: ${event.type}`);
      return event;
    } catch (error) {
      logger.error('Webhook signature verification failed:', error);
      return null;
    }
  }

  /**
   * Retrieve payment intent
   */
  async getPaymentIntent(paymentIntentId) {
    try {
      if (!this.stripe) {
        throw new Error('Stripe not configured');
      }

      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

      return {
        id: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        paymentMethod: paymentIntent.payment_method,
        customer: paymentIntent.customer,
        metadata: paymentIntent.metadata,
        createdAt: new Date(paymentIntent.created * 1000),
      };
    } catch (error) {
      logger.error('Failed to retrieve payment intent:', error);
      throw error;
    }
  }

  /**
   * Confirm payment intent
   */
  async confirmPaymentIntent(paymentIntentId, paymentMethod) {
    try {
      if (!this.stripe) {
        throw new Error('Stripe not configured');
      }

      const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethod,
      });

      logger.info(`Payment intent ${paymentIntentId} confirmed`);

      return {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
      };
    } catch (error) {
      logger.error('Payment intent confirmation failed:', error);
      throw error;
    }
  }

  /**
   * Cancel payment intent
   */
  async cancelPaymentIntent(paymentIntentId) {
    try {
      if (!this.stripe) {
        throw new Error('Stripe not configured');
      }

      const paymentIntent = await this.stripe.paymentIntents.cancel(paymentIntentId);

      logger.info(`Payment intent ${paymentIntentId} cancelled`);

      return {
        id: paymentIntent.id,
        status: paymentIntent.status,
      };
    } catch (error) {
      logger.error('Payment intent cancellation failed:', error);
      throw error;
    }
  }

  /**
   * Create refund
   */
  async createRefund(paymentIntentId, amount, reason = 'requested_by_customer') {
    try {
      if (!this.stripe) {
        throw new Error('Stripe not configured');
      }

      const refundData = {
        payment_intent: paymentIntentId,
        reason,
      };

      // If amount provided, do partial refund
      if (amount) {
        refundData.amount = Math.round(amount * 100);
      }

      const refund = await this.stripe.refunds.create(refundData);

      logger.info(`Refund ${refund.id} created for payment intent ${paymentIntentId}`);

      return {
        id: refund.id,
        paymentIntentId: refund.payment_intent,
        amount: refund.amount / 100,
        currency: refund.currency,
        status: refund.status,
        reason: refund.reason,
        createdAt: new Date(refund.created * 1000),
      };
    } catch (error) {
      logger.error('Refund creation failed:', error);
      throw error;
    }
  }

  /**
   * Get refund status
   */
  async getRefund(refundId) {
    try {
      if (!this.stripe) {
        throw new Error('Stripe not configured');
      }

      const refund = await this.stripe.refunds.retrieve(refundId);

      return {
        id: refund.id,
        paymentIntentId: refund.payment_intent,
        amount: refund.amount / 100,
        currency: refund.currency,
        status: refund.status,
        reason: refund.reason,
        createdAt: new Date(refund.created * 1000),
      };
    } catch (error) {
      logger.error('Failed to retrieve refund:', error);
      throw error;
    }
  }

  /**
   * Create customer
   */
  async createCustomer(customerData) {
    try {
      if (!this.stripe) {
        throw new Error('Stripe not configured');
      }

      const { email, name, phone, metadata } = customerData;

      const customer = await this.stripe.customers.create({
        email,
        name,
        phone,
        metadata: metadata || {},
      });

      logger.info(`Stripe customer created: ${customer.id}`);

      return {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        createdAt: new Date(customer.created * 1000),
      };
    } catch (error) {
      logger.error('Customer creation failed:', error);
      throw error;
    }
  }

  /**
   * Get customer
   */
  async getCustomer(customerId) {
    try {
      if (!this.stripe) {
        throw new Error('Stripe not configured');
      }

      const customer = await this.stripe.customers.retrieve(customerId);

      return {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        defaultPaymentMethod: customer.invoice_settings?.default_payment_method,
        createdAt: new Date(customer.created * 1000),
      };
    } catch (error) {
      logger.error('Failed to retrieve customer:', error);
      throw error;
    }
  }

  /**
   * Attach payment method to customer
   */
  async attachPaymentMethod(paymentMethodId, customerId) {
    try {
      if (!this.stripe) {
        throw new Error('Stripe not configured');
      }

      const paymentMethod = await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      logger.info(`Payment method ${paymentMethodId} attached to customer ${customerId}`);

      return {
        id: paymentMethod.id,
        type: paymentMethod.type,
        card: paymentMethod.card,
      };
    } catch (error) {
      logger.error('Failed to attach payment method:', error);
      throw error;
    }
  }

  /**
   * Get publishable key for frontend
   */
  getPublishableKey() {
    return this.publishableKey;
  }
}

// Export singleton instance
const stripeService = new StripeService();
export default stripeService;
