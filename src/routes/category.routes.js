const express = require('express');
const router = express.Router();
const Joi = require('joi');
const CategoryController = require('../controllers/category.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { validate, validateParams } = require('../middleware/validation.middleware');
const { createCategorySchema, updateCategorySchema } = require('../validators/category.validator');

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Category management endpoints
 */

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: List of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 */
router.get('/', CategoryController.getAll);

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Create category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Category'
 *     responses:
 *       201:
 *         description: Category created
 */
router.post('/', authenticateToken, validate(createCategorySchema), CategoryController.create);

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Update category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Category'
 *     responses:
 *       200:
 *         description: Category updated
 */
router.put('/:id',
  authenticateToken,
  validateParams(Joi.object({ id: Joi.number().integer().required() })),
  validate(updateCategorySchema),
  CategoryController.update
);

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Delete category
 *     tags: [Categories]
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
 *         description: Category deleted
 */
router.delete('/:id',
  authenticateToken,
  validateParams(Joi.object({ id: Joi.number().integer().required() })),
  CategoryController.delete
);

module.exports = router;