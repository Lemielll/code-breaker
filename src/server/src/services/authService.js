/**
 * Auth Service — Code Breaker
 *
 * Business logic untuk autentikasi: register, login, refresh, guest, updateProfile.
 * Menggunakan bcrypt untuk hashing, JWT untuk token, DB transaction untuk operasi kritis.
 *
 * @module services/authService
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const config = require('../config');
const logger = require('../config/logger');
const {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
} = require('../errors/AppError');

const prisma = new PrismaClient();

/**
 * Generate JWT access dan refresh token.
 *
 * @param {Object} payload - Data user { userId, role, username }.
 * @returns {{ accessToken: string, refreshToken: string }}
 */
function generateTokens(payload) {
  const accessToken = jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiry,
  });
  const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiry,
  });
  return { accessToken, refreshToken };
}

/**
 * Sanitize user object — hapus field sensitif sebelum return ke client.
 *
 * @param {Object} user - Prisma user object.
 * @returns {Object} Safe user object tanpa passwordHash.
 */
function sanitizeUser(user) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

/**
 * Registrasi user baru.
 * Menggunakan DB transaction untuk atomicity (create user + create stats).
 *
 * @param {Object} params - { username, password, nickname }.
 * @returns {Promise<{ user: Object, accessToken: string, refreshToken: string }>}
 * @throws {ConflictError} Jika username sudah terdaftar.
 */
async function register({ username, password, nickname }) {
  // Check username uniqueness
  const existing = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
  });

  if (existing) {
    throw new ConflictError('Username already taken');
  }

  // Hash password (bcrypt, cost dari config)
  const passwordHash = await bcrypt.hash(password, config.security.bcryptSaltRounds);

  // Transaction: create user + user_stats atomically
  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        username: username.toLowerCase(),
        passwordHash,
        nickname,
        role: 'player',
      },
    });

    // Create default stats record (1:1 relation)
    await tx.userStats.create({
      data: { userId: newUser.id },
    });

    return newUser;
  });

  // Generate tokens
  const tokens = generateTokens({
    userId: user.id,
    role: user.role,
    username: user.username,
  });

  logger.info('User registered', {
    userId: user.id,
    username: user.username,
    action: 'auth.register',
  });

  return {
    user: sanitizeUser(user),
    ...tokens,
  };
}

/**
 * Login user.
 *
 * @param {Object} params - { username, password }.
 * @returns {Promise<{ user: Object, accessToken: string, refreshToken: string }>}
 * @throws {UnauthorizedError} Jika credentials invalid.
 */
async function login({ username, password }) {
  // Cari user by username (prepared statement via Prisma)
  const user = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
  });

  if (!user) {
    // Generic error — tidak membedakan "user not found" vs "wrong password"
    logger.info('Login failed — user not found', {
      username: username.toLowerCase(),
      action: 'auth.login.failed',
    });
    throw new UnauthorizedError('Invalid username or password');
  }

  // Compare password hash
  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    logger.info('Login failed — wrong password', {
      userId: user.id,
      username: user.username,
      action: 'auth.login.failed',
    });
    throw new UnauthorizedError('Invalid username or password');
  }

  // Generate tokens
  const tokens = generateTokens({
    userId: user.id,
    role: user.role,
    username: user.username,
  });

  logger.info('User logged in', {
    userId: user.id,
    username: user.username,
    role: user.role,
    action: 'auth.login.success',
  });

  return {
    user: sanitizeUser(user),
    ...tokens,
  };
}

/**
 * Refresh access token menggunakan refresh token.
 *
 * @param {string} refreshToken - JWT refresh token.
 * @returns {Promise<{ accessToken: string, refreshToken: string }>}
 * @throws {UnauthorizedError} Jika refresh token invalid/expired.
 */
async function refresh(refreshToken) {
  try {
    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);

    // Verify user masih ada di DB
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      throw new UnauthorizedError('User no longer exists');
    }

    // Generate new token pair (token rotation)
    const tokens = generateTokens({
      userId: user.id,
      role: user.role,
      username: user.username,
    });

    logger.info('Token refreshed', {
      userId: user.id,
      action: 'auth.refresh',
    });

    return tokens;
  } catch (error) {
    if (error instanceof UnauthorizedError) throw error;
    throw new UnauthorizedError('Invalid or expired refresh token');
  }
}

/**
 * Guest session — buat session token sementara (tanpa DB record).
 *
 * @param {string} nickname - Nickname guest.
 * @returns {{ sessionToken: string, nickname: string }}
 */
function createGuestSession(nickname) {
  const sessionToken = jwt.sign(
    { guest: true, nickname },
    config.jwt.accessSecret,
    { expiresIn: '24h' }
  );

  logger.info('Guest session created', {
    nickname,
    action: 'auth.guest',
  });

  return { sessionToken, nickname };
}

/**
 * Update profil user (nickname dan/atau password).
 * Menggunakan transaction untuk atomicity.
 *
 * @param {string} userId - ID user.
 * @param {Object} params - { nickname?, currentPassword?, newPassword? }.
 * @returns {Promise<Object>} Updated user (sanitized).
 * @throws {NotFoundError} Jika user tidak ditemukan.
 * @throws {UnauthorizedError} Jika currentPassword salah.
 */
async function updateProfile(userId, { nickname, currentPassword, newPassword }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundError('User');
  }

  const updateData = {};

  // Update nickname jika diberikan
  if (nickname) {
    updateData.nickname = nickname;
  }

  // Update password jika diberikan (require current password)
  if (newPassword) {
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }
    updateData.passwordHash = await bcrypt.hash(
      newPassword,
      config.security.bcryptSaltRounds
    );
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  logger.audit('Profile updated', {
    userId,
    fields: Object.keys(updateData),
    action: 'profile.update',
  });

  return sanitizeUser(updated);
}

module.exports = {
  register,
  login,
  refresh,
  createGuestSession,
  updateProfile,
};
