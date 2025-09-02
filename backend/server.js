const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Import utilities and middleware
const logger = require('./utils/logger');

// Import routes
const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const apiV1Routes = require('./routes/api/v1');

const app = express();
const PORT = process.env.PORT || 5000;

// ========================================
// SECURITY CONFIGURATION
// ========================================

// Validate critical environment variables
if (!process.env.JWT_SECRET) {
    logger.error('CRITICAL: JWT_SECRET environment variable must be set');
    process.exit(1);
}

// Validate JWT_SECRET strength in production
if (process.env.NODE_ENV === 'production') {
    const JWT_SECRET = process.env.JWT_SECRET;
    if (JWT_SECRET.length < 64) {
        logger.error('CRITICAL: JWT_SECRET must be at least 64 characters in production');
        process.exit(1);
    }
}

// ========================================
// MIDDLEWARE
// ========================================

// Security headers
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

// Compression middleware
app.use(compression());

// CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = process.env.ALLOWED_ORIGINS 
            ? process.env.ALLOWED_ORIGINS.split(',')
            : ['http://localhost:3000', 'http://localhost:5173'];
        
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP request logging
app.use(morgan('combined', { stream: logger.stream }));

// ========================================
// RATE LIMITING
// ========================================

// General rate limiter
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Strict rate limiter for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many authentication attempts from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
});

// Apply rate limiting
app.use('/api/', limiter);
app.use('/api/v1/auth/', authLimiter);

// ========================================
// DATABASE INITIALIZATION
// ========================================

let db;

// Check if DATABASE_URL is provided (production/Render)
if (process.env.DATABASE_URL) {
    // Production: Use PostgreSQL (this will need pg module in the future)
    logger.info('DATABASE_URL detected - PostgreSQL support not yet implemented');
    logger.warn('Falling back to SQLite for now - this will fail in production');
    
    // For now, still use SQLite but warn about the issue
    const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../database/steel_construction.db');
    db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            logger.error('Failed to connect to database', { error: err.message });
            process.exit(1);
        }
        logger.info('Connected to SQLite database (fallback)', { path: dbPath });
    });
} else {
    // Development: Use SQLite
    const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../database/steel_construction.db');
    db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            logger.error('Failed to connect to database', { error: err.message });
            process.exit(1);
        }
        logger.info('Connected to SQLite database', { path: dbPath });
    });
}

// Initialize database schema (SQLite only for now)
if (!process.env.DATABASE_URL) {
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, 'utf8');
        db.exec(schema, (err) => {
            if (err) {
                if (err.message.includes('already exists')) {
                    logger.info('Database tables already exist');
                } else {
                    logger.error('Error initializing database', { error: err.message });
                }
            } else {
                logger.info('Database schema initialized successfully');
            }
        });
    } else {
        logger.warn('Database schema file not found', { path: schemaPath });
    }
}

// Make database available to routes
app.locals.db = db;

// ========================================
// ROUTES
// ========================================

// Health check routes (no authentication required)
app.use('/health', healthRoutes);
app.use('/api/health', healthRoutes);

// Direct auth routes for backward compatibility (used by tests)
app.use('/api/auth', authRoutes);

// Direct projects route for backward compatibility (used by tests)
const { authenticateToken } = require('./middleware/auth');
app.get('/api/projects', authenticateToken, (req, res) => {
    res.json({ message: 'Projects endpoint - use /api/v1/projects for full API' });
});

// API v1 routes
app.use('/api/v1', apiV1Routes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'Steel Construction MVP API',
        version: '1.0.0',
        status: 'running',
        documentation: '/api/v1',
        health: '/health'
    });
});

// ========================================
// ERROR HANDLING
// ========================================

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `The requested endpoint ${req.method} ${req.path} does not exist`,
        statusCode: 404
    });
});

// Global error handler
app.use((err, req, res, next) => {
    // Log error
    logger.error('Unhandled error', {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip
    });

    // Don't leak error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // CORS error
    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({
            error: 'CORS Error',
            message: 'Origin not allowed'
        });
    }

    // Validation error
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation Error',
            message: err.message,
            details: isDevelopment ? err.details : undefined
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            error: 'Authentication Error',
            message: 'Invalid token'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            error: 'Authentication Error',
            message: 'Token expired'
        });
    }

    // Default error response
    res.status(err.statusCode || 500).json({
        error: 'Internal Server Error',
        message: isDevelopment ? err.message : 'An unexpected error occurred',
        statusCode: err.statusCode || 500,
        stack: isDevelopment ? err.stack : undefined
    });
});

// ========================================
// GRACEFUL SHUTDOWN
// ========================================

const gracefulShutdown = (signal) => {
    logger.info(`${signal} received. Starting graceful shutdown...`);
    
    // Stop accepting new connections
    server.close(() => {
        logger.info('HTTP server closed');
        
        // Close database connection
        db.close((err) => {
            if (err) {
                logger.error('Error closing database', { error: err.message });
            } else {
                logger.info('Database connection closed');
            }
            
            // Exit process
            process.exit(0);
        });
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', { reason, promise });
    process.exit(1);
});

// ========================================
// START SERVER
// ========================================

const server = app.listen(PORT, () => {
    logger.info('Server started', {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
        pid: process.pid
    });
    
    // Log all registered routes in development
    if (process.env.NODE_ENV === 'development') {
        logger.info('Server is running on http://localhost:' + PORT);
        logger.info('API documentation available at http://localhost:' + PORT + '/api/v1');
        logger.info('Health check available at http://localhost:' + PORT + '/health');
    }
});

module.exports = app;