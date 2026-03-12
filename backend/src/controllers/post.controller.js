/**
 * Post Controller
 * Blog post CRUD operations and search
 */

const Post = require('../models/Post');
const Category = require('../models/Category');
const { asyncHandler, AppError } = require('../middleware/error.middleware');
const { validationResult } = require('express-validator');

/**
 * @desc    Get all posts (with filters)
 * @route   GET /api/posts
 * @access  Public
 */
const getPosts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    category,
    tag,
    search,
    author,
    featured,
    sortBy = 'publishedAt',
    sortOrder = 'desc'
  } = req.query;

  // Build query
  const query = {};

  // Status filter (default to published for public)
  if (req.userRole === 'admin' || req.userRole === 'editor') {
    if (status) query.status = status;
  } else {
    query.status = 'published';
  }

  // Category filter
  if (category) {
    const cat = await Category.findOne({ slug: category });
    if (cat) {
      query.categories = cat._id;
    }
  }

  // Tag filter
  if (tag) {
    query.tags = { $in: [tag] };
  }

  // Author filter
  if (author) {
    query.author = author;
  }

  // Featured filter
  if (featured === 'true') {
    query.featured = true;
  }

  // Search filter
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { excerpt: { $regex: search, $options: 'i' } },
      { content: { $regex: search, $options: 'i' } }
    ];
  }

  // Build sort
  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  // Execute query
  const posts = await Post.find(query)
    .populate('author', 'name email avatar')
    .populate('categories', 'name slug color')
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Post.countDocuments(query);

  res.json({
    success: true,
    data: {
      posts,
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
 * @desc    Get single post by slug
 * @route   GET /api/posts/:slug
 * @access  Public
 */
const getPostBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const post = await Post.findBySlug(slug);

  if (!post) {
    throw new AppError('Post not found', 404, 'POST_NOT_FOUND');
  }

  // Check if post is published (unless admin/editor)
  if (post.status !== 'published') {
    if (!req.userRole || (req.userRole !== 'admin' && req.userRole !== 'editor')) {
      throw new AppError('Post not found', 404, 'POST_NOT_FOUND');
    }
  }

  // Increment views
  await post.incrementViews();

  res.json({
    success: true,
    data: { post }
  });
});

/**
 * @desc    Get post by ID (for admin)
 * @route   GET /api/posts/id/:id
 * @access  Private (Admin/Editor)
 */
const getPostById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const post = await Post.findById(id)
    .populate('author', 'name email avatar')
    .populate('categories', 'name slug color');

  if (!post) {
    throw new AppError('Post not found', 404, 'POST_NOT_FOUND');
  }

  res.json({
    success: true,
    data: { post }
  });
});

/**
 * @desc    Create new post
 * @route   POST /api/posts
 * @access  Private (Admin/Editor)
 */
const createPost = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const {
    title,
    excerpt,
    content,
    featuredImage,
    categories,
    tags,
    status,
    featured,
    metaTitle,
    metaDescription,
    keywords,
    canonicalUrl,
    scheduledFor
  } = req.body;

  // Create post
  const post = await Post.create({
    title,
    excerpt,
    content,
    featuredImage,
    author: req.userId,
    categories,
    tags: tags ? tags.map(tag => tag.toLowerCase().trim()) : [],
    status: status || 'draft',
    featured: featured || false,
    metaTitle,
    metaDescription,
    keywords,
    canonicalUrl,
    scheduledFor
  });

  // Populate and return
  const populatedPost = await Post.findById(post._id)
    .populate('author', 'name email avatar')
    .populate('categories', 'name slug color');

  res.status(201).json({
    success: true,
    message: 'Post created successfully',
    data: { post: populatedPost }
  });
});

/**
 * @desc    Update post
 * @route   PUT /api/posts/:id
 * @access  Private (Admin/Editor/Author)
 */
const updatePost = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { id } = req.params;
  const updateData = req.body;

  // Find post
  const post = await Post.findById(id);

  if (!post) {
    throw new AppError('Post not found', 404, 'POST_NOT_FOUND');
  }

  // Check permissions (admin/editor can edit any, author can edit own)
  if (req.userRole === 'author' && post.author.toString() !== req.userId.toString()) {
    throw new AppError('Not authorized to edit this post', 403, 'NOT_AUTHORIZED');
  }

  // Process tags if provided
  if (updateData.tags) {
    updateData.tags = updateData.tags.map(tag => tag.toLowerCase().trim());
  }

  // Update post
  const updatedPost = await Post.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  )
    .populate('author', 'name email avatar')
    .populate('categories', 'name slug color');

  res.json({
    success: true,
    message: 'Post updated successfully',
    data: { post: updatedPost }
  });
});

