const request = require('supertest');
const app = require('../server');

describe('Basic Security Tests', () => {
  describe('Security Headers', () => {
    test('should include basic security headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      // Check for basic security headers from helmet
      expect(response.headers['x-content-type-options']).toBeDefined();
      expect(response.headers['x-frame-options']).toBeDefined();
    });
  });

  describe('Input Validation', () => {
    test('should reject empty registration data', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid input');
    });

    test('should reject malformed email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'not-an-email',
          password: 'Strong123!',
          name: 'Test User'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid input');
    });

    test('should reject weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'weak',
          name: 'Test User'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid input');
    });
  });

  describe('Authentication', () => {
    test('should reject access to protected routes without token', async () => {
      const response = await request(app)
        .get('/api/projects')
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });

    test('should reject invalid token format', async () => {
      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error).toBe('Invalid token');
    });
  });

  describe('Error Handling', () => {
    test('should not expose internal errors', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'anypassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
      // Should not contain database error details
      expect(response.body.error).not.toContain('sqlite');
      expect(response.body.error).not.toContain('database');
    });
  });

  describe('SQL Injection Protection', () => {
    test('should handle SQL injection attempts safely', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: "test@example.com'; DROP TABLE users; --",
          password: 'password'
        });

      // Should either fail validation or handle safely without exposing SQL errors
      expect([400, 401]).toContain(response.status);
      expect(response.body.error).not.toContain('syntax error');
      expect(response.body.error).not.toContain('SQL');
    });
  });
});