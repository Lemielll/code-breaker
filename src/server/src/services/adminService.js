/**
 * Admin Service — Code Breaker
 *
 * Business logic untuk admin panel: dashboard stats, CRUD puzzle Cipher Crack.
 * Status transition: Draft → Published → Archived (tidak boleh mundur).
 *
 * @module services/adminService
 */

const { PrismaClient } = require('@prisma/client');
const logger = require('../config/logger');
const { ValidationError, NotFoundError } = require('../errors/AppError');
const { caesarHexEncrypt } = require('../constants/gameConstants');

const prisma = new PrismaClient();

/**
 * Get admin dashboard statistics.
 *
 * @returns {Promise<Object>} Dashboard data.
 */
async function getDashboard() {
  const [totalPlayers, totalPuzzles, puzzlesByStatus, gamesToday] = await Promise.all([
    prisma.user.count({ where: { role: 'player' } }),
    prisma.cipherPuzzle.count(),
    prisma.cipherPuzzle.groupBy({ by: ['status'], _count: true }),
    prisma.gameSession.count({
      where: {
        startedAt: { gte: new Date(new Date().toISOString().split('T')[0]) },
      },
    }),
  ]);

  const statusMap = { draft: 0, published: 0, archived: 0 };
  for (const ps of puzzlesByStatus) {
    statusMap[ps.status] = ps._count;
  }

  return { totalPlayers, totalPuzzles, puzzlesByStatus: statusMap, gamesToday };
}

/**
 * List puzzles with optional filters and pagination.
 *
 * @param {Object} params - { status, page, limit }.
 * @returns {Promise<Object>} { puzzles, total, page }.
 */
async function listPuzzles({ status, page = 1, limit = 20 }) {
  const where = {};
  if (status) where.status = status;

  const [puzzles, total] = await Promise.all([
    prisma.cipherPuzzle.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { creator: { select: { username: true, nickname: true } } },
    }),
    prisma.cipherPuzzle.count({ where }),
  ]);

  return { puzzles, total, page };
}

/**
 * Create a new cipher puzzle.
 * Server computes ciphertext from plaintext + shift.
 *
 * @param {Object} data - { title, plaintext, shiftValue, hint }.
 * @param {string} adminId - Admin user ID.
 * @returns {Promise<Object>} Created puzzle.
 */
async function createPuzzle(data, adminId) {
  const { title, plaintext, shiftValue, hint } = data;

  // Compute ciphertext
  const ciphertext = caesarHexEncrypt(plaintext, shiftValue);

  const puzzle = await prisma.cipherPuzzle.create({
    data: {
      title,
      plaintext: plaintext.toUpperCase(),
      ciphertext,
      shiftValue,
      hint: hint || null,
      createdBy: adminId,
    },
  });

  logger.audit('Puzzle created', {
    puzzleId: puzzle.id,
    adminId,
    title,
    action: 'admin.puzzle.create',
  });

  return puzzle;
}

/**
 * Update puzzle (title, hint, status).
 * Status transitions: Draft→Published ✅, Published→Archived ✅, else ❌
 *
 * @param {string} id - Puzzle ID.
 * @param {Object} data - Update fields.
 * @returns {Promise<Object>} Updated puzzle.
 * @throws {NotFoundError} Puzzle tidak ditemukan.
 * @throws {ValidationError} Status transition invalid.
 */
async function updatePuzzle(id, data) {
  const puzzle = await prisma.cipherPuzzle.findUnique({ where: { id } });
  if (!puzzle) throw new NotFoundError('Puzzle');

  // Validate status transition
  if (data.status) {
    const validTransitions = {
      draft: ['published'],
      published: ['archived'],
      archived: [],
    };

    const allowed = validTransitions[puzzle.status] || [];
    if (!allowed.includes(data.status)) {
      throw new ValidationError([{
        field: 'status',
        message: `Cannot transition from '${puzzle.status}' to '${data.status}'`,
      }]);
    }
  }

  const updateData = {};
  if (data.title) updateData.title = data.title;
  if (data.hint !== undefined) updateData.hint = data.hint;
  if (data.status) updateData.status = data.status;

  const updated = await prisma.cipherPuzzle.update({
    where: { id },
    data: updateData,
  });

  logger.audit('Puzzle updated', {
    puzzleId: id,
    fields: Object.keys(updateData),
    action: 'admin.puzzle.update',
  });

  return updated;
}

/**
 * Delete a puzzle (draft only).
 *
 * @param {string} id - Puzzle ID.
 * @throws {NotFoundError} Puzzle tidak ditemukan.
 * @throws {ValidationError} Puzzle bukan draft.
 */
async function deletePuzzle(id) {
  const puzzle = await prisma.cipherPuzzle.findUnique({ where: { id } });
  if (!puzzle) throw new NotFoundError('Puzzle');

  if (puzzle.status !== 'draft') {
    throw new ValidationError([{
      field: 'status',
      message: 'Only draft puzzles can be deleted',
    }]);
  }

  await prisma.cipherPuzzle.delete({ where: { id } });

  logger.audit('Puzzle deleted', {
    puzzleId: id,
    action: 'admin.puzzle.delete',
  });
}

module.exports = {
  getDashboard,
  listPuzzles,
  createPuzzle,
  updatePuzzle,
  deletePuzzle,
};
