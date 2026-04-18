/**
 * Error Handler Middleware — Code Breaker
 *
 * Global error handler. Menangkap semua error dari controllers/services,
 * log ke structured logger, dan return safe JSON response.
 *
 * @module middleware/errorHandler
 */

const logger = require('../config/logger');
const { AppError } = require('../errors/AppError');

/**
 * Global error handler middleware.
 * Production: tidak mengirim stack trace.
 * Development: stack trace di-include untuk debugging.
 *
 * @param {Error} err - Error object.
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} _next - Next function (unused).
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  // Default ke 500 jika bukan operational error
  const statusCode = err.statusCode || 500;
  const errorCode = err.errorCode || 'INTERNAL_ERROR';
  const isOperational = err.isOperational || false;

  // Log error
  const logPayload = {
    requestId: req.id,
    method: req.method,
    path: req.path,
    statusCode,
    errorCode,
    message: err.message,
    ip: req.ip,
    userId: req.user?.id || null,
  };

  if (isOperational) {
    logger.warn('Operational error', logPayload);
  } else {
    // Unexpected error — log full stack
    logger.error('Unexpected error', { ...logPayload, stack: err.stack });
  }

  // Build response
  const response = {
    success: false,
    error: {
      code: errorCode,
      message: isOperational ? err.message : 'An unexpected error occurred',
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: req.id,
    },
  };

  // Tambah detail validasi jika ada
  if (err instanceof AppError && err.details) {
    response.error.details = err.details;
  }

  // Stack trace hanya di development
  if (process.env.NODE_ENV === 'development' && !isOperational) {
    response.error.stack = err.stack;
  }

  // Retry-After header untuk rate limit
  if (err.retryAfter) {
    res.set('Retry-After', String(err.retryAfter));
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
