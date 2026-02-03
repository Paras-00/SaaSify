import { errorResponse } from '../../utils/response.js';
import logger from '../../utils/logger.js';

/**
 * Joi validation middleware
 * @param {Joi.Schema} schema - Joi validation schema
 * @param {string} source - Data source to validate ('body', 'query', 'params')
 */
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const dataToValidate = req[source];
    
    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      logger.warn('Validation error:', { errors, [source]: dataToValidate });

      return errorResponse(res, 'Validation failed', 400, errors);
    }

    // Replace with sanitized value
    req[source] = value;
    next();
  };
};
