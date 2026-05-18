const ProductModel = require('../models/product.model');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

class ProductController {
  static async getAll(req, res, next) {
    try {
      // ✅ Безпечне отримання параметрів з дефолтами
      const { name, category, page, limit } = req.query;

      const result = await ProductModel.findAll({
        name: name?.toString(),
        category: category?.toString(),
        page: page?.toString(),
        limit: limit?.toString()
      });

      res.json(result);
    } catch (error) {
      logger.error('Error fetching products:', error);
      next(new ApiError(500, 'Failed to fetch products'));
    }
  }

  static async getById(req, res, next) {
    try {
      const product = await ProductModel.findById(req.params.id);

      if (!product) {
        return next(new ApiError(404, 'Product not found'));
      }

      res.json(product);
    } catch (error) {
      logger.error('Error fetching product:', error);
      next(new ApiError(500, 'Failed to fetch product'));
    }
  }

  static async create(req, res, next) {
    try {
      const product = await ProductModel.create(req.body);
      res.status(201).json(product);
    } catch (error) {
      logger.error('Error creating product:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        return next(new ApiError(400, 'Product already exists'));
      }
      next(new ApiError(500, 'Failed to create product'));
    }
  }

  static async update(req, res, next) {
    try {
      const product = await ProductModel.update(req.params.id, req.body);

      if (!product) {
        return next(new ApiError(404, 'Product not found'));
      }

      res.json(product);
    } catch (error) {
      logger.error('Error updating product:', error);
      next(new ApiError(500, 'Failed to update product'));
    }
  }

  static async delete(req, res, next) {
    try {
      const deleted = await ProductModel.delete(req.params.id);

      if (!deleted) {
        return next(new ApiError(404, 'Product not found'));
      }

      res.status(204).send();
    } catch (error) {
      logger.error('Error deleting product:', error);
      next(new ApiError(500, 'Failed to delete product'));
    }
  }
}

module.exports = ProductController;