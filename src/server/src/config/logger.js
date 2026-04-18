/**
 * Structured Logger — Code Breaker
 *
 * Winston-based JSON logger dengan level: error, warn, info, audit, debug.
 * Log di-output ke console (development) dan file (production).
 *
 * @module logger
 */

const winston = require('winston');
const path = require('path');
const config = require('./index');

/**
 * Custom log level: menambahkan 'audit' untuk admin action tracking.
 */
const customLevels = {
  levels: { error: 0, warn: 1, audit: 2, info: 3, debug: 4 },
  colors: { error: 'red', warn: 'yellow', audit: 'magenta', info: 'green', debug: 'cyan' },
};

winston.addColors(customLevels.colors);

/**
 * Filter sensitif: hapus field password/token dari log.
 *
 * @param {Object} info - Log info object.
 * @returns {Object} Sanitized log info.
 */
const sanitizeFilter = winston.format((info) => {
  if (info.password) { info.password = '[REDACTED]'; }
  if (info.token) { info.token = '[REDACTED]'; }
  if (info.accessToken) { info.accessToken = '[REDACTED]'; }
  if (info.refreshToken) { info.refreshToken = '[REDACTED]'; }
  return info;
});

/**
 * Transport: Console (selalu aktif).
 */
const consoleTransport = new winston.transports.Console({
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
      return `${timestamp} [${level}]: ${message}${metaStr}`;
    })
  ),
});

/**
 * Transport: File (production/staging).
 */
const transports = [consoleTransport];

if (config.env !== 'development') {
  transports.push(
    new winston.transports.File({
      filename: path.resolve(config.logging.file),
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 5,
      format: winston.format.json(),
    }),
    new winston.transports.File({
      filename: path.resolve(path.dirname(config.logging.file), 'error.log'),
      level: 'error',
      maxsize: 5 * 1024 * 1024,
      maxFiles: 3,
      format: winston.format.json(),
    })
  );
}

/**
 * Logger instance.
 * Usage: logger.info('msg', {meta}), logger.audit('msg', {meta})
 */
const logger = winston.createLogger({
  levels: customLevels.levels,
  level: config.logging.level,
  format: winston.format.combine(
    sanitizeFilter(),
    winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'code-breaker' },
  transports,
  exitOnError: false,
});

module.exports = logger;
