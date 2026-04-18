/**
 * Admin Input Validators — Code Breaker
 *
 * @module middleware/validators/adminValidator
 */

const { body, validationResult } = require('express-validator');
const { ValidationError } = require('../../errors/AppError');

/** Middleware: process validation results. */
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

/** Validasi create puzzle. */
const validateCreatePuzzle = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be 1-100 characters')
    .escape(),
  body('plaintext')
    .trim()
    .matches(/^[0-9A-Fa-f]{4}$/)
    .withMessage('Plaintext must be exactly 4 hex chars'),
  body('shiftValue')
    .isInt({ min: 0, max: 15 })
    .withMessage('Shift value must be 0-15'),
  body('hint')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Hint max 500 characters'),
  handleValidation,
];

/** Validasi update puzzle. */
const validateUpdatePuzzle = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be 1-100 characters')
    .escape(),
  body('status')
    .optional()
    .isIn(['published', 'archived'])
    .withMessage('Status must be published or archived'),
  body('hint')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Hint max 500 characters'),
  handleValidation,
];

module.exports = {
  validateCreatePuzzle,
  validateUpdatePuzzle,
  handleValidation,
};
