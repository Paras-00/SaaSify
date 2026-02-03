import User from '../models/User.js';
import { errorResponse } from '../utils/response.js';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

// Token blacklist (in production, use Redis)
let isTokenBlacklisted;
try {
  const authController = await import('../modules/auth/auth.controller.js');
  isTokenBlacklisted = authController.isTokenBlacklisted;
} catch (error) {
  // Fallback if auth controller not loaded yet
  isTokenBlacklisted = () => false;
}

/**
 * Authenticate JWT token from cookies or Authorization header
 */
export const authenticateToken = async (req, res, next) => {
  try {
    // Get token from cookie or Authorization header
    const token = req.cookies?.accessToken || 
                  req.headers.authorization?.split(' ')[1];

    if (!token) {
      return errorResponse(res, 'Access token required', 401);
    }

    // Check if token is blacklisted
    if (isTokenBlacklisted && isTokenBlacklisted(token)) {
      return errorResponse(res, 'Token has been revoked', 401);
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-passwordHash');
    
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return errorResponse(res, 'Please verify your email to access this resource', 403);
    }

    // Attach user to request
    req.user = {
      userId: user._id,
      email: user.email,
      role: user.role,
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 'Token expired', 401);
    }
    
    logger.error('Authentication error:', error);
    return errorResponse(res, 'Invalid token', 401);
  }
};

/**
 * Require specific roles
 */
export const requireRole = (...roles) => {
  return async (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required', 401);
    }

    if (!roles.includes(req.user.role)) {
      return errorResponse(res, 'Insufficient permissions', 403);
    }

    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken || 
                  req.headers.authorization?.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-passwordHash');
      
      if (user && user.status === 'active') {
        req.user = {
          userId: user._id,
          email: user.email,
          role: user.role,
        };
      }
    }
  } catch (error) {
    // Silently fail for optional auth
  }
  
  next();
};
