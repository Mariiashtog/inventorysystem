const request = require('supertest');
const { app, pool } = require('./server');

describe('API Tests', () => {
  let token = '';
  let categoryId;
  let itemId;
  let basketId;

  afterAll(async () => {
    await pool.end();
  });

  it('POST /api/login - success', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ username: 'admin', password: 'admin123' });
    expect(res.statusCode).toEqual(200);
    expect(res.body.token).toBeDefined();
    token = res.body.token;
  });

  it('POST /api/login - failure', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ username: 'admin', password: 'wrongpassword' });
    expect(res.statusCode).toEqual(401);
  });

  it('GET /api/categories - success', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });

  it('POST /api/categories - success', async () => {
    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ category_name: 'TestCategory123' });
    expect(res.statusCode).toEqual(201);
    expect(res.body.id).toBeDefined();
    categoryId = res.body.id;
  });

  it('POST /api/categories - unauthorized', async () => {
    const res = await request(app)
      .post('/api/categories')
      .send({ category_name: 'TestCategory123' });
    expect(res.statusCode).toEqual(401);
  });

  it('POST /api/categories - missing fields', async () => {
    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.statusCode).toEqual(400);
  });

  it('PUT /api/categories/:id - success', async () => {
    const res = await request(app)
      .put(`/api/categories/${categoryId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ category_name: 'UpdatedCategory123' });
    expect(res.statusCode).toEqual(200);
  });

  it('POST /api/items - success', async () => {
    const res = await request(app)
      .post('/api/items')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'TestItem123',
        category: 'UpdatedCategory123',
        quantity: 10,
        price: 500
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body.id).toBeDefined();
    itemId = res.body.id;
  });

  it('POST /api/items - missing fields', async () => {
    const res = await request(app)
      .post('/api/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'TestItem123' });
    expect(res.statusCode).toEqual(400);
  });

  it('GET /api/items - success', async () => {
    const res = await request(app).get('/api/items');
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });

  it('GET /api/items?name=TestItem123 - search', async () => {
    const res = await request(app).get('/api/items?name=TestItem123');
    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('GET /api/items/:id - success', async () => {
    const res = await request(app).get(`/api/items/${itemId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.id).toEqual(itemId);
  });

  it('GET /api/items/:id - not found', async () => {
    const res = await request(app).get('/api/items/99999999');
    expect(res.statusCode).toEqual(404);
  });

  it('PUT /api/items/:id - success', async () => {
    const res = await request(app)
      .put(`/api/items/${itemId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ price: 600, quantity: 15 });
    expect(res.statusCode).toEqual(200);
  });

  it('POST /api/basket - success', async () => {
    const res = await request(app)
      .post('/api/basket')
      .set('Authorization', `Bearer ${token}`)
      .send({ product_id: itemId, quantity: 2 });
    expect(res.statusCode).toEqual(201);
  });

  it('POST /api/basket - validation error (quantity > stock)', async () => {
    const res = await request(app)
      .post('/api/basket')
      .set('Authorization', `Bearer ${token}`)
      .send({ product_id: itemId, quantity: 1000 });
    expect(res.statusCode).toEqual(400);
  });

  it('POST /api/basket - validation error (invalid quantity)', async () => {
    const res = await request(app)
      .post('/api/basket')
      .set('Authorization', `Bearer ${token}`)
      .send({ product_id: itemId, quantity: -5 });
    expect(res.statusCode).toEqual(400);
  });

  it('GET /api/basket - success', async () => {
    const res = await request(app)
      .get('/api/basket')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
    if (res.body.length > 0) {
      basketId = res.body[0].id;
    }
  });

  it('DELETE /api/basket/:id - success', async () => {
    if (basketId) {
      const res = await request(app)
        .delete(`/api/basket/${basketId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toEqual(204);
    }
  });

  it('DELETE /api/items/:id - success', async () => {
    const res = await request(app)
      .delete(`/api/items/${itemId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(204);
  });

  it('DELETE /api/categories/:id - success', async () => {
    const res = await request(app)
      .delete(`/api/categories/${categoryId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(204);
  });
});