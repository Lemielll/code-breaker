/**
 * Profile & Achievement Routes — Code Breaker
 *
 * @module routes/profileRoutes
 */

const express = require('express');
const { requireAuth } = require('../middleware/jwtAuth');
const authController = require('../controllers/authController');
const { validateProfileUpdate } = require('../middleware/validators/authValidator');
const progressionService = require('../services/progressionService');

const router = express.Router();

/**
 * GET /api/v1/profile
 * Full profile with stats, streak, badges.
 */
router.get('/', requireAuth, authController.getProfile);

/**
 * PATCH /api/v1/profile
 * Update nickname/password.
 */
router.patch('/', requireAuth, validateProfileUpdate, authController.updateProfile);

/**
 * GET /api/v1/achievements
 * All badges with unlock status.
 */
router.get('/achievements', requireAuth, async (req, res, next) => {
  try {
    const badges = await progressionService.getAllBadges(req.user.id);
    res.status(200).json({
      success: true,
      data: badges,
      meta: { timestamp: new Date().toISOString(), requestId: req.id },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
