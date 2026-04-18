/**
 * Admin Controller — Code Breaker
 *
 * @module controllers/adminController
 */

const adminService = require('../services/adminService');

/** GET /api/v1/admin/dashboard */
const getDashboard = async (req, res, next) => {
  try {
    const data = await adminService.getDashboard();
    res.status(200).json({
      success: true,
      data,
      meta: { timestamp: new Date().toISOString(), requestId: req.id },
    });
  } catch (error) {
    next(error);
  }
};

/** GET /api/v1/admin/puzzles */
const listPuzzles = async (req, res, next) => {
  try {
    const { status, page, limit } = req.query;
    const data = await adminService.listPuzzles({
      status,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20,
    });
    res.status(200).json({
      success: true,
      data,
      meta: { timestamp: new Date().toISOString(), requestId: req.id },
    });
  } catch (error) {
    next(error);
  }
};

/** POST /api/v1/admin/puzzles */
const createPuzzle = async (req, res, next) => {
  try {
    const { title, plaintext, shiftValue, hint } = req.body;
    const puzzle = await adminService.createPuzzle(
      { title, plaintext, shiftValue, hint },
      req.user.id
    );
    res.status(201).json({
      success: true,
      data: puzzle,
      meta: { timestamp: new Date().toISOString(), requestId: req.id },
    });
  } catch (error) {
    next(error);
  }
};

/** PATCH /api/v1/admin/puzzles/:id */
const updatePuzzle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const puzzle = await adminService.updatePuzzle(id, data);
    res.status(200).json({
      success: true,
      data: puzzle,
      meta: { timestamp: new Date().toISOString(), requestId: req.id },
    });
  } catch (error) {
    next(error);
  }
};

/** DELETE /api/v1/admin/puzzles/:id */
const deletePuzzle = async (req, res, next) => {
  try {
    const { id } = req.params;
    await adminService.deletePuzzle(id);
    res.status(200).json({
      success: true,
      data: { message: 'Puzzle deleted' },
      meta: { timestamp: new Date().toISOString(), requestId: req.id },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboard, listPuzzles, createPuzzle, updatePuzzle, deletePuzzle };
