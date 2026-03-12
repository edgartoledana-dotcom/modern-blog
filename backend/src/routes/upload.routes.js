/**
 * Upload Routes
 * Image upload and management
 */

const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/upload.controller');
const { verifyToken, requireEditor } = require('../middleware/auth.middleware');

// All upload routes require authentication
router.use(verifyToken);

// Single image upload (for blog posts)
router.post('/image', requireEditor, blogImageUpload, uploadImage);

// Multiple images upload
router.post('/images', requireEditor, multipleImagesUpload, uploadMultipleImages);

// Avatar upload
router.post('/avatar', avatarImageUpload, uploadAvatarImage);

// Category image upload
router.post('/category', requireEditor, categoryImageUpload, uploadCategoryImageHandler);

// Delete image
router.delete('/image/:publicId', requireEditor, deleteImage);

// Get image info
router.get('/image-info/:publicId', getImageInfo);

// Generate signed URL for client-side upload
router.post('/signed-url', requireEditor, generateSignedUrl);

module.exports = router;
