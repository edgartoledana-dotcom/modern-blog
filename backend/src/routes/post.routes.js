/**
 * Post Routes
 * Blog post CRUD operations
 */

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getPosts,
  getPostBySlug,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  getFeaturedPosts,
  getPostsByCategory,
  getPostsByTag,
  getAllTags,
  toggleFeatured,
  updateStatus,
  getRelatedPosts
} = require('../controllers/post.controller');
const { verifyToken, optionalAuth, requireEditor } = require('../middleware/auth.middleware');

// Validation middleware
const createPostValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
  body('excerpt')
    .trim()
    .notEmpty().withMessage('Excerpt is required')
    .isLength({ max: 500 }).withMessage('Excerpt cannot exceed 500 characters'),
  body('content')
    .notEmpty().withMessage('Content is required'),
  body('featuredImage')
    .notEmpty().withMessage('Featured image is required')
    .isURL().withMessage('Featured image must be a valid URL')
];

const updatePostValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
  body('excerpt')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Excerpt cannot exceed 500 characters'),
  body('metaTitle')
    .optional()
    .trim()
    .isLength({ max: 70 }).withMessage('Meta title should be under 70 characters'),
  body('metaDescription')
    .optional()
    .trim()
    .isLength({ max: 160 }).withMessage('Meta description should be under 160 characters')
];

// Public routes
router.get('/', optionalAuth, getPosts);
router.get('/featured/list', getFeaturedPosts);
router.get('/tags/all', getAllTags);
router.get('/category/:slug', getPostsByCategory);
router.get('/tag/:tag', getPostsByTag);
router.get('/:slug/related', getRelatedPosts);
router.get('/:slug', optionalAuth, getPostBySlug);

// Protected routes (require authentication)
router.use(verifyToken);

// Admin/Editor only routes
router.get('/id/:id', requireEditor, getPostById);
router.post('/', requireEditor, createPostValidation, createPost);
router.put('/:id', requireEditor, updatePostValidation, updatePost);
router.delete('/:id', requireEditor, deletePost);
router.patch('/:id/featured', requireEditor, toggleFeatured);
router.patch('/:id/status', requireEditor, updateStatus);

module.exports = router;
