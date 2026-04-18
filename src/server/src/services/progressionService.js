/**
 * Progression Service — Code Breaker
 *
 * XP, level, streak, dan badge/achievement logic.
 * Dipanggil setelah game selesai (won).
 *
 * @module services/progressionService
 */

const { PrismaClient } = require('@prisma/client');
const logger = require('../config/logger');
const { GAME_MODES, BADGES, calculateLevel } = require('../constants/gameConstants');

const prisma = new PrismaClient();

/**
 * Process progression setelah game selesai.
 * Updates: XP, level, stats, streak, badges.
 *
 * @param {string} userId - User ID (null for guest = skip).
 * @param {Object} gameResult - { mode, score, attemptsUsed, status }.
 * @returns {Promise<Object|null>} Progression data or null for guest.
 */
async function processGameEnd(userId, gameResult) {
  if (!userId) return null; // Guest — no progression

  const { mode, score, attemptsUsed, status } = gameResult;
  const isWin = status === 'won';
  const modeConfig = GAME_MODES[mode];
  const xpEarned = isWin ? Math.floor(score * modeConfig.xpMultiplier) : 0;

  // Get current user data
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { stats: true, achievements: true },
  });

  if (!user) return null;

  const today = new Date().toISOString().split('T')[0];
  const previousLevel = user.level;

  // Calculate new streak
  let newStreak = user.currentStreak;
  let newLongestStreak = user.longestStreak;

  if (user.lastPlayedDate !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (user.lastPlayedDate === yesterdayStr) {
      newStreak = user.currentStreak + 1;
    } else {
      newStreak = 1; // Reset streak
    }
    newLongestStreak = Math.max(newLongestStreak, newStreak);
  }

  // Calculate new XP and level
  const newTotalXp = user.totalXp + xpEarned;
  const newLevel = calculateLevel(newTotalXp);
  const leveledUp = newLevel > previousLevel;

  // Update user
  await prisma.user.update({
    where: { id: userId },
    data: {
      totalXp: newTotalXp,
      level: newLevel,
      currentStreak: newStreak,
      longestStreak: newLongestStreak,
      lastPlayedDate: today,
    },
  });

  // Update stats
  const statsUpdate = buildStatsUpdate(mode, score, isWin, user.stats);
  if (user.stats) {
    await prisma.userStats.update({
      where: { userId },
      data: statsUpdate,
    });
  }

  // Check achievements
  const newBadges = await checkAndUnlockBadges(userId, {
    ...user,
    totalXp: newTotalXp,
    level: newLevel,
    longestStreak: newLongestStreak,
    stats: { ...user.stats, ...statsUpdate },
    attemptsUsed,
  });

  logger.info('Progression processed', {
    userId,
    xpEarned,
    newLevel,
    leveledUp,
    newBadges: newBadges.length,
    action: 'progression.process',
  });

  return {
    xpEarned,
    totalXp: newTotalXp,
    level: newLevel,
    leveledUp,
    streakCount: newStreak,
    newBadges,
  };
}

/**
 * Build stats update object berdasarkan mode dan hasil game.
 *
 * @param {string} mode - Game mode.
 * @param {number} score - Score achieved.
 * @param {boolean} isWin - Whether the game was won.
 * @param {Object|null} currentStats - Current user stats.
 * @returns {Object} Update data for UserStats.
 */
function buildStatsUpdate(mode, score, isWin, currentStats) {
  const update = {
    totalGamesPlayed: (currentStats?.totalGamesPlayed || 0) + 1,
    totalGamesWon: (currentStats?.totalGamesWon || 0) + (isWin ? 1 : 0),
  };

  if (mode === 'classic') {
    update.classicGamesPlayed = (currentStats?.classicGamesPlayed || 0) + 1;
    if (isWin) {
      update.classicGamesWon = (currentStats?.classicGamesWon || 0) + 1;
      update.classicBestScore = Math.max(currentStats?.classicBestScore || 0, score);
    }
  } else if (mode === 'daily') {
    update.dailyGamesPlayed = (currentStats?.dailyGamesPlayed || 0) + 1;
    if (isWin) {
      update.dailyGamesWon = (currentStats?.dailyGamesWon || 0) + 1;
      update.dailyBestScore = Math.max(currentStats?.dailyBestScore || 0, score);
    }
  } else if (mode === 'cipher') {
    update.cipherGamesPlayed = (currentStats?.cipherGamesPlayed || 0) + 1;
    if (isWin) {
      update.cipherGamesWon = (currentStats?.cipherGamesWon || 0) + 1;
      update.cipherBestScore = Math.max(currentStats?.cipherBestScore || 0, score);
    }
  }

  return update;
}

/**
 * Check dan unlock badges yang belum dimiliki.
 *
 * @param {string} userId - User ID.
 * @param {Object} userData - Combined user + stats data.
 * @returns {Promise<Array<{id: string, name: string}>>} Newly unlocked badges.
 */
async function checkAndUnlockBadges(userId, userData) {
  const existingBadges = userData.achievements?.map((a) => a.badgeId) || [];
  const newBadges = [];

  for (const badge of BADGES) {
    if (existingBadges.includes(badge.id)) continue;

    const earned = evaluateBadgeCondition(badge, userData);
    if (earned) {
      try {
        await prisma.userAchievement.create({
          data: { userId, badgeId: badge.id },
        });
        newBadges.push({ id: badge.id, name: badge.name });
      } catch (err) {
        // Unique constraint — already exists, skip
        logger.debug('Badge already exists', { userId, badgeId: badge.id });
      }
    }
  }

  return newBadges;
}

/**
 * Evaluate whether a badge condition is met.
 *
 * @param {Object} badge - Badge definition.
 * @param {Object} data - User data with stats.
 * @returns {boolean}
 */
function evaluateBadgeCondition(badge, data) {
  const stats = data.stats || {};

  switch (badge.id) {
    case 'B-01': return (stats.totalGamesPlayed || 0) >= 1;
    case 'B-02': return data.attemptsUsed && data.attemptsUsed <= 3;
    case 'B-03': return (stats.classicBestScore || 0) >= 800;
    case 'B-04': return (data.longestStreak || 0) >= 7;
    case 'B-05': return (stats.dailyGamesPlayed || 0) >= 10;
    case 'B-06': return (stats.cipherGamesWon || 0) >= 5;
    case 'B-07': return (stats.totalGamesPlayed || 0) >= 50;
    case 'B-08': return (data.level || 1) >= 10;
    case 'B-09': return (data.level || 1) >= 25;
    case 'B-10': return (stats.totalGamesWon || 0) >= 100;
    default: return false;
  }
}

/**
 * Get all badges with unlock status for a user.
 *
 * @param {string} userId - User ID.
 * @returns {Promise<Array>} All badges with unlock info.
 */
async function getAllBadges(userId) {
  const userAchievements = await prisma.userAchievement.findMany({
    where: { userId },
  });

  const unlockedMap = {};
  for (const ua of userAchievements) {
    unlockedMap[ua.badgeId] = ua.unlockedAt;
  }

  return BADGES.map((badge) => ({
    id: badge.id,
    name: badge.name,
    description: badge.description,
    unlocked: !!unlockedMap[badge.id],
    unlockedAt: unlockedMap[badge.id] || null,
  }));
}

module.exports = {
  processGameEnd,
  getAllBadges,
};
