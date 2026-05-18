const BasketModel = require('../models/basket.model');
const ProductModel = require('../models/product.model');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

class BasketController {
  static async getAll(req, res, next) {
    try {
      const username = req.user.username;
      const items = await BasketModel.findByUser(username);
      res.json(items);
    } catch (error) {
      logger.error('Error fetching basket:', error);
      next(new ApiError(500, 'Failed to fetch basket'));
    }
  }

  static async add(req, res, next) {
    try {
      const { product_id, quantity } = req.body;
      const username = req.user.username;

      // Перевірка наявності товару
      const product = await ProductModel.findById(product_id);
      if (!product) {
        return next(new ApiError(404, 'Product not found'));
      }

      // Перевірка залишку
      if (product.quantity < quantity) {
        return next(new ApiError(400, `Only ${product.quantity} items available`));
      }

      const result = await BasketModel.addOrUpdate(username, product_id, quantity);
      res.status(201).json(result);
    } catch (error) {
      logger.error('Error adding to basket:', error);
      next(new ApiError(500, 'Failed to add to basket'));
    }
  }

  static async remove(req, res, next) {
    try {
      const username = req.user.username;
      const deleted = await BasketModel.remove(username, req.params.id);

      if (!deleted) {
        return next(new ApiError(404, 'Item not found in basket'));
      }

      res.status(204).send();
    } catch (error) {
      logger.error('Error removing from basket:', error);
      next(new ApiError(500, 'Failed to remove from basket'));
    }
  }
}

module.exports = BasketController;