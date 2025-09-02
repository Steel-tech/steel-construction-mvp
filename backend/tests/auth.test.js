const request = require('supertest');
const path = require('path');
const fs = require('fs');

// Create a test version of the app
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { body, param, validationResult } = require('express-validator');

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';

// Test database setup
const testDbPath = path.join(__dirname, '../test.db');

// Ensure the database file doesn't exist before creating
if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
}

const db = new sqlite3.Database(testDbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error('Failed to open test database:', err);
    } else {
        // Explicitly set file permissions to be writable
        try {
            fs.chmodSync(testDbPath, 0o666);
        } catch (chmodErr) {
            console.warn('Could not set database file permissions:', chmodErr.message);
        }
    }
});

// Initialize test database
const schemaPath = path.join(__dirname, '../../database/schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

beforeAll((done) => {
  // Ensure database is ready before executing schema
  setTimeout(() => {
    // Set WAL mode for better concurrency and avoid readonly issues
    db.run('PRAGMA journal_mode=WAL', (walErr) => {
      // Ignore WAL errors - some systems don't support it
      if (walErr && !walErr.message.includes('I/O error')) {
        console.warn('Could not set WAL mode:', walErr.message);
      }
      
      db.exec(schema, (err) => {
        if (err) {
          console.error('Error initializing test database:', err);
          done(err);
        } else {
          // Test if database is still writable after schema
          db.run('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)', 
            ['test-write@test.com', 'test', 'Test Write', 'client'], (testErr) => {
            if (testErr) {
              console.error('Database not writable after schema init:', testErr);
              done(testErr);
            } else {
              // Clean up test data
              db.run('DELETE FROM users WHERE email = ?', ['test-write@test.com'], () => {
                done();
              });
            }
          });
        }
      });
    });
  }, 100);
});

afterAll((done) => {
  db.close((err) => {
    if (err) {
      console.error('Error closing test database:', err);
    }
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    done();
  });
});

// Setup minimal app for testing auth routes
app.use(express.json({ limit: '10mb' }));

// Make database available to routes
app.locals.db = db;

// Import and use the actual auth routes
const authRoutes = require('../routes/auth');
app.use('/api/auth', authRoutes);

// Add a simple protected route for testing
const { authenticateToken } = require('../middleware/auth');
app.get('/api/protected', authenticateToken, (req, res) => {
  res.json({ message: 'Protected route accessed', user: req.user });
});

describe('Authentication Security Tests', () => {
  describe('POST /api/auth/register', () => {
    test('should reject weak passwords', async () => {
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

    test('should reject invalid email formats', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Strong123!',
          name: 'Test User'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid input');
    });

    test('should reject invalid names', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Strong123!',
          name: 'Test123' // Contains numbers
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid input');
    });

    test('should successfully register valid user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'valid@example.com',
          password: 'Strong123!',
          name: 'Valid User'
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe('valid@example.com');
      expect(response.body.user.role).toBe('client');
    });

    test('should prevent duplicate email registration', async () => {
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'Strong123!',
          name: 'First User'
        });

      // Second registration with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'Strong456!',
          name: 'Second User'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create test user
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'login@example.com',
          password: 'Strong123!',
          name: 'Login User'
        });
    });

    test('should successfully login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'Strong123!'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.token).toBeDefined();
    });

    test('should reject invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrong@example.com',
          password: 'Strong123!'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    test('should reject invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'WrongPassword123!'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    test('should reject malformed email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'not-an-email',
          password: 'Strong123!'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid input');
    });
  });

  describe('JWT Token Security', () => {
    let validToken;

    beforeEach(async () => {
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'token@example.com',
          password: 'Strong123!',
          name: 'Token User'
        });
      validToken = registerResponse.body.token;
    });

    test('should access protected route with valid token', async () => {
      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Protected route accessed');
    });

    test('should reject access without token', async () => {
      const response = await request(app)
        .get('/api/protected');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access token required');
    });

    test('should reject invalid token format', async () => {
      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid token');
    });

    test('should reject expired token', async () => {
      // Create an expired token
      const expiredToken = jwt.sign(
        { id: 1, email: 'test@example.com', role: 'client' },
        JWT_SECRET,
        { expiresIn: '1ms' }
      );

      // Wait to ensure token expires
      await new Promise(resolve => setTimeout(resolve, 10));

      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Token expired');
    });
  });
});