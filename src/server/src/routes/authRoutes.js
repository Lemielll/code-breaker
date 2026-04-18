/**
 * Auth Routes — Code Breaker
 *
 * Route definitions untuk modul autentikasi.
 * Setiap route memiliki middleware chain: [validator] → [auth?] → controller.
 *
 * @module routes/authRoutes
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const config = require('../config');
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/jwtAuth');
const {
  validateRegister,
  validateLogin,
  validateGuest,
  validateRefresh,
  validateProfileUpdate,
} = require('../middleware/validators/authValidator');

const router = express.Router();

/**
 * Login-specific rate limiter: 5 req/min/IP (brute-force protection).
 * Lebih ketat dari global rate limiter.
 */
const loginLimiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: config.security.loginRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many login attempts. Please try again later.',
    },
  },
});

/**
 * POST /api/v1/auth/register
 * Auth: None | Rate: Global | Validator: username, password, nickname
 */
router.post('/register', validateRegister, authController.register);

/**
 * POST /api/v1/auth/login
 * Auth: None | Rate: 5/min/IP | Validator: username, password
 */
router.post('/login', loginLimiter, validateLogin, authController.login);

/**
 * POST /api/v1/auth/refresh
 * Auth: None (uses refresh token in body) | Validator: refreshToken
 */
router.post('/refresh', validateRefresh, authController.refreshToken);

/**
 * POST /api/v1/auth/guest
 * Auth: None | Validator: nickname
 */
router.post('/guest', validateGuest, authController.guestLogin);

/**
 * GET /api/v1/auth/profile
 * Auth: Required (JWT) | RBAC: Any authenticated user
 */
router.get('/profile', requireAuth, authController.getProfile);

/**
 * PATCH /api/v1/auth/profile
 * Auth: Required (JWT) | Validator: nickname, passwords
 */
router.patch('/profile', requireAuth, validateProfileUpdate, authController.updateProfile);

module.exports = router;
