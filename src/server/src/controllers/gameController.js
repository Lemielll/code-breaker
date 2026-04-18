/**
 * Game Controller — Code Breaker
 *
 * Thin controller untuk game actions: start, guess, hint, getSession.
 *
 * @module controllers/gameController
 */

const gameService = require('../services/gameService');
const progressionService = require('../services/progressionService');

/**
 * POST /api/v1/games/start
 */
const startGame = async (req, res, next) => {
  try {
    const { mode, puzzleId } = req.body;
    const userId = req.user?.id || null;
    const guestNickname = req.user?.guest ? req.user.nickname : null;

    const result = await gameService.startGame({ userId, guestNickname, mode, puzzleId });

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
 * POST /api/v1/games/:sessionId/guess
 */
const submitGuess = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { guess } = req.body;
    const userId = req.user?.id || null;
    const guestNickname = req.user?.guest ? req.user.nickname : null;

    const { response, session, isWin } = await gameService.submitGuess(
      sessionId, userId, guestNickname, guess
    );

    // Process progression if game ended and user is registered
    if (session.status !== 'in_progress' && userId) {
      const progression = await progressionService.processGameEnd(userId, {
        mode: session.mode,
        score: session.score,
        attemptsUsed: session.attemptsUsed,
        status: session.status,
      });
      if (progression) {
        response.progression = progression;
      }
    }

    res.status(200).json({
      success: true,
      data: response,
      meta: { timestamp: new Date().toISOString(), requestId: req.id },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/games/:sessionId
 */
const getSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id || null;

    const result = await gameService.getSession(sessionId, userId);

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
 * POST /api/v1/games/:sessionId/hint
 */
const useHint = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id || null;

    const result = await gameService.useHint(sessionId, userId);

    res.status(200).json({
      success: true,
      data: result,
      meta: { timestamp: new Date().toISOString(), requestId: req.id },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { startGame, submitGuess, getSession, useHint };
