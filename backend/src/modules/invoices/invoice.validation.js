import Joi from 'joi';

const invoiceValidation = {
  createInvoice: Joi.object({
    clientId: Joi.string().required(),
    orderId: Joi.string().optional(),
    items: Joi.array()
      .items(
        Joi.object({
          type: Joi.string()
            .valid('service', 'domain', 'addon', 'setup-fee', 'credit', 'other')
            .required(),
          description: Joi.string().required(),
          serviceId: Joi.string().optional(),
          domainId: Joi.string().optional(),
          quantity: Joi.number().min(1).default(1),
          unitPrice: Joi.number().min(0).required(),
          discount: Joi.number().min(0).default(0),
          taxAmount: Joi.number().min(0).default(0),
        })
      )
      .min(1)
      .required(),
    dueDate: Joi.date().min('now').optional(),
    notes: Joi.string().max(500).optional(),
  }),

  updateInvoice: Joi.object({
    status: Joi.string().valid('unpaid', 'paid', 'overdue', 'cancelled').optional(),
    dueDate: Joi.date().optional(),
    notes: Joi.string().max(500).optional(),
    items: Joi.array()
      .items(
        Joi.object({
          type: Joi.string()
            .valid('service', 'domain', 'addon', 'setup-fee', 'credit', 'other')
            .required(),
          description: Joi.string().required(),
          serviceId: Joi.string().optional(),
          domainId: Joi.string().optional(),
          quantity: Joi.number().min(1).default(1),
          unitPrice: Joi.number().min(0).required(),
          discount: Joi.number().min(0).default(0),
          taxAmount: Joi.number().min(0).default(0),
        })
      )
      .optional(),
  }),

  payInvoice: Joi.object({
    gateway: Joi.string().valid('razorpay', 'stripe', 'wallet').required(),
    paymentMethod: Joi.string().optional(),
    paymentData: Joi.object().optional(),
  }),
};

export default invoiceValidation;
