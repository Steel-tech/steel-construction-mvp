import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw error;
  }
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// Middleware wrapper for serverless functions
export function withAuth(handler) {
  return async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({ error: 'Access token required' });
      }

      const user = verifyToken(token);
      req.user = user;
      
      return handler(req, res);
    } catch (error) {
      if (error.message === 'Token expired') {
        return res.status(401).json({ error: 'Token expired' });
      }
      if (error.message === 'Invalid token') {
        return res.status(401).json({ error: 'Invalid token' });
      }
      return res.status(403).json({ error: 'Authentication failed' });
    }
  };
}

// Role-based access control
export function withRole(...roles) {
  return (handler) => {
    return withAuth(async (req, res) => {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      return handler(req, res);
    });
  };
}