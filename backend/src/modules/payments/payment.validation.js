import Joi from 'joi';

const paymentValidation = {
  createOrder: Joi.object({
    amount: Joi.number().min(1).required(),
    currency: Joi.string().length(3).default('INR'),
    invoiceId: Joi.string().required(),
    notes: Joi.object().optional(),
  }),

  verifyRazorpay: Joi.object({
    razorpay_order_id: Joi.string().required(),
    razorpay_payment_id: Joi.string().required(),
    razorpay_signature: Joi.string().required(),
    invoiceId: Joi.string().required(),
  }),

  createIntent: Joi.object({
    amount: Joi.number().min(1).required(),
    currency: Joi.string().length(3).default('usd'),
    invoiceId: Joi.string().required(),
    description: Joi.string().optional(),
  }),

  confirmStripe: Joi.object({
    payment_intent_id: Joi.string().required(),
    invoiceId: Joi.string().required(),
  }),

  createRefund: Joi.object({
    transactionId: Joi.string().required(),
    amount: Joi.number().min(0).optional(),
    reason: Joi.string().optional(),
  }),
};

export default paymentValidation;
