import Joi from 'joi';

// Get users list validation
export const getUsersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().max(100),
  role: Joi.string().valid('admin', 'user'),
  status: Joi.string().valid('active', 'suspended', 'deleted'),
  isEmailVerified: Joi.boolean(),
  twoFAEnabled: Joi.boolean(),
  sortBy: Joi.string().valid('createdAt', 'email', 'lastLogin').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});

// Update user validation
export const updateUserSchema = Joi.object({
  email: Joi.string().trim().email().lowercase().messages({
    'string.email': 'Please provide a valid email address',
  }),
  role: Joi.string().valid('admin', 'user').messages({
    'any.only': 'Role must be either admin or user',
  }),
  status: Joi.string().valid('active', 'suspended', 'deleted').messages({
    'any.only': 'Status must be active, suspended, or deleted',
  }),
  isEmailVerified: Joi.boolean(),
  firstName: Joi.string().trim().min(2).max(50),
  lastName: Joi.string().trim().min(2).max(50),
  company: Joi.string().trim().max(100).allow(''),
  phone: Joi.string()
    .trim()
    .pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/),
})
  .min(1)
  .messages({
    'object.min': 'At least one field is required to update user',
  });

// Suspend user validation
export const suspendUserSchema = Joi.object({
  reason: Joi.string().trim().min(10).max(500).required().messages({
    'string.min': 'Suspension reason must be at least 10 characters',
    'string.max': 'Suspension reason cannot exceed 500 characters',
    'any.required': 'Suspension reason is required',
  }),
  duration: Joi.number().integer().min(1).max(365).messages({
    'number.min': 'Duration must be at least 1 day',
    'number.max': 'Duration cannot exceed 365 days',
  }),
  permanent: Joi.boolean().default(false),
});

// Add wallet credit validation (admin)
export const adminAddCreditSchema = Joi.object({
  amount: Joi.number().positive().precision(2).required().messages({
    'number.base': 'Amount must be a number',
    'number.positive': 'Amount must be positive',
    'any.required': 'Amount is required',
  }),
  reason: Joi.string().trim().min(5).max(200).required().messages({
    'string.min': 'Reason must be at least 5 characters',
    'string.max': 'Reason cannot exceed 200 characters',
    'any.required': 'Reason is required',
  }),
  type: Joi.string().valid('bonus', 'refund', 'compensation', 'adjustment').default('adjustment').messages({
    'any.only': 'Type must be one of: bonus, refund, compensation, adjustment',
  }),
});

// Audit logs query validation
export const auditLogsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  userId: Joi.string().trim().regex(/^[0-9a-fA-F]{24}$/),
  action: Joi.string().trim(),
  category: Joi.string().valid('auth', 'profile', 'domain', 'order', 'payment', 'admin', 'service', 'support', 'system'),
  status: Joi.string().valid('success', 'failure', 'pending', 'warning'),
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')),
  performedBy: Joi.string().trim().regex(/^[0-9a-fA-F]{24}$/),
});

// Dashboard stats query validation
export const statsQuerySchema = Joi.object({
  period: Joi.string().valid('today', 'week', 'month', 'year', 'custom').default('month'),
  startDate: Joi.date().iso().when('period', {
    is: 'custom',
    then: Joi.date().required(),
  }),
  endDate: Joi.date().iso().when('period', {
    is: 'custom',
    then: Joi.date().required().min(Joi.ref('startDate')),
  }),
});
