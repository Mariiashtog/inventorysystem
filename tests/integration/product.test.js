const request = require('supertest');
const app = require('../../src/app');

describe('Product API', () => {
  let authToken;
  let productId;
  let categoryId;

  beforeAll(async () => {
    // 1. Логін
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: process.env.ADMIN_PASSWORD || 'admin123'
      });
    authToken = loginRes.body.token;

    // 2. Створюємо категорію для товару
    const catRes = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ category_name: 'TestCat' });
    categoryId = catRes.body.idcategories;
  });

  describe('POST /api/products', () => {
    it('should create a new product', async () => {
      const productData = {
        name: 'Test Product',
        quantity: 10,
        price: 100,
        category: 'TestCat'
      };

      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(productData);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe(productData.name);

      productId = res.body.id;
    });

    it('should return 400 for invalid data', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: '' });

      expect(res.statusCode).toEqual(400);
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .post('/api/products')
        .send({ name: 'Test' });

      expect(res.statusCode).toEqual(401);
    });
  });

  describe('GET /api/products', () => {
    it('should get all products', async () => {
      const res = await request(app).get('/api/products');

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should filter by name', async () => {
      const res = await request(app).get('/api/products?name=Test');

      expect(res.statusCode).toEqual(200);
      res.body.data.forEach(p => {
        expect(p.name).toContain('Test');
      });
    });
  });

  describe('GET /api/products/:id', () => {
    it('should get product by id', async () => {
      if (!productId) {
        console.warn('⚠️ Skipping GET product test: productId not set');
        return;
      }

      const res = await request(app).get(`/api/products/${productId}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.id).toBe(productId);
    });

    it('should return 404 for non-existent id', async () => {
      const res = await request(app).get('/api/products/99999');
      expect(res.statusCode).toEqual(404);
    });
  });

  describe('PUT /api/products/:id', () => {
    it('should update product', async () => {
      if (!productId) {
        console.warn('⚠️ Skipping PUT product test: productId not set');
        return;
      }

      const res = await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ price: 150, quantity: 15 });

      expect(res.statusCode).toEqual(200);

      // ✅ Виправлено: порівнюємо як числа (бо MySQL повертає DECIMAL як строку)
      const returnedPrice = parseFloat(res.body.price);
      expect(returnedPrice).toBe(150);
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('should delete product', async () => {
      if (!productId) {
        console.warn('⚠️ Skipping DELETE product test: productId not set');
        return;
      }

      const res = await request(app)
        .delete(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(204);

      const checkRes = await request(app).get(`/api/products/${productId}`);
      expect(checkRes.statusCode).toEqual(404);
    });
  });
});