const request = require('supertest');
const path = require('path');
const fs = require('fs');

// Create a test version of the app with security middleware
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
const testDbPath = path.join(__dirname, '../security-test.db');
const db = new sqlite3.Database(testDbPath);

// Initialize test database
const schemaPath = path.join(__dirname, '../../database/schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

beforeAll((done) => {
  db.exec(schema, (err) => {
    if (err) {
      console.error('Error initializing test database:', err);
      done(err);
    } else {
      done();
    }
  });
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

// Security middleware setup
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting for testing
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: 'Too many login attempts from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test', // Skip in test environment for faster testing
});

app.use('/api/auth/', authLimiter);

const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-domain.com']
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Invalid input', 
      details: errors.array() 
    });
  }
  next();
};

const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ error: 'Token expired' });
        }
        if (err.name === 'JsonWebTokenError') {
          return res.status(401).json({ error: 'Invalid token' });
        }
        return res.status(403).json({ error: 'Token verification failed' });
      }
      req.user = user;
      next();
    });
  } catch (error) {
    return res.status(500).json({ error: 'Authentication error' });
  }
};

// Test routes
app.post('/api/auth/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8, max: 128 }),
  body('name').trim().isLength({ min: 2, max: 100 }),
  handleValidationErrors
], async (req, res) => {
  const { email, password, name, role = 'client' } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    const query = 'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)';
    
    db.run(query, [email, hashedPassword, name, role], function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Email already exists' });
        }
        return res.status(500).json({ error: 'Registration failed' });
      }

      const token = jwt.sign(
        { id: this.lastID, email, role }, 
        JWT_SECRET, 
        { expiresIn: '24h' }
      );
      res.status(201).json({ 
        message: 'User registered successfully',
        token,
        user: { id: this.lastID, email, name, role }
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/projects', [
  authenticateToken,
  body('name').trim().isLength({ min: 1, max: 200 }),
  body('client_id').isInt({ min: 1 }),
  handleValidationErrors
], (req, res) => {
  const { name, description, client_id, project_manager_id, status, start_date, end_date, budget } = req.body;

  if (req.user.role === 'client') {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  const query = `INSERT INTO projects (name, description, client_id, project_manager_id, status, start_date, end_date, budget) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  
  db.run(query, [name, description, client_id, project_manager_id, status, start_date, end_date, budget], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(201).json({ id: this.lastID, message: 'Project created successfully' });
  });
});

describe('Security Middleware Tests', () => {
  describe('Helmet Security Headers', () => {
    test('should set security headers', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      // Check for helmet security headers
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('0');
    });
  });

  describe('Input Validation Security', () => {
    test('should sanitize email input', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'Test@EXAMPLE.COM', // Should be normalized
          password: 'Strong123!',
          name: 'Test User'
        });

      expect(response.status).toBe(201);
      expect(response.body.user.email).toBe('test@example.com');
    });

    test('should prevent XSS in name field', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'xss@example.com',
          password: 'Strong123!',
          name: '<script>alert("xss")</script>' // XSS attempt
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid input');
    });

    test('should validate integer inputs', async () => {
      // First create a user and get token
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'admin@example.com',
          password: 'Strong123!',
          name: 'Admin User'
        });

      // Modify the user's role to admin for testing
      await new Promise((resolve) => {
        db.run('UPDATE users SET role = ? WHERE id = ?', ['admin', registerResponse.body.user.id], resolve);
      });

      const token = registerResponse.body.token;

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test Project',
          client_id: 'invalid-id' // Should be integer
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid input');
    });
  });

  describe('SQL Injection Protection', () => {
    test('should prevent SQL injection in email field', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: "test@example.com'; DROP TABLE users; --",
          password: 'Strong123!',
          name: 'SQL Injection Test'
        });

      // Should either fail validation or handle safely
      // The parameterized query should prevent any SQL injection
      if (response.status === 201) {
        // If it passes validation, ensure the malicious SQL didn't execute
        // Check that users table still exists by trying to query it
        const loginResponse = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'test2@example.com',
            password: 'Strong123!',
            name: 'Test After Injection'
          });
        
        expect(loginResponse.status).toBe(201); // Table should still exist
      } else {
        // Should fail validation due to invalid email format
        expect(response.status).toBe(400);
      }
    });
  });

  describe('Authorization Security', () => {
    let clientToken, adminToken;

    beforeEach(async () => {
      // Create client user
      const clientResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'client@example.com',
          password: 'Strong123!',
          name: 'Client User'
        });
      clientToken = clientResponse.body.token;

      // Create admin user
      const adminResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'admin@example.com',
          password: 'Strong123!',
          name: 'Admin User'
        });
      adminToken = adminResponse.body.token;

      // Update admin role in database
      await new Promise((resolve) => {
        db.run('UPDATE users SET role = ? WHERE id = ?', ['admin', adminResponse.body.user.id], resolve);
      });
    });

    test('should prevent clients from creating projects', async () => {
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          name: 'Unauthorized Project',
          client_id: 1
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Insufficient permissions');
    });

    test('should allow admins to create projects', async () => {
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Authorized Project',
          client_id: 1
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Project created successfully');
    });
  });

  describe('Request Size Limits', () => {
    test('should handle reasonable request sizes', async () => {
      const largeButValidName = 'A'.repeat(200); // Max allowed length

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'large@example.com',
          password: 'Strong123!',
          name: largeButValidName
        });

      expect(response.status).toBe(201);
    });

    test('should reject oversized input fields', async () => {
      const oversizedName = 'A'.repeat(201); // Over max allowed length

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'oversized@example.com',
          password: 'Strong123!',
          name: oversizedName
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid input');
    });
  });

  describe('Error Handling Security', () => {
    test('should not expose internal errors', async () => {
      // Close the database to simulate error
      db.close();

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'error@example.com',
          password: 'Strong123!',
          name: 'Error Test'
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Registration failed');
      // Should not contain database error details
      expect(response.body.error).not.toContain('sqlite');
      expect(response.body.error).not.toContain('database');
    });
  });
});