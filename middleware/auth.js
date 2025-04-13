const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware to verify JWT token
 */
exports.verifyToken = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token, authorization denied' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-jwt-secret');
    
    // Find user
    const user = await User.findOne({ userId: decoded.userId });
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    
    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Account is suspended or inactive' });
    }
    
    // Add user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

/**
 * Middleware to check if user is admin
 */
exports.isAdmin = (req, res, next) => {
  // In a real-world scenario, this would check a specific admin role
  // For this project, we'll consider judiciary users as admins
  if (req.user.role !== 'judiciary') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  
  next();
};

/**
 * Middleware to check user access level
 * @param {string} requiredRole - Minimum role required (public, legal, judiciary)
 */
exports.checkAccess = (requiredRole) => {
  return (req, res, next) => {
    const accessLevels = {
      'public': 1,
      'legal': 2,
      'judiciary': 3
    };
    
    const userAccessLevel = accessLevels[req.user.role] || 1;
    const requiredAccessLevel = accessLevels[requiredRole] || 1;
    
    if (userAccessLevel < requiredAccessLevel) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient access rights' 
      });
    }
    
    next();
  };
};

/**
 * Generate JWT token
 * @param {string} userId - User ID
 * @param {string} role - User role
 * @returns {string} JWT token
 */
exports.generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET || 'default-jwt-secret',
    { expiresIn: '24h' }
  );
};