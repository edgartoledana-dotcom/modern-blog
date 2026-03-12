/**
 * Cloudinary Configuration
 * Image upload and management service
 */

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Configure storage for blog images
const blogImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'blog/posts',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    transformation: [
      { quality: 'auto:good' },
      { fetch_format: 'auto' }
    ],
    public_id: (req, file) => {
      const timestamp = Date.now();
      const sanitizedName = file.originalname.split('.')[0].replace(/[^a-zA-Z0-9]/g, '-');
      return `post-${sanitizedName}-${timestamp}`;
    }
  }
});

// Configure storage for user avatars
const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'blog/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      { quality: 'auto:good' }
    ],
    public_id: (req, file) => {
      const timestamp = Date.now();
      return `avatar-${timestamp}`;
    }
  }
});

// Configure storage for category images
const categoryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'blog/categories',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 800, height: 600, crop: 'fill' },
      { quality: 'auto:good' }
    ],
    public_id: (req, file) => {
      const timestamp = Date.now();
      return `category-${timestamp}`;
    }
  }
});

// Upload image from URL
const uploadFromUrl = async (imageUrl, folder = 'blog/posts') => {
  try {
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: folder,
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
    });
    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height
    };
  } catch (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

// Delete image by public ID
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw new Error(`Failed to delete image: ${error.message}`);
  }
};

// Get optimized image URL
const getOptimizedUrl = (url, options = {}) => {
  const defaultOptions = {
    quality: 'auto',
    fetch_format: 'auto',
    ...options
  };
  
  // If it's already a Cloudinary URL, add transformations
  if (url.includes('cloudinary.com')) {
    const transformations = Object.entries(defaultOptions)
      .map(([key, value]) => `${key}_${value}`)
      .join(',');
    
    return url.replace('/upload/', `/upload/${transformations}/`);
  }
  
  return url;
};

// Generate responsive image srcset
const generateSrcSet = (publicId, widths = [320, 640, 960, 1280, 1920]) => {
  return widths
    .map(width => {
      const url = cloudinary.url(publicId, {
        width,
        crop: 'scale',
        quality: 'auto',
        fetch_format: 'auto'
      });
      return `${url} ${width}w`;
    })
    .join(', ');
};

module.exports = {
  cloudinary,
  blogImageStorage,
  avatarStorage,
  categoryStorage,
  uploadFromUrl,
  deleteImage,
  getOptimizedUrl,
  generateSrcSet
};
