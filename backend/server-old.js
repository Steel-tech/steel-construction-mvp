const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { body, param, validationResult } = require('express-validator');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// SECURITY: Enforce JWT_SECRET exists and is secure in production
if (!process.env.JWT_SECRET) {
    console.error('CRITICAL: JWT_SECRET environment variable must be set');
    process.exit(1);
}

// SECURITY: Validate JWT_SECRET strength in production
const JWT_SECRET = process.env.JWT_SECRET;
if (process.env.NODE_ENV === 'production') {
    if (JWT_SECRET.length < 64) {
        console.error('CRITICAL: JWT_SECRET must be at least 64 characters in production');
        process.exit(1);
    }
    if (!/^[a-fA-F0-9]{64}$/.test(JWT_SECRET)) {
        console.error('CRITICAL: JWT_SECRET should be a secure 64-character hexadecimal string in production');
        console.error('Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
        process.exit(1);
    }
}

// SECURITY: Security headers
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

// SECURITY: Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 login attempts per windowMs
    message: 'Too many login attempts from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);

// SECURITY: CORS with specific origins
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://your-frontend-domain.com'] // Replace with actual domain
        : ['http://localhost:3000', 'http://localhost:5173'], // Development origins
    credentials: true,
};
app.use(cors(corsOptions));

// SECURITY: Request size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// SECURITY: Input validation helper
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

// Database initialization
const db = new sqlite3.Database(path.join(__dirname, '../database/steel_construction.db'));

// Initialize database tables
const fs = require('fs');
const schemaPath = path.join(__dirname, '../database/schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

db.exec(schema, (err) => {
    if (err) {
        // Allow the server to continue if indexes already exist
        if (err.message.includes('already exists')) {
            console.log('Database tables and indexes already exist - continuing...');
        } else {
            console.error('Error initializing database:', err);
        }
    } else {
        console.log('Database initialized successfully');
    }
});

// SECURITY: Enhanced auth middleware with proper error handling
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

// Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Steel Construction MVP API is running' });
});

// SECURITY: Enhanced registration with comprehensive validation
app.post('/api/auth/register', [
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
        .withMessage('Name must be 2-100 characters, letters and spaces only'),
    body('role')
        .optional()
        .isIn(['admin', 'project_manager', 'client'])
        .withMessage('Invalid role'),
    handleValidationErrors
], async (req, res) => {
    const { email, password, name, role = 'client' } = req.body;

    try {
        // SECURITY: Hash password with high cost factor
        const hashedPassword = await bcrypt.hash(password, 12);

        // SECURITY: Parameterized query (already secure)
        const query = 'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)';
        db.run(query, [email, hashedPassword, name, role], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    return res.status(400).json({ error: 'Email already exists' });
                }
                // SECURITY: Don't expose internal database errors
                console.error('Database error during registration:', err);
                return res.status(500).json({ error: 'Registration failed' });
            }

            // SECURITY: JWT with expiration
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
        // SECURITY: Don't expose internal errors
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/api/auth/login', [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email is required'),
    body('password')
        .isLength({ min: 1, max: 128 })
        .withMessage('Password is required'),
    handleValidationErrors
], async (req, res) => {
    const { email, password } = req.body;

    try {

        // SECURITY: Parameterized query (already secure)
        const query = 'SELECT * FROM users WHERE email = ?';
        db.get(query, [email], async (err, user) => {
            if (err) {
                console.error('Database error during login:', err);
                return res.status(500).json({ error: 'Login failed' });
            }

            if (!user) {
                // SECURITY: Generic message to prevent user enumeration
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // SECURITY: Constant-time password comparison
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // SECURITY: JWT with expiration
            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role }, 
                JWT_SECRET,
                { expiresIn: '24h' }
            );
            res.json({ 
                message: 'Login successful',
                token,
                user: { id: user.id, email: user.email, name: user.name, role: user.role }
            });
        });
    } catch (error) {
        // SECURITY: Don't expose internal errors
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Project routes
app.get('/api/projects', authenticateToken, (req, res) => {
    let query = 'SELECT * FROM projects';
    let params = [];

    // Filter based on user role
    if (req.user.role === 'client') {
        query += ' WHERE client_id = ?';
        params.push(req.user.id);
    } else if (req.user.role === 'project_manager') {
        query += ' WHERE project_manager_id = ?';
        params.push(req.user.id);
    }

    db.all(query, params, (err, projects) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(projects);
    });
});

