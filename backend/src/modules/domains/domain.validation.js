import Joi from 'joi';

// Domain search validation
export const domainSearchSchema = Joi.object({
  query: Joi.string().trim().min(1).max(100).required().messages({
    'string.min': 'Search query must not be empty',
    'string.max': 'Search query cannot exceed 100 characters',
    'any.required': 'Search query is required',
  }),
  tlds: Joi.array()
    .items(Joi.string().pattern(/^\.[a-z]{2,}$/))
    .max(10)
    .messages({
      'array.max': 'Maximum 10 TLDs allowed',
      'string.pattern.base': 'Invalid TLD format (must start with dot, e.g., .com)',
    }),
  maxResults: Joi.number().integer().min(1).max(50).default(20),
  checkAvailability: Joi.boolean().default(true),
});

// Domain availability check validation
export const domainAvailabilitySchema = Joi.object({
  domain: Joi.string()
    .trim()
    .pattern(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i)
    .required()
    .messages({
      'string.pattern.base': 'Invalid domain format (e.g., example.com)',
      'any.required': 'Domain name is required',
    }),
});

// Bulk domain availability check validation
export const bulkAvailabilitySchema = Joi.object({
  domains: Joi.array()
    .items(
      Joi.string()
        .trim()
        .pattern(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i)
    )
    .min(1)
    .max(50)
    .required()
    .messages({
      'array.min': 'At least one domain is required',
      'array.max': 'Maximum 50 domains allowed per request',
      'string.pattern.base': 'Invalid domain format',
      'any.required': 'Domains array is required',
    }),
});

// Domain suggestions validation
export const domainSuggestionsSchema = Joi.object({
  query: Joi.string().trim().min(2).max(50).required().messages({
    'string.min': 'Query must be at least 2 characters',
    'string.max': 'Query cannot exceed 50 characters',
    'any.required': 'Query is required',
  }),
  tlds: Joi.array()
    .items(Joi.string().pattern(/^\.[a-z]{2,}$/))
    .max(10)
    .default(['.com', '.net', '.org', '.io', '.co']),
  maxResults: Joi.number().integer().min(5).max(50).default(20),
  lengthMin: Joi.number().integer().min(2).max(20).default(4),
  lengthMax: Joi.number().integer().min(5).max(63).default(25),
});

// Domain pricing validation
export const domainPricingSchema = Joi.object({
  tld: Joi.string()
    .trim()
    .pattern(/^\.?[a-z]{2,}$/i)
    .required()
    .messages({
      'string.pattern.base': 'Invalid TLD format (e.g., .com or com)',
      'any.required': 'TLD is required',
    }),
});

// Domain registration validation (for order creation)
export const domainRegistrationSchema = Joi.object({
  domain: Joi.string()
    .trim()
    .pattern(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i)
    .required()
    .messages({
      'string.pattern.base': 'Invalid domain format',
      'any.required': 'Domain name is required',
    }),
  period: Joi.number().integer().min(1).max(10).default(1).messages({
    'number.min': 'Period must be at least 1 year',
    'number.max': 'Period cannot exceed 10 years',
  }),
  autoRenew: Joi.boolean().default(true),
  privacy: Joi.boolean().default(true),
  nameServers: Joi.array()
    .items(
      Joi.string()
        .trim()
        .pattern(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i)
    )
    .max(4)
    .messages({
      'array.max': 'Maximum 4 nameservers allowed',
    }),
  contacts: Joi.object({
    firstName: Joi.string().trim().min(2).max(50).required(),
    lastName: Joi.string().trim().min(2).max(50).required(),
    email: Joi.string().trim().email().required(),
    phone: Joi.string()
      .trim()
      .pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/)
      .required(),
    organization: Joi.string().trim().max(100).allow(''),
    address: Joi.object({
      street: Joi.string().trim().max(200).required(),
      city: Joi.string().trim().max(100).required(),
      state: Joi.string().trim().max(100).required(),
      country: Joi.string().trim().length(2).uppercase().required(),
      zipCode: Joi.string().trim().max(20).required(),
    }).required(),
  }).required(),
});

// WHOIS privacy validation
export const whoisPrivacySchema = Joi.object({
  domain: Joi.string()
    .trim()
    .pattern(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i)
    .required(),
  enabled: Joi.boolean().required(),
});

// Nameserver update validation
export const nameServerUpdateSchema = Joi.object({
  domain: Joi.string()
    .trim()
    .pattern(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i)
    .required(),
  nameServers: Joi.array()
    .items(
      Joi.string()
        .trim()
        .pattern(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i)
    )
    .min(2)
    .max(4)
    .required()
    .messages({
      'array.min': 'At least 2 nameservers are required',
      'array.max': 'Maximum 4 nameservers allowed',
    }),
});

// Domain transfer validation
export const domainTransferSchema = Joi.object({
  domain: Joi.string()
    .trim()
    .pattern(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i)
    .required(),
  authCode: Joi.string().trim().min(8).max(50).required().messages({
    'string.min': 'Authorization code must be at least 8 characters',
    'string.max': 'Authorization code cannot exceed 50 characters',
    'any.required': 'Authorization code is required for domain transfer',
  }),
  period: Joi.number().integer().min(1).max(10).default(1),
  privacy: Joi.boolean().default(true),
});

// Domain renewal validation
export const domainRenewalSchema = Joi.object({
  domain: Joi.string()
    .trim()
    .pattern(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i)
    .required(),
  period: Joi.number().integer().min(1).max(10).default(1).messages({
    'number.min': 'Period must be at least 1 year',
    'number.max': 'Period cannot exceed 10 years',
  }),
});

// DNS record schema for add/update
export const dnsRecordSchema = Joi.object({
  type: Joi.string()
    .valid('A', 'AAAA', 'CNAME', 'TXT', 'MX', 'SRV', 'NS', 'CAA')
    .required(),
  name: Joi.string().trim().allow('@', '').required(),
  data: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
  ttl: Joi.number().integer().min(1).max(86400).default(3600),
  priority: Joi.number().integer().min(0).max(65535).optional(),
});

export const dnsRecordsSchema = Joi.object({
  record: dnsRecordSchema.required(),
});

// Forwarding schema
export const forwardingSchema = Joi.object({
  enabled: Joi.boolean().required(),
  forwardTo: Joi.string().uri().when('enabled', { is: true, then: Joi.required() }),
  type: Joi.number().valid(301, 302).default(301),
  mask: Joi.boolean().default(false),
});

// Contact update schema (partial allowed)
export const contactUpdateSchema = Joi.object({
  contactRegistrant: Joi.object({
    firstName: Joi.string().trim().min(2).max(50).optional(),
    lastName: Joi.string().trim().min(2).max(50).optional(),
    email: Joi.string().trim().email().optional(),
    phone: Joi.string().trim().pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/).optional(),
    organization: Joi.string().trim().max(100).allow('').optional(),
    address: Joi.object({
      street: Joi.string().trim().max(200).optional(),
      city: Joi.string().trim().max(100).optional(),
      state: Joi.string().trim().max(100).optional(),
      country: Joi.string().trim().length(2).uppercase().optional(),
      zipCode: Joi.string().trim().max(20).optional(),
    }).optional(),
  }).optional(),
  contactAdmin: Joi.object().optional(),
  contactTech: Joi.object().optional(),
  contactBilling: Joi.object().optional(),
});

// Domain lock/unlock schema
export const domainLockSchema = Joi.object({
  lock: Joi.boolean().required(),
});
