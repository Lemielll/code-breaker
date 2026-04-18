/**
 * Game Service — Code Breaker
 *
 * Business logic untuk game: start, guess, hint, session retrieval.
 * Semua secret codes disimpan server-side, tidak pernah dikirim ke client.
 *
 * @module services/gameService
 */

const { PrismaClient } = require('@prisma/client');
const config = require('../config');
const logger = require('../config/logger');
const {
  NotFoundError,
  ValidationError,
  ForbiddenError,
} = require('../errors/AppError');
const {
  GAME_MODES,
  generateRandomCode,
  generateDailyCode,
  generateFeedback,
  calculateScore,
} = require('../constants/gameConstants');

const prisma = new PrismaClient();

/**
 * Start a new game session.
 *
 * @param {Object} params - { userId, guestNickname, mode, puzzleId }.
 * @returns {Promise<Object>} Session data (tanpa secretCode).
 * @throws {ValidationError} Mode invalid atau daily sudah dimainkan.
 * @throws {NotFoundError} Puzzle tidak ditemukan (cipher mode).
 */
async function startGame({ userId, guestNickname, mode, puzzleId }) {
  // Validate mode
  const modeConfig = GAME_MODES[mode];
  if (!modeConfig) {
    throw new ValidationError([{ field: 'mode', message: 'Mode must be classic, daily, or cipher' }]);
  }

  let secretCode;
  let dailyChallengeId = null;
  let cipherPuzzleId = null;
  let ciphertext = null;
  let cipherMethod = null;
  let hint = null;

  if (mode === 'classic') {
    secretCode = generateRandomCode();
  } else if (mode === 'daily') {
    // Generate deterministic daily code
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Find or create daily challenge
    let daily = await prisma.dailyChallenge.findUnique({
      where: { challengeDate: today },
    });

    if (!daily) {
      const { code, seed } = generateDailyCode(today, config.daily.secret);
      daily = await prisma.dailyChallenge.create({
        data: { challengeDate: today, secretCode: code, seed },
      });
    }

    // Check if registered user already completed today
    if (userId) {
      const existing = await prisma.gameSession.findFirst({
        where: {
          userId,
          dailyChallengeId: daily.id,
          status: { in: ['won', 'lost'] },
        },
      });
      if (existing) {
        throw new ValidationError([{
          field: 'mode',
          message: 'You have already completed today\'s Daily Challenge',
        }]);
      }
    }

    secretCode = daily.secretCode;
    dailyChallengeId = daily.id;
  } else if (mode === 'cipher') {
    if (!puzzleId) {
      throw new ValidationError([{ field: 'puzzleId', message: 'puzzleId required for cipher mode' }]);
    }

    const puzzle = await prisma.cipherPuzzle.findUnique({ where: { id: puzzleId } });
    if (!puzzle || puzzle.status !== 'published') {
      throw new NotFoundError('Published puzzle');
    }

    secretCode = puzzle.plaintext.toUpperCase();
    cipherPuzzleId = puzzle.id;
    ciphertext = puzzle.ciphertext;
    cipherMethod = puzzle.cipherMethod;
    hint = puzzle.hint;
  }

  // Create game session
  const session = await prisma.gameSession.create({
    data: {
      userId: userId || null,
      guestNickname: guestNickname || null,
      mode,
      secretCode: secretCode.toUpperCase(),
      maxAttempts: modeConfig.maxAttempts,
      cipherPuzzleId,
      dailyChallengeId,
    },
  });

  logger.info('Game started', {
    sessionId: session.id,
    userId: userId || 'guest',
    mode,
    action: 'game.start',
  });

  // Return session data (NEVER include secretCode)
  const response = {
    sessionId: session.id,
    mode: session.mode,
    maxAttempts: session.maxAttempts,
    attemptsUsed: 0,
  };

  // Include cipher-specific data
  if (mode === 'cipher') {
    response.ciphertext = ciphertext;
    response.cipherMethod = cipherMethod;
    response.hint = hint;
  }

  return response;
}

/**
 * Submit a guess for a game session.
 *
 * @param {string} sessionId - Game session ID.
 * @param {string|null} userId - Authenticated user ID (null for guest).
 * @param {string} guess - 4 hex chars.
 * @returns {Promise<Object>} Feedback, status, score.
 * @throws {NotFoundError} Session tidak ditemukan.
 * @throws {ForbiddenError} Bukan pemilik session.
 * @throws {ValidationError} Game sudah selesai.
 */
