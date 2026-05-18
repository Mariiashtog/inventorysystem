const Joi = require('joi');

const createProductSchema = Joi.object({
  name: Joi.string().required().min(1).max(255).messages({
    'string.empty': 'Назва обов\'язкова',
    'any.required': 'Назва обов\'язкова'
  }),
  quantity: Joi.number().integer().min(0).required().messages({
    'number.base': 'Кількість має бути числом',
    'any.required': 'Кількість обов\'язкова'
  }),
  price: Joi.number().min(0).default(0).messages({
    'number.base': 'Ціна має бути числом'
  }),
  category: Joi.string().required().min(1).messages({
    'string.empty': 'Категорія обов\'язкова',
    'any.required': 'Категорія обов\'язкова'
  }),
  image_url: Joi.string().uri().allow('', null).optional()
});

const updateProductSchema = Joi.object({
  name: Joi.string().min(1).max(255).optional(),
  quantity: Joi.number().integer().min(0).optional(),
  price: Joi.number().min(0).optional(),
  category: Joi.string().min(1).optional(),
  image_url: Joi.string().uri().allow('', null).optional()
}).min(1);

const productQuerySchema = Joi.object({
  name: Joi.string().optional(),
  category: Joi.string().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  productQuerySchema
};