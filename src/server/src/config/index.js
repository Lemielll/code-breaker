/**
 * Configuration Loader — Code Breaker
 *
 * Memuat environment variables dari .env file dan mengekspos
 * sebagai object terstruktur. Validasi wajib dilakukan saat startup.
 *
 * @module config
 */

const dotenv = require('dotenv');
const path = require('path');

// Load env file berdasarkan NODE_ENV
const envFile = process.env.NODE_ENV === 'production'
  ? '.env.production'
  : process.env.NODE_ENV === 'staging'
    ? '.env.staging'
    : '.env.development';

dotenv.config({ path: path.resolve(__dirname, '../../', envFile) });

// Fallback ke .env jika file spesifik tidak ada
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Memvalidasi bahwa environment variable wajib sudah di-set.
 *
 * @param {string[]} requiredVars - Daftar nama variabel wajib.
 * @throws {Error} Jika ada variabel yang missing.
 */
function validateEnv(requiredVars) {
  const missing = requiredVars.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    throw new Error(
      `[CONFIG] Missing required environment variables: ${missing.join(', ')}`
    );
  }
}

// Validasi variabel kritis saat startup
validateEnv([
  'DATABASE_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
]);

/**
 * Application configuration object.
 * Semua nilai berasal dari environment variables.
 *
 * @type {Object}
 */
const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,

  db: {
    url: process.env.DATABASE_URL,
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '1h',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },

  security: {
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10,
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60000,
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
    loginRateLimitMax: parseInt(process.env.LOGIN_RATE_LIMIT_MAX, 10) || 5,
  },

  daily: {
    secret: process.env.DAILY_CHALLENGE_SECRET || 'default-daily-secret',
  },

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/app.log',
  },

  admin: {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'admin12345',
    nickname: process.env.ADMIN_NICKNAME || 'Administrator',
  },
};

module.exports = config;
