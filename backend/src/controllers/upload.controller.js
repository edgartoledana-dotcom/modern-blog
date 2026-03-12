/**
 * Upload Controller
 * Image upload handling with Cloudinary
 */

const multer = require('multer');
const { blogImageStorage, avatarStorage, categoryStorage, cloudinary } = require('../config/cloudinary');
const { asyncHandler, AppError } = require('../middleware/error.middleware');

// Configure multer for blog images
const uploadBlogImage = multer({
  storage: blogImageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new AppError('Only image files are allowed', 400, 'INVALID_FILE_TYPE'), false);
    }
  }
});

// Configure multer for avatars
const uploadAvatar = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new AppError('Only image files are allowed', 400, 'INVALID_FILE_TYPE'), false);
    }
  }
});

// Configure multer for category images
const uploadCategoryImage = multer({
  storage: categoryStorage,
  limits: {
    fileSize: 3 * 1024 * 1024 // 3MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new AppError('Only image files are allowed', 400, 'INVALID_FILE_TYPE'), false);
    }
  }
});

/**
 * @desc    Upload blog post image
 * @route   POST /api/upload/image
 * @access  Private (Admin/Editor)
 */
const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('No image file provided', 400, 'NO_FILE');
  }

  res.json({
    success: true,
    message: 'Image uploaded successfully',
    data: {
      url: req.file.path,
      publicId: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size
    }
  });
});

/**
 * @desc    Upload multiple images
 * @route   POST /api/upload/images
 * @access  Private (Admin/Editor)
 */
const uploadMultipleImages = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw new AppError('No image files provided', 400, 'NO_FILES');
  }

  const images = req.files.map(file => ({
    url: file.path,
    publicId: file.filename,
    originalName: file.originalname,
    size: file.size
  }));

  res.json({
    success: true,
    message: `${images.length} images uploaded successfully`,
    data: { images }
  });
});

/**
 * @desc    Upload avatar image
 * @route   POST /api/upload/avatar
 * @access  Private
 */
const uploadAvatarImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('No avatar file provided', 400, 'NO_FILE');
  }

  res.json({
    success: true,
    message: 'Avatar uploaded successfully',
    data: {
      url: req.file.path,
      publicId: req.file.filename,
      size: req.file.size
    }
  });
});

/**
 * @desc    Upload category image
 * @route   POST /api/upload/category
 * @access  Private (Admin/Editor)
 */
const uploadCategoryImageHandler = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('No image file provided', 400, 'NO_FILE');
  }

  res.json({
    success: true,
    message: 'Category image uploaded successfully',
    data: {
      url: req.file.path,
      publicId: req.file.filename,
      size: req.file.size
    }
  });
});

/**
 * @desc    Delete image from Cloudinary
 * @route   DELETE /api/upload/image/:publicId
 * @access  Private (Admin/Editor)
 */
const deleteImage = asyncHandler(async (req, res) => {
  const { publicId } = req.params;

  if (!publicId) {
    throw new AppError('Public ID is required', 400, 'MISSING_PUBLIC_ID');
  }

  // Decode the public ID (it comes URL-encoded)
  const decodedPublicId = decodeURIComponent(publicId);

  try {
    const result = await cloudinary.uploader.destroy(decodedPublicId);

    if (result.result === 'ok') {
      res.json({
        success: true,
        message: 'Image deleted successfully'
      });
    } else {
      throw new AppError('Failed to delete image', 400, 'DELETE_FAILED');
    }
  } catch (error) {
    throw new AppError(`Failed to delete image: ${error.message}`, 400, 'DELETE_ERROR');
  }
});

/**
 * @desc    Get image info and transformations
 * @route   GET /api/upload/image-info/:publicId
 * @access  Public
 */
const getImageInfo = asyncHandler(async (req, res) => {
  const { publicId } = req.params;

  if (!publicId) {
    throw new AppError('Public ID is required', 400, 'MISSING_PUBLIC_ID');
  }

  const decodedPublicId = decodeURIComponent(publicId);

  try {
    const result = await cloudinary.api.resource(decodedPublicId);

    res.json({
      success: true,
      data: {
        publicId: result.public_id,
        url: result.secure_url,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        createdAt: result.created_at,
        tags: result.tags,
        transformations: result.derived || []
      }
    });
  } catch (error) {
    throw new AppError(`Image not found: ${error.message}`, 404, 'IMAGE_NOT_FOUND');
  }
});

/**
 * @desc    Generate signed upload URL for direct client-side upload
 * @route   POST /api/upload/signed-url
 * @access  Private (Admin/Editor)
 */
const generateSignedUrl = asyncHandler(async (req, res) => {
  const { folder = 'blog/posts' } = req.body;

  const timestamp = Math.round(new Date().getTime() / 1000);
  const params = {
    timestamp,
    folder,
    allowed_formats: 'jpg,jpeg,png,webp,gif',
    transformation: 'q_auto:good,f_auto'
  };

  const signature = cloudinary.utils.api_sign_request(
    params,
    process.env.CLOUDINARY_API_SECRET
  );

  res.json({
    success: true,
    data: {
      signature,
      timestamp,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      folder,
      url: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`
    }
  });
});

// Export configured multer middlewares
const blogImageUpload = uploadBlogImage.single('image');
const multipleImagesUpload = uploadBlogImage.array('images', 10);
const avatarImageUpload = uploadAvatar.single('avatar');
const categoryImageUpload = uploadCategoryImage.single('image');

module.exports = {
  blogImageUpload,
  multipleImagesUpload,
  avatarImageUpload,
  categoryImageUpload,
  uploadImage,
  uploadMultipleImages,
  uploadAvatarImage,
  uploadCategoryImageHandler,
  deleteImage,
  getImageInfo,
  generateSignedUrl
};
