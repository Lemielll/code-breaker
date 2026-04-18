/**
 * Game Input Validators — Code Breaker
 *
 * @module middleware/validators/gameValidator
 */

const { body, param, validationResult } = require('express-validator');
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

/** Validasi start game: mode (required), puzzleId (optional). */
const validateStartGame = [
  body('mode')
    .trim()
    .isIn(['classic', 'daily', 'cipher'])
    .withMessage('Mode must be classic, daily, or cipher'),
  body('puzzleId')
    .optional()
    .isUUID()
    .withMessage('puzzleId must be a valid UUID'),
  handleValidation,
];

/** Validasi guess: 4 hex characters. */
const validateGuess = [
  body('guess')
    .trim()
    .matches(/^[0-9A-Fa-f]{4}$/)
    .withMessage('Guess must be exactly 4 hex characters (0-9, A-F)'),
  handleValidation,
];

module.exports = {
  validateStartGame,
  validateGuess,
  handleValidation,
};
