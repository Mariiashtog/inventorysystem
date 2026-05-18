const express = require('express');
const router = express.Router();
const Joi = require('joi');
const BasketController = require('../controllers/basket.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { validate, validateParams } = require('../middleware/validation.middleware');
const { addToBasketSchema } = require('../validators/basket.validator');

/**
 * @swagger
 * tags:
 *   name: Basket
 *   description: Shopping basket endpoints
 */

/**
 * @swagger
 * /api/basket:
 *   get:
 *     summary: Get user's basket
 *     tags: [Basket]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Basket items
 */
router.get('/', authenticateToken, BasketController.getAll);

/**
 * @swagger
 * /api/basket:
 *   post:
 *     summary: Add item to basket
 *     tags: [Basket]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BasketItem'
 *     responses:
 *       201:
 *         description: Item added
 */
router.post('/', authenticateToken, validate(addToBasketSchema), BasketController.add);

/**
 * @swagger
 * /api/basket/{id}:
 *   delete:
 *     summary: Remove item from basket
 *     tags: [Basket]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Item removed
 */
router.delete('/:id',
  authenticateToken,
  validateParams(Joi.object({ id: Joi.number().integer().required() })),
  BasketController.remove
);

module.exports = router;