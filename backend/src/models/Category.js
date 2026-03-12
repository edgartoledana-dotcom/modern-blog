/**
 * Category Model
 * Schema for blog post categories
 */

const mongoose = require('mongoose');
const slugify = require('slugify');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
    maxlength: [50, 'Category name cannot exceed 50 characters']
  },
  slug: {
    type: String,
    unique: true,
    index: true
  },
  description: {
    type: String,
    maxlength: [300, 'Description cannot exceed 300 characters'],
    default: ''
  },
  image: {
    type: String,
    default: null
  },
  color: {
    type: String,
    default: '#e1f532', // Default accent color
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please enter a valid hex color']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for post count
categorySchema.virtual('postCount', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'categories',
  count: true
});

// Virtual for subcategories
categorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent'
});

// Indexes
categorySchema.index({ slug: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ order: 1 });

// Pre-save middleware to generate slug
categorySchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g
    });
  }
  next();
});

// Static method to find by slug
categorySchema.statics.findBySlug = function(slug) {
  return this.findOne({ slug });
};

// Static method to get active categories with post count
categorySchema.statics.getActiveWithCount = async function() {
  const categories = await this.find({ isActive: true })
    .sort({ order: 1, name: 1 })
    .lean();
  
  // Get post counts
  const Post = mongoose.model('Post');
  for (const category of categories) {
    category.postCount = await Post.countDocuments({
      categories: category._id,
      status: 'published'
    });
  }
  
  return categories;
};

module.exports = mongoose.model('Category', categorySchema);
