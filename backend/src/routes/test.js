import express from 'express';
import multer from 'multer';

const router = express.Router();
const upload = multer();

router.post('/test-upload', upload.single('file'), (req, res) => {
    console.log('Test upload received');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('File:', req.file);
    res.json({ message: 'Upload test route' });
});

export default router;