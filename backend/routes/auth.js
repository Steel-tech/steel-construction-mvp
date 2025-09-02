const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const logger = require('../utils/logger');

// Get database instance from app locals (shared connection) or create new one for tests
let db;
const getDb = (req) => {
    // Always prefer app.locals.db if available (for tests)
    if (req && req.app && req.app.locals && req.app.locals.db) {
        return req.app.locals.db;
    }
    
    if (!db) {
        const dbPath = process.env.NODE_ENV === 'test' 
            ? path.join(__dirname, '../test.db')
            : path.join(__dirname, '../../database/steel_construction.db');
        
        // Open database with read-write permissions
        db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
            if (err) {
                logger.error('Failed to connect to database in auth routes', { error: err.message, dbPath });
            } else {
                logger.info('Connected to database in auth routes', { dbPath });
            }
        });
    }
    return db;
};

// JWT Secret from environment
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Validation middleware
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.warn('Validation error', { errors: errors.array(), ip: req.ip });
        return res.status(400).json({ 
            error: 'Invalid input', 
            details: errors.array() 
        });
    }
    next();
};

/**
 * Register a new user
 * POST /api/v1/auth/register
 */
router.post('/register', [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email is required'),
    body('password')
        .isLength({ min: 8, max: 128 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/) 
        .withMessage('Password must be 8-128 characters with uppercase, lowercase, number, and special character'),
    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('Name must be 2-100 characters, letters and spaces only')
        .custom((value) => {
            // Additional XSS prevention
            if (/<[^>]*>/.test(value)) {
                throw new Error('HTML tags are not allowed in name');
            }
            return true;
        }),
    body('role')
        .optional()
        .isIn(['admin', 'project_manager', 'client', 'shop_worker', 'field_worker'])
        .withMessage('Invalid role'),
    handleValidationErrors
], async (req, res) => {
    const { email, password, name, role = 'client' } = req.body;

    try {
        // Hash password with high cost factor
        const hashedPassword = await bcrypt.hash(password, 12);

        // Insert user into database
        const query = 'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)';
        const database = getDb(req);
        
        database.run(query, [email, hashedPassword, name, role], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    logger.warn('Registration attempt with existing email', { email, ip: req.ip });
                    return res.status(400).json({ error: 'Email already exists' });
                }
                logger.error('Database error during registration', { 
                    error: err.message, 
                    fullError: err,
                    email, 
                    role,
                    query 
                });
                return res.status(500).json({ error: 'Registration failed' });
            }

            // Generate JWT token
            const token = jwt.sign(
                { id: this.lastID, email, role }, 
                JWT_SECRET, 
                { expiresIn: JWT_EXPIRES_IN }
            );

            logger.info('User registered successfully', { userId: this.lastID, email, role });

            res.status(201).json({ 
                message: 'User registered successfully',
                token,
                user: { id: this.lastID, email, name, role }
            });
        });
    } catch (error) {
        logger.error('Registration error', { error: error.message });
        res.status(500).json({ error: 'Registration failed' });
    }
});

/**
 * Login user
 * POST /api/v1/auth/login
 */
router.post('/login', [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email is required'),
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
    handleValidationErrors
], (req, res) => {
    const { email, password } = req.body;

    // Get user from database
    const database = getDb(req);
    database.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err) {
            logger.error('Database error during login', { error: err.message });
            return res.status(500).json({ error: 'Login failed' });
        }

        if (!user) {
            logger.warn('Login attempt with non-existent email', { email, ip: req.ip });
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        try {
            // Verify password
            const isValid = await bcrypt.compare(password, user.password);
            if (!isValid) {
                logger.warn('Login attempt with incorrect password', { email, ip: req.ip });
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Generate JWT token
            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role },
                JWT_SECRET,
                { expiresIn: JWT_EXPIRES_IN }
            );

            logger.info('User logged in successfully', { userId: user.id, email });

            res.json({
                message: 'Login successful',
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                }
            });
        } catch (error) {
            logger.error('Login error', { error: error.message });
            res.status(500).json({ error: 'Login failed' });
        }
    });
});

/**
 * Refresh token
 * POST /api/v1/auth/refresh
 */
router.post('/refresh', (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            logger.warn('Token refresh attempt with invalid token', { ip: req.ip });
            return res.status(403).json({ error: 'Invalid token' });
        }

        // Generate new token
        const newToken = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        logger.info('Token refreshed successfully', { userId: user.id });

        res.json({
            message: 'Token refreshed successfully',
            token: newToken
        });
    });
});

/**
 * Logout user (optional - mainly for tracking)
 * POST /api/v1/auth/logout
 */
router.post('/logout', (req, res) => {
    // In a JWT-based system, logout is typically handled client-side
    // This endpoint can be used for logging/tracking purposes
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (!err && user) {
                logger.info('User logged out', { userId: user.id, email: user.email });
            }
        });
    }

    res.json({ message: 'Logged out successfully' });
});

/**
 * Get current user
 * GET /api/v1/auth/me
 */
router.get('/me', (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }

        // Get user details from database
        const database = getDb(req);
        database.get('SELECT id, email, name, role, created_at FROM users WHERE id = ?', 
            [decoded.id], (err, user) => {
            if (err) {
                logger.error('Database error fetching user', { error: err.message });
                return res.status(500).json({ error: 'Failed to fetch user' });
            }

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json({ user });
        });
    });
});

module.exports = router;