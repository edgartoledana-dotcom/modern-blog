/**
 * Subscriber Model
 * Schema for newsletter subscribers
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

const subscriberSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email address'
    ]
  },
  name: {
    type: String,
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String,
    select: false
  },
  verificationTokenExpires: {
    type: Date,
    select: false
  },
  unsubscribeToken: {
    type: String,
    select: false
  },
  preferences: {
    design: { type: Boolean, default: true },
    lifestyle: { type: Boolean, default: true },
    technology: { type: Boolean, default: true },
    wellness: { type: Boolean, default: true },
    travel: { type: Boolean, default: true }
  },
  source: {
    type: String,
    enum: ['website', 'popup', 'footer', 'landing_page', 'other'],
    default: 'website'
  },
  ipAddress: {
    type: String,
    default: null,
    select: false
  },
  userAgent: {
    type: String,
    default: null,
    select: false
  },
  lastEmailSent: {
    type: Date,
    default: null
  },
  emailsOpened: {
    type: Number,
    default: 0
  },
  emailsClicked: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
subscriberSchema.index({ email: 1 });
subscriberSchema.index({ isActive: 1 });
subscriberSchema.index({ isVerified: 1 });
subscriberSchema.index({ createdAt: -1 });

// Generate verification token
subscriberSchema.methods.generateVerificationToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.verificationToken = crypto.createHash('sha256').update(token).digest('hex');
  this.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return token; // Return unhashed token for email
};

// Generate unsubscribe token
subscriberSchema.methods.generateUnsubscribeToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.unsubscribeToken = crypto.createHash('sha256').update(token).digest('hex');
  return token;
};

// Verify token
subscriberSchema.methods.verifyToken = function(token) {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  return (
    this.verificationToken === hashedToken &&
    this.verificationTokenExpires > Date.now()
  );
};

// Static method to find by email
subscriberSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to get active subscribers count
subscriberSchema.statics.getActiveCount = function() {
  return this.countDocuments({ isActive: true, isVerified: true });
};

// Static method to get subscription stats
subscriberSchema.statics.getStats = async function() {
  const total = await this.countDocuments();
  const active = await this.countDocuments({ isActive: true });
  const verified = await this.countDocuments({ isVerified: true });
  const newThisMonth = await this.countDocuments({
    createdAt: { $gte: new Date(new Date().setDate(1)) }
  });
  
  return {
    total,
    active,
    verified,
    newThisMonth,
    unsubscribed: total - active
  };
};

module.exports = mongoose.model('Subscriber', subscriberSchema);
