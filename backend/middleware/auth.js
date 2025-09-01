const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Middleware to authenticate JWT tokens
 */
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
        logger.error('Authentication error', { error: error.message });
        return res.status(500).json({ error: 'Authentication error' });
    }
};

/**
 * Middleware to check user roles
 */
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!roles.includes(req.user.role)) {
            logger.warn('Access denied - insufficient role', { 
                userId: req.user.id, 
                userRole: req.user.role, 
                requiredRoles: roles 
            });
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        next();
    };
};

/**
 * Middleware to check if user owns the resource or is admin
 */
const requireOwnershipOrAdmin = (getResourceOwnerId) => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // Admins can access everything
        if (req.user.role === 'admin') {
            return next();
        }

        try {
            const ownerId = await getResourceOwnerId(req);
            if (ownerId === req.user.id) {
                return next();
            }

            logger.warn('Access denied - not owner', { 
                userId: req.user.id, 
                resourceOwnerId: ownerId 
            });
            return res.status(403).json({ error: 'Access denied' });
        } catch (error) {
            logger.error('Error checking ownership', { error: error.message });
            return res.status(500).json({ error: 'Authorization check failed' });
        }
    };
};

module.exports = {
    authenticateToken,
    requireRole,
    requireOwnershipOrAdmin
};