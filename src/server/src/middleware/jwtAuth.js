/**
 * JWT Authentication Middleware — Code Breaker
 *
 * Memverifikasi Bearer token, extract userId dan role ke req.user.
 * Mendukung optional auth (untuk endpoint yang guest boleh akses).
 *
 * @module middleware/jwtAuth
 */

const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../config/logger');
const { UnauthorizedError } = require('../errors/AppError');

/**
 * Middleware wajib autentikasi. Menolak request tanpa token valid.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @throws {UnauthorizedError} Jika token missing, invalid, atau expired.
 */
const requireAuth = (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid Authorization header');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.accessSecret);

    req.user = {
      id: decoded.userId,
      role: decoded.role,
      username: decoded.username,
    };

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return next(error);
    }
    if (error.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Token has expired'));
    }
    if (error.name === 'JsonWebTokenError') {
      return next(new UnauthorizedError('Invalid token'));
    }
    logger.error('JWT verification failed', { error: error.message, requestId: req.id });
    return next(new UnauthorizedError('Authentication failed'));
  }
};

/**
 * Middleware opsional autentikasi. Jika token ada dan valid, attach user.
 * Jika tidak ada token, lanjutkan tanpa user (guest).
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const optionalAuth = (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Guest access — no user attached
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.accessSecret);

    req.user = {
      id: decoded.userId,
      role: decoded.role,
      username: decoded.username,
    };
  } catch {
    // Token invalid — treat as guest
    req.user = null;
  }
  next();
};

module.exports = { requireAuth, optionalAuth };