/**
 * @desc    Delete post
 * @route   DELETE /api/posts/:id
 * @access  Private (Admin/Editor)
 */
const deletePost = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const post = await Post.findById(id);

  if (!post) {
    throw new AppError('Post not found', 404, 'POST_NOT_FOUND');
  }

  // Check permissions
  if (req.userRole === 'author' && post.author.toString() !== req.userId.toString()) {
    throw new AppError('Not authorized to delete this post', 403, 'NOT_AUTHORIZED');
  }

  await Post.findByIdAndDelete(id);

  res.json({
    success: true,
    message: 'Post deleted successfully'
  });
});

/**
 * @desc    Get featured posts
 * @route   GET /api/posts/featured/list
 * @access  Public
 */
const getFeaturedPosts = asyncHandler(async (req, res) => {
  const { limit = 3 } = req.query;

  const posts = await Post.getFeatured(parseInt(limit));

  res.json({
    success: true,
    data: { posts }
  });
});

/**
 * @desc    Get posts by category
 * @route   GET /api/posts/category/:slug
 * @access  Public
 */
const getPostsByCategory = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const category = await Category.findBySlug(slug);

  if (!category) {
    throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
  }

  const posts = await Post.find({
    categories: category._id,
    status: 'published'
  })
    .populate('author', 'name email avatar')
    .populate('categories', 'name slug color')
    .sort({ publishedAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Post.countDocuments({
    categories: category._id,
    status: 'published'
  });

  res.json({
    success: true,
    data: {
      posts,
      category: {
        id: category._id,
        name: category.name,
        slug: category.slug,
        description: category.description
      },
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
 * @desc    Get posts by tag
 * @route   GET /api/posts/tag/:tag
 * @access  Public
 */
const getPostsByTag = asyncHandler(async (req, res) => {
  const { tag } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const posts = await Post.find({
    tags: { $in: [tag.toLowerCase()] },
    status: 'published'
  })
    .populate('author', 'name email avatar')
    .populate('categories', 'name slug color')
    .sort({ publishedAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Post.countDocuments({
    tags: { $in: [tag.toLowerCase()] },
    status: 'published'
  });

  res.json({
    success: true,
    data: {
      posts,
      tag,
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
 * @desc    Get all tags with count
 * @route   GET /api/posts/tags/all
 * @access  Public
 */
const getAllTags = asyncHandler(async (req, res) => {
  const tags = await Post.aggregate([
    { $match: { status: 'published' } },
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $project: { name: '$_id', count: 1, _id: 0 } }
  ]);

  res.json({
    success: true,
    data: { tags }
  });
});

/**
 * @desc    Toggle post featured status
 * @route   PATCH /api/posts/:id/featured
 * @access  Private (Admin/Editor)
 */
const toggleFeatured = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { featured } = req.body;

  const post = await Post.findByIdAndUpdate(
    id,
    { featured },
    { new: true }
  )
    .populate('author', 'name email avatar')
    .populate('categories', 'name slug color');

  if (!post) {
    throw new AppError('Post not found', 404, 'POST_NOT_FOUND');
  }

  res.json({
    success: true,
    message: `Post ${featured ? 'marked as' : 'removed from'} featured`,
    data: { post }
  });
});

/**
 * @desc    Update post status
 * @route   PATCH /api/posts/:id/status
 * @access  Private (Admin/Editor)
 */
const updateStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const post = await Post.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  )
    .populate('author', 'name email avatar')
    .populate('categories', 'name slug color');

  if (!post) {
    throw new AppError('Post not found', 404, 'POST_NOT_FOUND');
  }

  res.json({
    success: true,
    message: `Post status updated to ${status}`,
    data: { post }
  });
});

/**
 * @desc    Get related posts
 * @route   GET /api/posts/:slug/related
 * @access  Public
 */
const getRelatedPosts = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const { limit = 3 } = req.query;

  const post = await Post.findOne({ slug });

  if (!post) {
    throw new AppError('Post not found', 404, 'POST_NOT_FOUND');
  }

  // Find posts with similar categories or tags
  const relatedPosts = await Post.find({
    _id: { $ne: post._id },
    status: 'published',
    $or: [
      { categories: { $in: post.categories } },
      { tags: { $in: post.tags } }
    ]
  })
    .populate('author', 'name email avatar')
    .populate('categories', 'name slug color')
    .sort({ publishedAt: -1 })
    .limit(parseInt(limit));

  res.json({
    success: true,
    data: { posts: relatedPosts }
  });
});

module.exports = {
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
};
