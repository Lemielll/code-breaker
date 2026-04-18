/**
 * Leaderboard Service — Code Breaker
 *
 * Mengambil top scores per mode dan posisi rank user.
 *
 * @module services/leaderboardService
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Get leaderboard entries per mode.
 *
 * @param {string} mode - Game mode (classic, daily, cipher).
 * @param {number} limit - Max entries (default 50, max 100).
 * @returns {Promise<Array>} Sorted leaderboard entries.
 */
async function getLeaderboard(mode, limit = 50) {
  const safeLimit = Math.min(Math.max(limit, 1), 100);

  // Get best scores per user for the given mode
  const sessions = await prisma.gameSession.findMany({
    where: {
      mode,
      status: 'won',
      userId: { not: null },
    },
    orderBy: { score: 'desc' },
    take: safeLimit * 2, // over-fetch to dedupe per user
    include: {
      user: { select: { nickname: true, level: true } },
    },
  });

  // Deduplicate: best score per user
  const seen = new Set();
  const entries = [];
  for (const s of sessions) {
    if (!s.userId || seen.has(s.userId)) continue;
    seen.add(s.userId);
    entries.push({
      nickname: s.user?.nickname || 'Unknown',
      score: s.score,
      level: s.user?.level || 1,
    });
    if (entries.length >= safeLimit) break;
  }

  // Add ranks
  return entries.map((entry, idx) => ({
    rank: idx + 1,
    ...entry,
  }));
}

/**
 * Get own rank for a specific user.
 *
 * @param {string} userId - User ID.
 * @param {string} mode - Game mode.
 * @returns {Promise<Object|null>} Own rank info or null.
 */
async function getOwnRank(userId, mode) {
  if (!userId) return null;

  // Get user's best score in this mode
  const bestSession = await prisma.gameSession.findFirst({
    where: { userId, mode, status: 'won' },
    orderBy: { score: 'desc' },
  });

  if (!bestSession) return null;

  // Count how many distinct users have a better score
  const betterScores = await prisma.gameSession.groupBy({
    by: ['userId'],
    where: {
      mode,
      status: 'won',
      score: { gt: bestSession.score },
      userId: { not: null },
    },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { nickname: true },
  });

  return {
    rank: betterScores.length + 1,
    nickname: user?.nickname || 'Unknown',
    score: bestSession.score,
  };
}

module.exports = {
  getLeaderboard,
  getOwnRank,
};
