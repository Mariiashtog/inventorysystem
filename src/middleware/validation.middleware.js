const ApiError = require('../utils/apiError');

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    return next(new ApiError(400, 'Validation failed', errors));
  }

  next();
};

const validateQuery = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    return next(new ApiError(400, 'Query validation failed', errors));
  }

  next();
};

const validateParams = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.params, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    return next(new ApiError(400, 'Params validation failed', errors));
  }

  next();
};

module.exports = { validate, validateQuery, validateParams };