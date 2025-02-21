import express from 'express';
import multer from 'multer';

const router = express.Router();

// Configure multer
const upload = multer({ storage: multer.memoryStorage() });

// Process CSV file
router.post('/process-csv', (req, res) => {
  console.log('Starting /process-csv request');
  console.log('Headers:', req.headers);

  upload.single('file')(req, res, function(err) {
    console.log('Multer callback received');
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);
    console.log('Request file:', req.file);
    console.log('Multer error:', err);

    if (err) {
      console.error('Upload error with details:', {
        error: err,
        message: err.message,
        code: err.code,
        field: err.field,
        storageErrors: err.storageErrors,
        stack: err.stack
      });
      return res.status(400).json({
        error: err.message,
        code: err.code,
        field: err.field,
        details: JSON.stringify(err, Object.getOwnPropertyNames(err))
      });
    }

    if (!req.file) {
      console.error('No file received');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
      // Process the file content
      const fileContent = req.file.buffer.toString('utf8');
      const lines = fileContent.trim().split('\n').map(line => line.trim());

      if (lines.length < 2) {
        return res.status(400).json({ error: 'CSV must contain headers and at least one data row' });
      }

      const headers = lines[0].split(',').map(h => h.trim());
      console.log('CSV Headers:', headers);

      const results = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const rowData = {};
        headers.forEach((header, index) => {
          rowData[header] = values[index] || '';
        });

        results.push({
          transactionNumber: String(rowData.transaction_number || '').trim(),
          type: String(rowData.transaction_type || '').trim(),
          amount: cleanAmount(rowData.amount),
          date: parseDateString(rowData.issue_date, req.body.dateFormat || 'YYYY-MM-DD'),
          dueDate: parseDateString(rowData.due_date, req.body.dateFormat || 'YYYY-MM-DD'),
          status: String(rowData.status || '').trim(),
          reference: rowData.reference ? String(rowData.reference).trim() : ''
        });
      }

      console.log(`Successfully processed ${results.length} rows`);
      return res.json(results);

    } catch (error) {
      console.error('Processing error:', error);
      return res.status(500).json({
        error: error.message || 'Internal server error',
        stack: error.stack
      });
    }
  });
});

// Helper functions remain the same

export default router;