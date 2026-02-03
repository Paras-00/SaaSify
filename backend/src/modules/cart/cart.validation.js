import Joi from 'joi';

// Add item to cart validation
export const addToCartSchema = Joi.object({
  type: Joi.string()
    .valid('domain', 'hosting', 'ssl', 'email', 'addon')
    .required()
    .messages({
      'any.only': 'Type must be one of: domain, hosting, ssl, email, addon',
      'any.required': 'Item type is required',
    }),
  itemId: Joi.string().trim().required().messages({
    'any.required': 'Item ID is required',
  }),
  name: Joi.string().trim().min(1).max(200).required().messages({
    'string.min': 'Item name is required',
    'string.max': 'Item name cannot exceed 200 characters',
    'any.required': 'Item name is required',
  }),
  price: Joi.number().positive().precision(2).required().messages({
    'number.positive': 'Price must be positive',
    'any.required': 'Price is required',
  }),
  period: Joi.number().integer().min(1).max(10).default(1).messages({
    'number.min': 'Period must be at least 1 year',
    'number.max': 'Period cannot exceed 10 years',
  }),
  quantity: Joi.number().integer().min(1).max(10).default(1).messages({
    'number.min': 'Quantity must be at least 1',
    'number.max': 'Quantity cannot exceed 10',
  }),
  currency: Joi.string().valid('USD', 'EUR', 'GBP', 'INR').default('USD'),
  metadata: Joi.object({
    domain: Joi.string().trim(),
    tld: Joi.string().trim(),
    autoRenew: Joi.boolean(),
    privacy: Joi.boolean(),
    nameServers: Joi.array().items(Joi.string().trim()),
    billingCycle: Joi.string().valid('monthly', 'quarterly', 'annually'),
    plan: Joi.string().trim(),
  }).optional(),
});

// Update cart item validation
export const updateCartItemSchema = Joi.object({
  quantity: Joi.number().integer().min(1).max(10).messages({
    'number.min': 'Quantity must be at least 1',
    'number.max': 'Quantity cannot exceed 10',
  }),
  period: Joi.number().integer().min(1).max(10).messages({
    'number.min': 'Period must be at least 1 year',
    'number.max': 'Period cannot exceed 10 years',
  }),
  metadata: Joi.object().optional(),
})
  .min(1)
  .messages({
    'object.min': 'At least one field is required to update cart item',
  });

// Apply coupon validation
export const applyCouponSchema = Joi.object({
  code: Joi.string().trim().uppercase().min(3).max(20).required().messages({
    'string.min': 'Coupon code must be at least 3 characters',
    'string.max': 'Coupon code cannot exceed 20 characters',
    'any.required': 'Coupon code is required',
  }),
});

// Checkout validation
export const checkoutSchema = Joi.object({
  paymentMethod: Joi.string()
    .valid('wallet', 'card', 'bank_transfer', 'paypal', 'stripe', 'razorpay')
    .required()
    .messages({
      'any.only': 'Invalid payment method',
      'any.required': 'Payment method is required',
    }),
  billingDetails: Joi.object({
    firstName: Joi.string().trim().min(2).max(50).required(),
    lastName: Joi.string().trim().min(2).max(50).required(),
    email: Joi.string().trim().email().required(),
    phone: Joi.string()
      .trim()
      .pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/)
      .required(),
    company: Joi.string().trim().max(100).allow(''),
    address: Joi.object({
      street: Joi.string().trim().max(200).required(),
      city: Joi.string().trim().max(100).required(),
      state: Joi.string().trim().max(100).required(),
      country: Joi.string().trim().length(2).uppercase().required(),
      zipCode: Joi.string().trim().max(20).required(),
    }).required(),
    taxId: Joi.string().trim().max(50).allow(''),
  }).required(),
  domainContacts: Joi.object({
    useDefaultContact: Joi.boolean().default(true),
    registrant: Joi.object({
      firstName: Joi.string().trim().min(2).max(50),
      lastName: Joi.string().trim().min(2).max(50),
      email: Joi.string().trim().email(),
      phone: Joi.string()
        .trim()
        .pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/),
      organization: Joi.string().trim().max(100).allow(''),
      address: Joi.object({
        street: Joi.string().trim().max(200),
        city: Joi.string().trim().max(100),
        state: Joi.string().trim().max(100),
        country: Joi.string().trim().length(2).uppercase(),
        zipCode: Joi.string().trim().max(20),
      }),
    }).when('useDefaultContact', {
      is: false,
      then: Joi.required(),
    }),
  }).optional(),
  savePaymentMethod: Joi.boolean().default(false),
  termsAgreed: Joi.boolean().valid(true).required().messages({
    'any.only': 'You must agree to the terms and conditions',
    'any.required': 'You must agree to the terms and conditions',
  }),
  newsletterOptIn: Joi.boolean().default(false),
});
