/**
 * Leaderboard Routes — Code Breaker
 *
 * @module routes/leaderboardRoutes
 */

const express = require('express');
const leaderboardController = require('../controllers/leaderboardController');
const { optionalAuth } = require('../middleware/jwtAuth');

const router = express.Router();

/**
 * GET /api/v1/leaderboard/:mode
 * Auth: Optional (for ownRank) | RBAC: Public
 */
router.get('/:mode', optionalAuth, leaderboardController.getLeaderboard);

module.exports = router;
