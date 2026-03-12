/**
 * Post Model
 * Schema for blog posts with SEO and content management
 */

const mongoose = require('mongoose');
const slugify = require('slugify');

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
    index: true
  },
  slug: {
    type: String,
    unique: true,
    index: true
  },
  excerpt: {
    type: String,
    required: [true, 'Excerpt is required'],
    maxlength: [500, 'Excerpt cannot exceed 500 characters']
  },
  content: {
    type: String,
    required: [true, 'Content is required']
  },
  featuredImage: {
    type: String,
    required: [true, 'Featured image is required']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author is required']
  },
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  featured: {
    type: Boolean,
    default: false
  },
  // SEO Fields
  metaTitle: {
    type: String,
    maxlength: [70, 'Meta title should be under 70 characters'],
    default: ''
  },
  metaDescription: {
    type: String,
    maxlength: [160, 'Meta description should be under 160 characters'],
    default: ''
  },
  keywords: [{
    type: String,
    trim: true
  }],
  canonicalUrl: {
    type: String,
    default: ''
  },
  // Engagement
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  // Publishing
  publishedAt: {
    type: Date,
    default: null
  },
  scheduledFor: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for reading time (average 200 words per minute)
postSchema.virtual('readingTime').get(function() {
  const wordsPerMinute = 200;
  const wordCount = this.content ? this.content.split(/\s+/).length : 0;
  const readingTime = Math.ceil(wordCount / wordsPerMinute);
  return readingTime < 1 ? 1 : readingTime;
});

// Virtual for comment count (if comments are implemented)
postSchema.virtual('commentCount', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'post',
  count: true
});

// Indexes for performance
postSchema.index({ slug: 1 });
postSchema.index({ status: 1, publishedAt: -1 });
postSchema.index({ categories: 1 });
postSchema.index({ tags: 1 });
postSchema.index({ featured: 1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ title: 'text', content: 'text', excerpt: 'text' }); // For text search

// Pre-save middleware to generate slug
postSchema.pre('save', function(next) {
  if (this.isModified('title') || !this.slug) {
    // Generate unique slug with timestamp to avoid conflicts
    const timestamp = Date.now().toString(36).slice(-4);
    const baseSlug = slugify(this.title, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g
    });
    this.slug = `${baseSlug}-${timestamp}`;
  }
  
  // Set publishedAt when post is published
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  // Set meta fields if not provided
  if (!this.metaTitle) {
    this.metaTitle = this.title.substring(0, 70);
  }
  if (!this.metaDescription) {
    this.metaDescription = this.excerpt.substring(0, 160);
  }
  
  next();
});

// Static method to find by slug
postSchema.statics.findBySlug = function(slug) {
  return this.findOne({ slug }).populate('author', 'name email avatar').populate('categories', 'name slug');
};

// Static method to get published posts
postSchema.statics.getPublished = function(options = {}) {
  const { page = 1, limit = 10, category, tag, search } = options;
  
  const query = { status: 'published' };
  
  if (category) {
    query.categories = category;
  }
  
  if (tag) {
    query.tags = { $in: [tag] };
  }
  
  if (search) {
    query.$text = { $search: search };
  }
  
  return this.find(query)
    .populate('author', 'name email avatar')
    .populate('categories', 'name slug')
    .sort({ publishedAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

// Static method to get featured posts
postSchema.statics.getFeatured = function(limit = 3) {
  return this.find({ status: 'published', featured: true })
    .populate('author', 'name email avatar')
    .populate('categories', 'name slug')
    .sort({ publishedAt: -1 })
    .limit(limit);
};

// Instance method to increment views
postSchema.methods.incrementViews = async function() {
  this.views += 1;
  return this.save({ validateBeforeSave: false });
};

// Instance method to toggle like
postSchema.methods.toggleLike = async function(increment = true) {
  this.likes += increment ? 1 : -1;
  if (this.likes < 0) this.likes = 0;
  return this.save({ validateBeforeSave: false });
};

module.exports = mongoose.model('Post', postSchema);
