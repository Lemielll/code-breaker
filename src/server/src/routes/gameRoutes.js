/**
 * Game Routes — Code Breaker
 *
 * @module routes/gameRoutes
 */

const express = require('express');
const gameController = require('../controllers/gameController');
const { optionalAuth } = require('../middleware/jwtAuth');
const { validateStartGame, validateGuess } = require('../middleware/validators/gameValidator');

const router = express.Router();

/**
 * POST /api/v1/games/start
 * Auth: Optional (JWT or guest) | Validator: mode
 */
router.post('/start', optionalAuth, validateStartGame, gameController.startGame);

/**
 * POST /api/v1/games/:sessionId/guess
 * Auth: Optional | Validator: guess (4 hex chars)
 */
router.post('/:sessionId/guess', optionalAuth, validateGuess, gameController.submitGuess);

/**
 * POST /api/v1/games/:sessionId/hint
 * Auth: Optional | Cipher mode only
 */
router.post('/:sessionId/hint', optionalAuth, gameController.useHint);

/**
 * GET /api/v1/games/puzzles
 * Auth: None (public) | List published cipher puzzles
 */
router.get('/puzzles', async (_req, res, next) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const puzzles = await prisma.cipherPuzzle.findMany({
      where: { status: 'published' },
      select: { id: true, title: true, ciphertext: true, cipherMethod: true, hint: true },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ success: true, data: puzzles });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/games/:sessionId
 * Auth: Optional | Get session state
 */
router.get('/:sessionId', optionalAuth, gameController.getSession);

module.exports = router;