app.post('/api/projects', [
    authenticateToken,
    body('name')
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Project name is required (max 200 chars)'),
    body('description')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Description too long (max 1000 chars)'),
    body('client_id')
        .isInt({ min: 1 })
        .withMessage('Valid client ID required'),
    body('project_manager_id')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Valid project manager ID required'),
    body('status')
        .optional()
        .isIn(['planning', 'in_progress', 'completed', 'on_hold'])
        .withMessage('Invalid status'),
    body('budget')
        .optional()
        .isNumeric()
        .withMessage('Budget must be numeric'),
    handleValidationErrors
], (req, res) => {
    const { name, description, client_id, project_manager_id, status, start_date, end_date, budget } = req.body;

    // SECURITY: Role-based access control
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

// Materials routes
app.get('/api/materials', authenticateToken, (req, res) => {
    db.all('SELECT * FROM materials', (err, materials) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(materials);
    });
});

app.post('/api/materials', [
    authenticateToken,
    body('name')
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Material name is required (max 200 chars)'),
    body('type')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Material type is required (max 100 chars)'),
    body('unit')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Unit is required (max 50 chars)'),
    body('unit_price')
        .isNumeric()
        .withMessage('Unit price must be numeric'),
    body('supplier')
        .optional()
        .isLength({ max: 200 })
        .withMessage('Supplier name too long (max 200 chars)'),
    body('specifications')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Specifications too long (max 1000 chars)'),
    handleValidationErrors
], (req, res) => {
    const { name, type, unit, unit_price, supplier, specifications } = req.body;

    // SECURITY: Role-based access control
    if (req.user.role === 'client') {
        return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const query = `INSERT INTO materials (name, type, unit, unit_price, supplier, specifications) 
                   VALUES (?, ?, ?, ?, ?, ?)`;
    
    db.run(query, [name, type, unit, unit_price, supplier, specifications], function(err) {
        if (err) {
            console.error('Database error adding material:', err);
            return res.status(500).json({ error: 'Failed to add material' });
        }
        res.status(201).json({ id: this.lastID, message: 'Material added successfully' });
    });
});

// SECURITY: Progress updates with parameter validation
app.get('/api/projects/:projectId/progress', [
    authenticateToken,
    param('projectId')
        .isInt({ min: 1 })
        .withMessage('Valid project ID required'),
    handleValidationErrors
], (req, res) => {
    const { projectId } = req.params;
    
    db.all('SELECT * FROM progress_updates WHERE project_id = ? ORDER BY created_at DESC', 
           [projectId], (err, updates) => {
        if (err) {
            console.error('Database error fetching progress:', err);
            return res.status(500).json({ error: 'Failed to fetch progress updates' });
        }
        res.json(updates);
    });
});

app.post('/api/projects/:projectId/progress', [
    authenticateToken,
    param('projectId')
        .isInt({ min: 1 })
        .withMessage('Valid project ID required'),
    body('title')
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Title is required (max 200 chars)'),
    body('description')
        .optional()
        .isLength({ max: 2000 })
        .withMessage('Description too long (max 2000 chars)'),
    body('percentage_complete')
        .isInt({ min: 0, max: 100 })
        .withMessage('Percentage must be 0-100'),
    body('photos')
        .optional()
        .isArray({ max: 10 })
        .withMessage('Photos must be array (max 10 items)'),
    handleValidationErrors
], (req, res) => {
    const { projectId } = req.params;
    const { title, description, percentage_complete, photos } = req.body;

    const query = `INSERT INTO progress_updates (project_id, title, description, percentage_complete, photos, created_by) 
                   VALUES (?, ?, ?, ?, ?, ?)`;
    
    db.run(query, [projectId, title, description, percentage_complete, JSON.stringify(photos || []), req.user.id], 
           function(err) {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.status(201).json({ id: this.lastID, message: 'Progress update added successfully' });
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;