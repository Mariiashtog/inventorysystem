const Joi = require('joi');

const addToBasketSchema = Joi.object({
  product_id: Joi.number().integer().required().messages({
    'number.base': 'Product ID must be a number',
    'any.required': 'Product ID is required'
  }),
  quantity: Joi.number().integer().min(1).required().messages({
    'number.base': 'Quantity must be a number',
    'number.min': 'Quantity must be at least 1',
    'any.required': 'Quantity is required'
  })
});

module.exports = { addToBasketSchema };