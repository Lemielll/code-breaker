/**
 * Auth Controller — Code Breaker
 *
 * Thin controller: menerima request, panggil service, format response.
 * Semua business logic ada di authService.
 *
 * @module controllers/authController
 */

const authService = require('../services/authService');

/**
 * POST /api/v1/auth/register
 * Registrasi user baru.
 *
 * @param {import('express').Request} req - Body: { username, password, nickname }
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const register = async (req, res, next) => {
  try {
    const { username, password, nickname } = req.body;
    const result = await authService.register({ username, password, nickname });

    res.status(201).json({
      success: true,
      data: result,
      meta: { timestamp: new Date().toISOString(), requestId: req.id },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/login
 * Login user.
 *
 * @param {import('express').Request} req - Body: { username, password }
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const result = await authService.login({ username, password });

    res.status(200).json({
      success: true,
      data: result,
      meta: { timestamp: new Date().toISOString(), requestId: req.id },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/refresh
 * Refresh JWT tokens.
 *
 * @param {import('express').Request} req - Body: { refreshToken }
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    const result = await authService.refresh(token);

    res.status(200).json({
      success: true,
      data: result,
      meta: { timestamp: new Date().toISOString(), requestId: req.id },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/guest
 * Buat guest session.
 *
 * @param {import('express').Request} req - Body: { nickname }
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const guestLogin = async (req, res, next) => {
  try {
    const { nickname } = req.body;
    const result = authService.createGuestSession(nickname);

    res.status(200).json({
      success: true,
      data: result,
      meta: { timestamp: new Date().toISOString(), requestId: req.id },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/profile
 * Ambil profil user yang sedang login.
 *
 * @param {import('express').Request} req - req.user dari JWT middleware
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const getProfile = async (req, res, next) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        stats: true,
        achievements: true,
      },
    });

    if (!user) {
      const { NotFoundError } = require('../errors/AppError');
      throw new NotFoundError('User');
    }

    // Remove passwordHash
    const { passwordHash, ...safeUser } = user;

    res.status(200).json({
      success: true,
      data: safeUser,
      meta: { timestamp: new Date().toISOString(), requestId: req.id },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/profile
 * Update profil user.
 *
 * @param {import('express').Request} req - Body: { nickname?, currentPassword?, newPassword? }
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const updateProfile = async (req, res, next) => {
  try {
    const { nickname, currentPassword, newPassword } = req.body;
    const result = await authService.updateProfile(req.user.id, {
      nickname,
      currentPassword,
      newPassword,
    });

    res.status(200).json({
      success: true,
      data: { user: result },
      meta: { timestamp: new Date().toISOString(), requestId: req.id },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  guestLogin,
  getProfile,
  updateProfile,
};
