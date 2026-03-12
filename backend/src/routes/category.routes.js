/**
 * Category Routes
 * Category management operations
 */

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleStatus,
  getCategoryStats
} = require('../controllers/category.controller');
const { verifyToken, requireAdmin, requireEditor } = require('../middleware/auth.middleware');

// Validation middleware
const createCategoryValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Category name is required')
    .isLength({ max: 50 }).withMessage('Category name cannot exceed 50 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 300 }).withMessage('Description cannot exceed 300 characters'),
  body('color')
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('Please enter a valid hex color')
];

const updateCategoryValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Category name cannot exceed 50 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 300 }).withMessage('Description cannot exceed 300 characters'),
  body('color')
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('Please enter a valid hex color')
];

// Public routes
router.get('/', getCategories);
router.get('/:slug', getCategoryBySlug);

// Protected routes
router.use(verifyToken);

// Admin/Editor routes
router.get('/stats/overview', requireEditor, getCategoryStats);
router.post('/', requireEditor, createCategoryValidation, createCategory);
router.put('/:id', requireEditor, updateCategoryValidation, updateCategory);
router.patch('/:id/status', requireEditor, toggleStatus);

// Admin only routes
router.delete('/:id', requireAdmin, deleteCategory);

module.exports = router;
