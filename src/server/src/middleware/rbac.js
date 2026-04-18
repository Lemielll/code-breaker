/**
 * RBAC Middleware — Code Breaker
 *
 * Role-Based Access Control. Memeriksa req.user.role terhadap
 * daftar role yang diizinkan.
 *
 * @module middleware/rbac
 */

const { ForbiddenError } = require('../errors/AppError');
const logger = require('../config/logger');

/**
 * Factory function untuk RBAC middleware.
 * Harus dipasang SETELAH jwtAuth middleware.
 *
 * @param {...string} allowedRoles - Role yang diizinkan (e.g., 'admin', 'player').
 * @returns {import('express').RequestHandler} Middleware function.
 * @throws {ForbiddenError} Jika role user tidak termasuk allowedRoles.
 *
 * @example
 * router.get('/admin/dashboard', requireAuth, requireRole('admin'), controller);
 */
const requireRole = (...allowedRoles) => (req, _res, next) => {
  if (!req.user) {
    return next(new ForbiddenError('Authentication required before authorization'));
  }

  if (!allowedRoles.includes(req.user.role)) {
    logger.warn('RBAC access denied', {
      requestId: req.id,
      userId: req.user.id,
      userRole: req.user.role,
      requiredRoles: allowedRoles,
      path: req.path,
    });
    return next(new ForbiddenError('Insufficient permissions'));
  }

  next();
};

module.exports = { requireRole };
