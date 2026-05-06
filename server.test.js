const request = require('supertest');
const { app } = require('./server');

describe('API Tests', () => {
    it('GET /api/categories', async () => {
        const res = await request(app).get('/api/categories');
        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBeTruthy();
    });

    it('POST /api/login unauthorized', async () => {
        const res = await request(app).post('/api/login').send({});
        expect(res.statusCode).toEqual(401);
    });
});