import { authenticateToken } from '../../middleware/auth.middleware.js';
import express from 'express';
import paymentController from './payment.controller.js';
import paymentValidation from './payment.validation.js';
import { validate } from '../../middleware/validation.middleware.js';

const router = express.Router();

/**
 * Payment Gateway Routes
 */

// Razorpay routes
router.post(
  '/razorpay/create-order',
  authenticateToken,
  validate(paymentValidation.createOrder, 'body'),
  paymentController.createRazorpayOrder
);

router.post(
  '/razorpay/verify',
  authenticateToken,
  validate(paymentValidation.verifyRazorpay, 'body'),
  paymentController.verifyRazorpayPayment
);

router.post(
  '/razorpay/webhook',
  express.raw({ type: 'application/json' }),
  paymentController.razorpayWebhook
);

// Stripe routes
router.post(
  '/stripe/create-intent',
  authenticateToken,
  validate(paymentValidation.createIntent, 'body'),
  paymentController.createStripeIntent
);

router.post(
  '/stripe/confirm',
  authenticateToken,
  validate(paymentValidation.confirmStripe, 'body'),
  paymentController.confirmStripePayment
);

router.post(
  '/stripe/webhook',
  express.raw({ type: 'application/json' }),
  paymentController.stripeWebhook
);

router.get(
  '/stripe/config',
  authenticateToken,
  paymentController.getStripeConfig
);

// Refund routes
router.post(
  '/refund',
  authenticateToken,
  validate(paymentValidation.createRefund, 'body'),
  paymentController.createRefund
);

router.get(
  '/refund/:refundId',
  authenticateToken,
  paymentController.getRefundStatus
);

export default router;
