const CategoryModel = require('../models/category.model');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

class CategoryController {
  static async getAll(req, res, next) {
    try {
      const categories = await CategoryModel.findAll();
      res.json(categories);
    } catch (error) {
      logger.error('Error fetching categories:', error);
      next(new ApiError(500, 'Failed to fetch categories'));
    }
  }

  static async create(req, res, next) {
    try {
      const category = await CategoryModel.create(req.body.category_name);
      res.status(201).json(category);
    } catch (error) {
      logger.error('Error creating category:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        return next(new ApiError(400, 'Category already exists'));
      }
      next(new ApiError(500, 'Failed to create category'));
    }
  }

  static async update(req, res, next) {
    try {
      const category = await CategoryModel.update(req.params.id, req.body.category_name);
      if (!category) {
        return next(new ApiError(404, 'Category not found'));
      }
      res.json(category);
    } catch (error) {
      logger.error('Error updating category:', error);
      next(new ApiError(500, 'Failed to update category'));
    }
  }

  static async delete(req, res, next) {
    try {
      const deleted = await CategoryModel.delete(req.params.id);
      if (!deleted) {
        return next(new ApiError(404, 'Category not found'));
      }
      res.status(204).send();
    } catch (error) {
      logger.error('Error deleting category:', error);
      next(new ApiError(500, 'Failed to delete category'));
    }
  }
}

module.exports = CategoryController;