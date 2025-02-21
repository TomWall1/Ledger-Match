import express from 'express';
import multer from 'multer';

const router = express.Router();

// Configure multer
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Basic test endpoint
router.get('/', (req, res) => {
  res.json({ message: 'Test route is working' });
});

// File upload test endpoint
router.post('/upload', (req, res) => {
  console.log('Test upload route accessed');
  console.log('Headers:', req.headers);

  upload.single('file')(req, res, (err) => {
    console.log('Multer callback');
    console.log('Body:', req.body);
    console.log('File:', req.file);
    console.log('Error:', err);

    if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({ 
        error: err.message,
        code: err.code,
        field: err.field
      });
    }

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
});

export default router;