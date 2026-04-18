/**
 * Custom Error Classes — Code Breaker
 *
 * Hierarki error untuk standardisasi respons error.
 * Semua error operasional extends AppError.
 *
 * @module errors
 */

/**
 * Base application error. Semua custom errors wajib extends ini.
 *
 * @param {string} message - Pesan error user-facing.
 * @param {number} statusCode - HTTP status code.
 * @param {string} errorCode - Kode error internal (UPPER_SNAKE).
 */
class AppError extends Error {
  constructor(message, statusCode, errorCode) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  /**
   * @param {Array<{field: string, message: string}>} details - Detail validasi.
   */
  constructor(details = []) {
    super('Validation failed', 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'FORBIDDEN');
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409, 'CONFLICT');
  }
}

class RateLimitError extends AppError {
  constructor(retryAfter = 60) {
    super('Too many requests. Please try again later.', 429, 'RATE_LIMITED');
    this.retryAfter = retryAfter;
  }
}

module.exports = {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  RateLimitError,
};
