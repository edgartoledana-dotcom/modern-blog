/**
 * Category Controller
 * Category management operations
 */

const Category = require('../models/Category');
const Post = require('../models/Post');
const { asyncHandler, AppError } = require('../middleware/error.middleware');
const { validationResult } = require('express-validator');

/**
 * @desc    Get all categories
 * @route   GET /api/categories
 * @access  Public
 */
const getCategories = asyncHandler(async (req, res) => {
  const { active = 'true', includeCount = 'true' } = req.query;

  let categories;

  if (active === 'true') {
    categories = await Category.find({ isActive: true })
      .sort({ order: 1, name: 1 })
      .lean();
  } else {
    categories = await Category.find()
      .sort({ order: 1, name: 1 })
      .lean();
  }

  // Include post count if requested
  if (includeCount === 'true') {
    for (const category of categories) {
      category.postCount = await Post.countDocuments({
        categories: category._id,
        status: 'published'
      });
    }
  }

  res.json({
    success: true,
    data: { categories }
  });
});

/**
 * @desc    Get single category by slug
 * @route   GET /api/categories/:slug
 * @access  Public
 */
const getCategoryBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const category = await Category.findBySlug(slug).lean();

  if (!category) {
    throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
  }

  // Get post count
  category.postCount = await Post.countDocuments({
    categories: category._id,
    status: 'published'
  });

  res.json({
    success: true,
    data: { category }
  });
});

/**
 * @desc    Create new category
 * @route   POST /api/categories
 * @access  Private (Admin/Editor)
 */
const createCategory = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { name, description, image, color, order, parent } = req.body;

  // Check if category already exists
  const existingCategory = await Category.findOne({ name: name.trim() });
  if (existingCategory) {
    throw new AppError('Category with this name already exists', 409, 'CATEGORY_EXISTS');
  }

  const category = await Category.create({
    name,
    description,
    image,
    color,
    order: order || 0,
    parent
  });

  res.status(201).json({
    success: true,
    message: 'Category created successfully',
    data: { category }
  });
});

/**
 * @desc    Update category
 * @route   PUT /api/categories/:id
 * @access  Private (Admin/Editor)
 */
const updateCategory = asyncHandler(async (req, res) => {
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

  // Check for duplicate name
  if (updateData.name) {
    const existingCategory = await Category.findOne({
      name: updateData.name.trim(),
      _id: { $ne: id }
    });
    if (existingCategory) {
      throw new AppError('Category with this name already exists', 409, 'CATEGORY_EXISTS');
    }
  }

  const category = await Category.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  );

  if (!category) {
    throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
  }

  res.json({
    success: true,
    message: 'Category updated successfully',
    data: { category }
  });
});

/**
 * @desc    Delete category
 * @route   DELETE /api/categories/:id
 * @access  Private (Admin)
 */
const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if category has posts
  const postCount = await Post.countDocuments({ categories: id });
  if (postCount > 0) {
    throw new AppError(
      `Cannot delete category with ${postCount} posts. Reassign posts first.`,
      400,
      'CATEGORY_HAS_POSTS'
    );
  }

  const category = await Category.findByIdAndDelete(id);

  if (!category) {
    throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
  }

  res.json({
    success: true,
    message: 'Category deleted successfully'
  });
});

/**
 * @desc    Toggle category active status
 * @route   PATCH /api/categories/:id/status
 * @access  Private (Admin/Editor)
 */
const toggleStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  const category = await Category.findByIdAndUpdate(
    id,
    { isActive },
    { new: true }
  );

  if (!category) {
    throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
  }

  res.json({
    success: true,
    message: `Category ${isActive ? 'activated' : 'deactivated'} successfully`,
    data: { category }
  });
});

/**
 * @desc    Get category statistics
 * @route   GET /api/categories/stats/overview
 * @access  Private (Admin/Editor)
 */
const getCategoryStats = asyncHandler(async (req, res) => {
  const categories = await Category.find().lean();

  const stats = await Promise.all(
    categories.map(async (category) => {
      const postCount = await Post.countDocuments({
        categories: category._id,
        status: 'published'
      });

      const draftCount = await Post.countDocuments({
        categories: category._id,
        status: 'draft'
      });

      const totalViews = await Post.aggregate([
        { $match: { categories: category._id, status: 'published' } },
        { $group: { _id: null, totalViews: { $sum: '$views' } } }
      ]);

      return {
        id: category._id,
        name: category.name,
        slug: category.slug,
        isActive: category.isActive,
        postCount,
        draftCount,
        totalViews: totalViews[0]?.totalViews || 0
      };
    })
  );

  res.json({
    success: true,
    data: { stats }
  });
});

module.exports = {
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleStatus,
  getCategoryStats
};
