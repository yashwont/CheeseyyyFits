const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'cheezeyy-products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'glb', 'gltf'],
    transformation: (req, file) => {
      if (file.originalname.match(/\.(glb|gltf)$/)) return undefined;
      return [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }];
    },
    resource_type: 'auto'
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // Increased to 20MB for 3D models
});

const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'cheezeyy-avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 256, height: 256, crop: 'fill', gravity: 'face', quality: 'auto' }],
  },
});

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
});

module.exports = { upload, uploadAvatar, cloudinary };
