/**
 * Auth Input Validators — Code Breaker
 *
 * express-validator chains untuk register, login, guest, dan profile update.
 * Semua input di-sanitize dan divalidasi sebelum masuk ke controller.
 *
 * @module middleware/validators/authValidator
 */

const { body, validationResult } = require('express-validator');
const { ValidationError } = require('../../errors/AppError');

/**
 * Middleware: proses hasil validasi dan throw ValidationError jika gagal.
 */
const handleValidation = (req, _res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array().map((e) => ({
      field: e.path,
      message: e.msg,
    }));
    return next(new ValidationError(details));
  }
  next();
};

/** Validasi register: username, password, nickname. */
const validateRegister = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 20 }).withMessage('Username must be 3-20 characters')
    .isAlphanumeric().withMessage('Username must be alphanumeric')
    .escape(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('nickname')
    .trim()
    .isLength({ min: 3, max: 16 }).withMessage('Nickname must be 3-16 characters')
    .isAlphanumeric().withMessage('Nickname must be alphanumeric')
    .escape(),
  handleValidation,
];

/** Validasi login: username, password. */
const validateLogin = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .escape(),
  body('password')
    .notEmpty().withMessage('Password is required'),
  handleValidation,
];

/** Validasi guest: nickname. */
const validateGuest = [
  body('nickname')
    .trim()
    .isLength({ min: 3, max: 16 }).withMessage('Nickname must be 3-16 characters')
    .isAlphanumeric().withMessage('Nickname must be alphanumeric')
    .escape(),
  handleValidation,
];

/** Validasi refresh token. */
const validateRefresh = [
  body('refreshToken')
    .notEmpty().withMessage('Refresh token is required'),
  handleValidation,
];

/** Validasi profile update. */
const validateProfileUpdate = [
  body('nickname')
    .optional()
    .trim()
    .isLength({ min: 3, max: 16 }).withMessage('Nickname must be 3-16 characters')
    .isAlphanumeric().withMessage('Nickname must be alphanumeric')
    .escape(),
  body('newPassword')
    .optional()
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('currentPassword')
    .if(body('newPassword').exists())
    .notEmpty().withMessage('Current password required to change password'),
  handleValidation,
];

module.exports = {
  validateRegister,
  validateLogin,
  validateGuest,
  validateRefresh,
  validateProfileUpdate,
  handleValidation,
};
