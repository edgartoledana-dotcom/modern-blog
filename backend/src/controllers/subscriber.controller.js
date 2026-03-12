/**
 * Subscriber Controller
 * Newsletter subscription management
 */

const Subscriber = require('../models/Subscriber');
const { asyncHandler, AppError } = require('../middleware/error.middleware');
const { validationResult } = require('express-validator');

/**
 * @desc    Subscribe to newsletter
 * @route   POST /api/subscribers/subscribe
 * @access  Public
 */
const subscribe = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { email, name, preferences, source } = req.body;

  // Check if already subscribed
  const existingSubscriber = await Subscriber.findByEmail(email);

  if (existingSubscriber) {
    if (existingSubscriber.isActive) {
      return res.status(409).json({
        success: false,
        message: 'This email is already subscribed',
        code: 'ALREADY_SUBSCRIBED'
      });
    } else {
      // Reactivate subscription
      existingSubscriber.isActive = true;
      existingSubscriber.name = name || existingSubscriber.name;
      if (preferences) {
        existingSubscriber.preferences = { ...existingSubscriber.preferences, ...preferences };
      }
      await existingSubscriber.save();

      return res.json({
        success: true,
        message: 'Welcome back! Your subscription has been reactivated.',
        data: {
          subscriber: {
            id: existingSubscriber._id,
            email: existingSubscriber.email,
            name: existingSubscriber.name,
            isActive: existingSubscriber.isActive
          }
        }
      });
    }
  }

  // Create new subscriber
  const subscriber = await Subscriber.create({
    email,
    name,
    preferences,
    source: source || 'website',
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  // Generate verification token (for double opt-in)
  const verificationToken = subscriber.generateVerificationToken();
  await subscriber.save({ validateBeforeSave: false });

  // TODO: Send verification email
  // For now, auto-verify in development
  if (process.env.NODE_ENV === 'development') {
    subscriber.isVerified = true;
    await subscriber.save({ validateBeforeSave: false });
  }

  res.status(201).json({
    success: true,
    message: 'Subscription successful! Please check your email to verify.',
    data: {
      subscriber: {
        id: subscriber._id,
        email: subscriber.email,
        name: subscriber.name,
        isActive: subscriber.isActive,
        isVerified: subscriber.isVerified
      }
    }
  });
});

/**
 * @desc    Unsubscribe from newsletter
 * @route   POST /api/subscribers/unsubscribe
 * @access  Public
 */
const unsubscribe = asyncHandler(async (req, res) => {
  const { email, token } = req.body;

  if (!email) {
    throw new AppError('Email is required', 400, 'MISSING_EMAIL');
  }

  const subscriber = await Subscriber.findByEmail(email).select('+unsubscribeToken');

  if (!subscriber) {
    throw new AppError('Subscriber not found', 404, 'SUBSCRIBER_NOT_FOUND');
  }

  // Deactivate subscription
  subscriber.isActive = false;
  await subscriber.save({ validateBeforeSave: false });

  res.json({
    success: true,
    message: 'You have been unsubscribed successfully'
  });
});

/**
 * @desc    Verify subscription (double opt-in)
 * @route   GET /api/subscribers/verify/:token
 * @access  Public
 */
const verifySubscription = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const subscriber = await Subscriber.findOne({
    verificationToken: token,
    verificationTokenExpires: { $gt: Date.now() }
  });

  if (!subscriber) {
    throw new AppError('Invalid or expired verification token', 400, 'INVALID_TOKEN');
  }

  subscriber.isVerified = true;
  subscriber.verificationToken = undefined;
  subscriber.verificationTokenExpires = undefined;
  await subscriber.save({ validateBeforeSave: false });

  res.json({
    success: true,
    message: 'Email verified successfully! You are now subscribed.',
    data: {
      subscriber: {
        id: subscriber._id,
        email: subscriber.email,
        name: subscriber.name
      }
    }
  });
});

/**
 * @desc    Get all subscribers (Admin only)
 * @route   GET /api/subscribers
 * @access  Private (Admin)
 */
const getSubscribers = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 50,
    status,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const query = {};

  if (status === 'active') {
    query.isActive = true;
  } else if (status === 'inactive') {
    query.isActive = false;
  }

  if (search) {
    query.$or = [
      { email: { $regex: search, $options: 'i' } },
      { name: { $regex: search, $options: 'i' } }
    ];
  }

  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  const subscribers = await Subscriber.find(query)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Subscriber.countDocuments(query);

  res.json({
    success: true,
    data: {
      subscribers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

/**
 * @desc    Get subscriber statistics
 * @route   GET /api/subscribers/stats
 * @access  Private (Admin)
 */
const getSubscriberStats = asyncHandler(async (req, res) => {
  const stats = await Subscriber.getStats();

  // Get growth data (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const growthData = await Subscriber.aggregate([
    {
      $match: {
        createdAt: { $gte: sixMonthsAgo }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    }
  ]);

  // Get top sources
  const sources = await Subscriber.aggregate([
    {
      $group: {
        _id: '$source',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  res.json({
    success: true,
    data: {
      ...stats,
      growthData,
      sources
    }
  });
});

/**
 * @desc    Update subscriber preferences
 * @route   PUT /api/subscribers/:id/preferences
 * @access  Private (Admin or own subscriber)
 */
const updatePreferences = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { preferences } = req.body;

  const subscriber = await Subscriber.findById(id);

  if (!subscriber) {
    throw new AppError('Subscriber not found', 404, 'SUBSCRIBER_NOT_FOUND');
  }

  subscriber.preferences = { ...subscriber.preferences, ...preferences };
  await subscriber.save();

  res.json({
    success: true,
    message: 'Preferences updated successfully',
    data: {
      subscriber: {
        id: subscriber._id,
        email: subscriber.email,
        preferences: subscriber.preferences
      }
    }
  });
});

/**
 * @desc    Delete subscriber (Admin only)
 * @route   DELETE /api/subscribers/:id
 * @access  Private (Admin)
 */
const deleteSubscriber = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const subscriber = await Subscriber.findByIdAndDelete(id);

  if (!subscriber) {
    throw new AppError('Subscriber not found', 404, 'SUBSCRIBER_NOT_FOUND');
  }

  res.json({
    success: true,
    message: 'Subscriber deleted successfully'
  });
});

module.exports = {
  subscribe,
  unsubscribe,
  verifySubscription,
  getSubscribers,
  getSubscriberStats,
  updatePreferences,
  deleteSubscriber
};
