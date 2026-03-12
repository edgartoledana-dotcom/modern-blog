/**
 * JWT Utility Functions
 * Token generation and verification helpers
 */

const jwt = require('jsonwebtoken');

// JWT configuration
const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
};

/**
 * Generate JWT access token
 * @param {Object} payload - Data to encode in token
 * @returns {String} JWT token
 */
const generateToken = (payload) => {
  return jwt.sign(
    {
      id: payload.id || payload._id,
      email: payload.email,
      role: payload.role,
      name: payload.name
    },
    JWT_CONFIG.secret,
    {
      expiresIn: JWT_CONFIG.expiresIn,
      issuer: 'modern-blog-api',
      audience: 'modern-blog-client'
    }
  );
};

/**
 * Generate refresh token
 * @param {Object} payload - Data to encode in token
 * @returns {String} Refresh JWT token
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(
    {
      id: payload.id || payload._id,
      type: 'refresh'
    },
    JWT_CONFIG.secret,
    {
      expiresIn: JWT_CONFIG.refreshExpiresIn,
      issuer: 'modern-blog-api',
      audience: 'modern-blog-client'
    }
  );
};

/**
 * Verify JWT token
 * @param {String} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, JWT_CONFIG.secret);
};

/**
 * Decode token without verification
 * @param {String} token - JWT token to decode
 * @returns {Object} Decoded token payload
 */
const decodeToken = (token) => {
  return jwt.decode(token);
};

/**
 * Get token expiration date
 * @param {String} token - JWT token
 * @returns {Date|null} Expiration date
 */
const getTokenExpiration = (token) => {
  const decoded = jwt.decode(token);
  if (decoded && decoded.exp) {
    return new Date(decoded.exp * 1000);
  }
  return null;
};

/**
 * Check if token is expired
 * @param {String} token - JWT token
 * @returns {Boolean} True if expired
 */
const isTokenExpired = (token) => {
  const expiration = getTokenExpiration(token);
  if (!expiration) return true;
  return expiration < new Date();
};

/**
 * Generate token pair (access + refresh)
 * @param {Object} user - User object
 * @returns {Object} Object containing accessToken and refreshToken
 */
const generateTokenPair = (user) => {
  return {
    accessToken: generateToken(user),
    refreshToken: generateRefreshToken(user),
    expiresIn: JWT_CONFIG.expiresIn
  };
};

module.exports = {
  JWT_CONFIG,
  generateToken,
  generateRefreshToken,
  verifyToken,
  decodeToken,
  getTokenExpiration,
  isTokenExpired,
  generateTokenPair
};
