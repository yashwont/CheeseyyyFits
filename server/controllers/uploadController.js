exports.uploadImage = (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  res.json({ url: req.file.path, publicId: req.file.filename });
};

exports.uploadMultiple = (req, res) => {
  if (!req.files || req.files.length === 0) return res.status(400).json({ message: 'No files uploaded' });
  const urls = req.files.map(f => f.path);
  res.json({ urls });
};

exports.deleteImage = async (req, res) => {
  try {
    const { cloudinary } = require('../middleware/upload');
    const { publicId } = req.body;
    if (!publicId) return res.status(400).json({ message: 'publicId required' });
    await cloudinary.uploader.destroy(publicId);
    res.json({ message: 'Image deleted' });
  } catch {
    res.status(500).json({ message: 'Failed to delete image' });
  }
};
