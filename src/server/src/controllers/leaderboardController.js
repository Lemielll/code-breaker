/**
 * Leaderboard Controller — Code Breaker
 *
 * @module controllers/leaderboardController
 */

const leaderboardService = require('../services/leaderboardService');

/**
 * GET /api/v1/leaderboard/:mode
 */
const getLeaderboard = async (req, res, next) => {
  try {
    const { mode } = req.params;
    const limit = parseInt(req.query.limit, 10) || 50;
    const userId = req.user?.id || null;

    const entries = await leaderboardService.getLeaderboard(mode, limit);
    const ownRank = await leaderboardService.getOwnRank(userId, mode);

    res.status(200).json({
      success: true,
      data: {
        mode,
        entries,
        ownRank,
        total: entries.length,
      },
      meta: { timestamp: new Date().toISOString(), requestId: req.id },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getLeaderboard };
