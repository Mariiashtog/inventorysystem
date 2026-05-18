const request = require('supertest');
const app = require('../../src/app');

describe('Auth API', () => {

  describe('POST /api/auth/login', () => {

    it('should login with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: process.env.ADMIN_PASSWORD || 'admin123'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      expect(typeof res.body.token).toBe('string');
    });

    it('should reject wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'wrongpassword'
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('error');
    });

    it('should reject missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin' });

      expect(res.statusCode).toEqual(400);
    });
  });
});