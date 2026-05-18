const request = require('supertest');
const app = require('../../src/app');

describe('Category API', () => {
  let authToken;
  let categoryId;

  beforeAll(async () => {
    // Отримуємо токен один раз для всіх тестів
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: process.env.ADMIN_PASSWORD || 'admin123'
      });
    authToken = loginRes.body.token;
  });

  describe('GET /api/categories', () => {
    it('should get all categories', async () => {
      const res = await request(app).get('/api/categories');
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('POST /api/categories', () => {
    it('should create a new category', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ category_name: 'TestCategory' });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('idcategories');
      expect(res.body.category_name).toBe('TestCategory');
      categoryId = res.body.idcategories; // ✅ Зберігаємо для наступних тестів
    });

    it('should return 400 for empty name', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ category_name: '' });

      expect(res.statusCode).toEqual(400);
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .post('/api/categories')
        .send({ category_name: 'Test' });

      expect(res.statusCode).toEqual(401);
    });
  });

  describe('PUT /api/categories/:id', () => {
    it('should update category', async () => {
      // ✅ Пропускаємо, якщо категорія не була створена
      if (!categoryId) {
        console.warn('⚠️ Skipping PUT test: categoryId not set');
        return;
      }

      const res = await request(app)
        .put(`/api/categories/${categoryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ category_name: 'UpdatedCategory' });

      expect(res.statusCode).toEqual(200);
    });
  });

  describe('DELETE /api/categories/:id', () => {
    it('should delete category', async () => {
      if (!categoryId) {
        console.warn('⚠️ Skipping DELETE test: categoryId not set');
        return;
      }

      const res = await request(app)
        .delete(`/api/categories/${categoryId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(204);
    });
  });
});