const request = require('supertest');
const SERVER_URL = 'http://localhost:3000';

describe('Glow & Care API Tests', () => {
    
test('Головна сторінка має повертати статус 200', async () => {
    const response = await request(SERVER_URL).get('/');
    expect(response.statusCode).toBe(200);
    expect(response.text).toContain('<!DOCTYPE html>'); // Перевіряємо, що це HTML
});

    test('Захищений маршрут /profile без токена має видати 401', async () => {
        const response = await request(SERVER_URL).get('/profile');
        expect(response.statusCode).toBe(401);
        expect(response.body.message).toBe("Немає токена");
    });

    test('Маршрут /admin без токена має видати 401', async () => {
        const response = await request(SERVER_URL).get('/admin');
        expect(response.statusCode).toBe(401);
    });

    test('POST /register з пустими полями має повертати 400', async () => {
        const response = await request(SERVER_URL)
            .post('/register')
            .send({ email: "test@mail.com" }); 
        expect(response.statusCode).toBe(400);
    });
});