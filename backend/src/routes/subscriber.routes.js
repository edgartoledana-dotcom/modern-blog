/**
 * Subscriber Routes
 * Newsletter subscription management
 */

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  subscribe,
  unsubscribe,
  verifySubscription,
  getSubscribers,
  getSubscriberStats,
  updatePreferences,
  deleteSubscriber
} = require('../controllers/subscriber.controller');
const { verifyToken, requireAdmin } = require('../middleware/auth.middleware');

// Validation middleware
const subscribeValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email'),
  body('name')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters')
];

// Public routes
router.post('/subscribe', subscribeValidation, subscribe);
router.post('/unsubscribe', unsubscribe);
router.get('/verify/:token', verifySubscription);

// Protected routes (Admin only)
router.use(verifyToken, requireAdmin);

router.get('/', getSubscribers);
router.get('/stats', getSubscriberStats);
router.put('/:id/preferences', updatePreferences);
router.delete('/:id', deleteSubscriber);

module.exports = router;
