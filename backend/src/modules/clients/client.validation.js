import Joi from 'joi';

// Update profile validation
export const updateProfileSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(50).messages({
    'string.min': 'First name must be at least 2 characters',
    'string.max': 'First name cannot exceed 50 characters',
  }),
  lastName: Joi.string().trim().min(2).max(50).messages({
    'string.min': 'Last name must be at least 2 characters',
    'string.max': 'Last name cannot exceed 50 characters',
  }),
  company: Joi.string().trim().max(100).allow('').messages({
    'string.max': 'Company name cannot exceed 100 characters',
  }),
  phone: Joi.string()
    .trim()
    .pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/)
    .messages({
      'string.pattern.base': 'Please provide a valid phone number',
    }),
  address: Joi.object({
    street: Joi.string().trim().max(200).allow(''),
    city: Joi.string().trim().max(100).allow(''),
    state: Joi.string().trim().max(100).allow(''),
    country: Joi.string().trim().max(100).allow(''),
    zipCode: Joi.string().trim().max(20).allow(''),
  }),
  billingAddress: Joi.object({
    street: Joi.string().trim().max(200).allow(''),
    city: Joi.string().trim().max(100).allow(''),
    state: Joi.string().trim().max(100).allow(''),
    country: Joi.string().trim().max(100).allow(''),
    zipCode: Joi.string().trim().max(20).allow(''),
  }),
  taxId: Joi.string().trim().max(50).allow(''),
  currency: Joi.string().valid('USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD').messages({
    'any.only': 'Currency must be one of: USD, EUR, GBP, INR, AUD, CAD',
  }),
})
  .min(1)
  .messages({
    'object.min': 'At least one field is required to update profile',
  });

// Add wallet credit validation
export const addWalletCreditSchema = Joi.object({
  amount: Joi.number().positive().precision(2).required().messages({
    'number.base': 'Amount must be a number',
    'number.positive': 'Amount must be positive',
    'any.required': 'Amount is required',
  }),
  paymentMethod: Joi.string()
    .valid('card', 'bank_transfer', 'paypal', 'stripe', 'razorpay')
    .required()
    .messages({
      'any.only': 'Invalid payment method',
      'any.required': 'Payment method is required',
    }),
  paymentDetails: Joi.object({
    transactionId: Joi.string().trim(),
    paymentGateway: Joi.string().trim(),
    last4: Joi.string().trim().length(4),
    cardBrand: Joi.string().trim(),
  }).optional(),
});

// Activity log query validation
export const activityLogQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  action: Joi.string().trim(),
  category: Joi.string().valid('auth', 'profile', 'domain', 'order', 'payment', 'admin', 'service', 'support', 'system'),
  status: Joi.string().valid('success', 'failure', 'pending', 'warning'),
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).messages({
    'date.min': 'End date must be after start date',
  }),
});
