/**
 * Admin Routes — Code Breaker
 *
 * Semua routes dilindungi requireAuth + requireRole('admin').
 *
 * @module routes/adminRoutes
 */

const express = require('express');
const adminController = require('../controllers/adminController');
const { requireAuth } = require('../middleware/jwtAuth');
const { requireRole } = require('../middleware/rbac');
const { validateCreatePuzzle, validateUpdatePuzzle } = require('../middleware/validators/adminValidator');

const router = express.Router();

// All admin routes require JWT + admin role
router.use(requireAuth, requireRole('admin'));

/** GET /api/v1/admin/dashboard */
router.get('/dashboard', adminController.getDashboard);

/** GET /api/v1/admin/puzzles */
router.get('/puzzles', adminController.listPuzzles);

/** POST /api/v1/admin/puzzles */
router.post('/puzzles', validateCreatePuzzle, adminController.createPuzzle);

/** PATCH /api/v1/admin/puzzles/:id */
router.patch('/puzzles/:id', validateUpdatePuzzle, adminController.updatePuzzle);

/** DELETE /api/v1/admin/puzzles/:id */
router.delete('/puzzles/:id', adminController.deletePuzzle);

module.exports = router;
