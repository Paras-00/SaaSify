import Joi from 'joi';

const walletValidation = {
  addFunds: Joi.object({
    amount: Joi.number().min(1).required(),
    gateway: Joi.string().valid('razorpay', 'stripe').required(),
    paymentData: Joi.object().unknown(true).optional(),
  }),

  payInvoice: Joi.object({
    invoiceId: Joi.string().required(),
  }),

  adjustWallet: Joi.object({
    clientId: Joi.string().required(),
    amount: Joi.number().required(),
    type: Joi.string().valid('credit', 'debit').required(),
    reason: Joi.string().required(),
  }),
};

export default walletValidation;