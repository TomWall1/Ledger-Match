import express from 'express';
import multer from 'multer';

const router = express.Router();

// Create basic multer instance
const upload = multer();

// Test route
router.post('/upload', upload.single('file'), (req, res) => {
  console.log('Test route accessed');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('File:', req.file);

  if (!req.file) {
    return res.status(400).json({ error: 'No file received' });
  }

  res.json({
    message: 'File received',
    file: {
      name: req.file.originalname,
      size: req.file.size,
      type: req.file.mimetype
    },
    dateFormat: req.body.dateFormat
  });
});

export default router;