import express from 'express';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Configure multer with more debug info
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    console.log('Multer processing file:', {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype
    });
    cb(null, true);
  }
});

// Test route that captures raw request data
router.post('/test-upload', (req, res) => {
  console.log('Test upload received');
  console.log('Headers:', req.headers);
  console.log('Content-Type:', req.headers['content-type']);

  // Use multer inside the route handler
  upload.single('file')(req, res, (err) => {
    console.log('Multer callback triggered');
    
    if (err) {
      console.error('Multer error:', {
        message: err.message,
        code: err.code,
        field: err.field,
        stack: err.stack
      });
      return res.status(400).json({ 
        error: 'File upload error',
        details: err.message,
        code: err.code
      });
    }

    console.log('File details:', req.file);
    console.log('Body:', req.body);

    res.json({
      message: 'Upload received',
      file: req.file ? {
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      } : null,
      body: req.body
    });
  });
});

export default router;