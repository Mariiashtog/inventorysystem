const Joi = require('joi');

const createCategorySchema = Joi.object({
  category_name: Joi.string().required().min(1).max(100).messages({
    'string.empty': 'Category name is required',
    'string.min': 'Category name cannot be empty',
    'string.max': 'Category name must be less than 100 characters',
    'any.required': 'Category name is required'
  })
});

const updateCategorySchema = Joi.object({
  category_name: Joi.string().required().min(1).max(100).messages({
    'string.empty': 'Category name is required',
    'any.required': 'Category name is required'
  })
});

module.exports = { createCategorySchema, updateCategorySchema };