const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Inventory Management API',
      version: '1.0.0',
      description: 'API for managing inventory, products, categories and shopping basket',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Product: {
          type: 'object',
          required: ['name', 'quantity', 'category'],
          properties: {
            id: { type: 'integer', description: 'Product ID' },
            name: { type: 'string', minLength: 1, maxLength: 255 },
            quantity: { type: 'integer', minimum: 0 },
            price: { type: 'number', minimum: 0, format: 'float' },
            category: { type: 'string', minLength: 1 },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        Category: {
          type: 'object',
          required: ['category_name'],
          properties: {
            id: { type: 'integer' },
            idcategories: { type: 'integer' },
            category_name: { type: 'string', minLength: 1, maxLength: 100 },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        BasketItem: {
          type: 'object',
          required: ['product_id', 'quantity'],
          properties: {
            product_id: { type: 'integer' },
            quantity: { type: 'integer', minimum: 1 }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: { type: 'string' },
            password: { type: 'string', minLength: 6 }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            token: { type: 'string' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
            statusCode: { type: 'integer' }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' },
            pages: { type: 'integer' }
          }
        },
        ProductsResponse: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Product'
              }
            },
            pagination: {
              $ref: '#/components/schemas/Pagination'
            }
          }
        }
      }
    }
  },
  // ✅ Шукаємо JSDoc коментарі в route файлах
  apis: ['./src/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Inventory API Docs'
  }));

  return swaggerSpec;
};

module.exports = { swaggerOptions, swaggerSpec, setupSwagger };