async function submitGuess(sessionId, userId, guestNickname, guess) {
  const session = await prisma.gameSession.findUnique({
    where: { id: sessionId },
    include: { guesses: { orderBy: { attemptNumber: 'asc' } } },
  });

  if (!session) {
    throw new NotFoundError('Game session');
  }

  // Verify ownership
  if (session.userId && session.userId !== userId) {
    throw new ForbiddenError('Not your game session');
  }

  // Check game still in progress
  if (session.status !== 'in_progress') {
    throw new ValidationError([{ field: 'session', message: 'Game is already completed' }]);
  }

  const guessUpper = guess.toUpperCase();
  const feedback = generateFeedback(guessUpper, session.secretCode);
  const attemptNumber = session.attemptsUsed + 1;
  const isWin = feedback.every((f) => f.status === 'correct');
  const isLastAttempt = attemptNumber >= session.maxAttempts;

  let newStatus = 'in_progress';
  let score = 0;

  if (isWin) {
    newStatus = 'won';
    score = calculateScore(session.maxAttempts, attemptNumber);
  } else if (isLastAttempt) {
    newStatus = 'lost';
  }

  // Transaction: create guess + update session
  await prisma.$transaction(async (tx) => {
    await tx.guess.create({
      data: {
        sessionId,
        attemptNumber,
        guessValue: guessUpper,
        feedbackJson: JSON.stringify(feedback),
      },
    });

    await tx.gameSession.update({
      where: { id: sessionId },
      data: {
        attemptsUsed: attemptNumber,
        status: newStatus,
        score,
        completedAt: newStatus !== 'in_progress' ? new Date() : null,
      },
    });
  });

  logger.info('Guess submitted', {
    sessionId,
    attemptNumber,
    status: newStatus,
    action: 'game.guess',
  });

  const response = {
    attemptNumber,
    attemptsRemaining: session.maxAttempts - attemptNumber,
    feedback,
    status: newStatus,
    score: newStatus === 'won' ? score : null,
    correctCode: newStatus !== 'in_progress' ? session.secretCode : null,
  };

  return { response, session: { ...session, status: newStatus, score }, isWin };
}

/**
 * Get game session state.
 *
 * @param {string} sessionId
 * @param {string|null} userId
 * @returns {Promise<Object>} Session + guesses.
 */
async function getSession(sessionId, userId) {
  const session = await prisma.gameSession.findUnique({
    where: { id: sessionId },
    include: { guesses: { orderBy: { attemptNumber: 'asc' } } },
  });

  if (!session) {
    throw new NotFoundError('Game session');
  }

  if (session.userId && session.userId !== userId) {
    throw new ForbiddenError('Not your game session');
  }

  // Parse feedback JSON
  const guesses = session.guesses.map((g) => ({
    attemptNumber: g.attemptNumber,
    guess: g.guessValue,
    feedback: JSON.parse(g.feedbackJson),
  }));

  return {
    sessionId: session.id,
    mode: session.mode,
    status: session.status,
    maxAttempts: session.maxAttempts,
    attemptsUsed: session.attemptsUsed,
    score: session.score,
    correctCode: session.status !== 'in_progress' ? session.secretCode : null,
    guesses,
  };
}

/**
 * Use hint for cipher mode game.
 *
 * @param {string} sessionId
 * @param {string|null} userId
 * @returns {Promise<Object>} Hint data.
 */
async function useHint(sessionId, userId) {
  const session = await prisma.gameSession.findUnique({
    where: { id: sessionId },
    include: { cipherPuzzle: true },
  });

  if (!session) throw new NotFoundError('Game session');
  if (session.userId && session.userId !== userId) throw new ForbiddenError('Not your game session');
  if (session.mode !== 'cipher') throw new ValidationError([{ field: 'mode', message: 'Hints only available for Cipher mode' }]);
  if (session.status !== 'in_progress') throw new ValidationError([{ field: 'session', message: 'Game is already completed' }]);

  await prisma.gameSession.update({
    where: { id: sessionId },
    data: { hintsUsed: session.hintsUsed + 1 },
  });

  return {
    hint: session.cipherPuzzle?.hint || 'No hint available',
    hintsUsed: session.hintsUsed + 1,
    scorePenalty: '50%',
  };
}

module.exports = {
  startGame,
  submitGuess,
  getSession,
  useHint,
};
