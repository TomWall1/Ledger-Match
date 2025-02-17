import express from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import path from 'path';
import { 
  ValidationError, 
  DataProcessingError,
  validateFile,
  validateDateFormat,
  validateTransactionData
} from '../utils/errors.js';

const router = express.Router();

// Configure multer with file size limits
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + '.csv')
  }
});

const fileFilter = (req, file, cb) => {
  console.log('Received file:', file);
  if (file.mimetype !== 'text/csv' && !file.originalname.toLowerCase().endsWith('.csv')) {
    return cb(new Error('Only CSV files are allowed'), false);
  }
  cb(null, true);
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
}).single('upload'); // 'upload' is the field name we expect

// Process single CSV file
router.post('/process-csv', async (req, res, next) => {
  console.log('Received request headers:', req.headers);
  console.log('Received request body:', req.body);

  upload(req, res, async function(err) {
    let filePath = null;

    try {
      if (err instanceof multer.MulterError) {
        console.error('Multer error:', err);
        throw new Error(`File upload error: ${err.message}`);
      } else if (err) {
        console.error('Unknown error:', err);
        throw new Error(`Unknown error: ${err.message}`);
      }

      // Log what we received
      console.log('File upload details:', {
        file: req.file,
        body: req.body
      });

      if (!req.file) {
        throw new ValidationError('No file provided');
      }

      filePath = req.file.path;
      const dateFormat = req.body.dateFormat || 'DD/MM/YYYY';
      
      // Read file content for logging
      const fileContent = fs.readFileSync(filePath, 'utf8');
      console.log('File content preview:', fileContent.substring(0, 200));

      // Parse CSV
      const results = [];
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (row) => {
            try {
              // Convert row data
              const cleanedData = {
                transactionNumber: String(row.transaction_number || '').trim(),
                type: String(row.transaction_type || '').trim(),
                amount: cleanAmount(row.amount),
                date: parseDateString(row.issue_date, dateFormat),
                dueDate: parseDateString(row.due_date, dateFormat),
                status: String(row.status || '').trim(),
                reference: row.reference ? String(row.reference).trim() : ''
              };
              results.push(cleanedData);
            } catch (error) {
              reject(error);
            }
          })
          .on('end', () => resolve(results))
          .on('error', reject);
      });

      res.json(results);
    } catch (error) {
      console.error('Error processing file:', error);
      next(error);
    } finally {
      // Clean up uploaded file
      if (filePath && fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.error('Error cleaning up file:', e);
        }
      }
    }
  });
});

// Helper function to clean amount values
const cleanAmount = (amountStr) => {
  if (!amountStr) return 0;
  try {
    const cleaned = amountStr.toString()
      .replace(/[$£€¥]/g, '')
      .replace(/,/g, '')
      .replace(/\s/g, '')
      .trim();
    const amount = parseFloat(cleaned);
    if (isNaN(amount)) {
      throw new ValidationError(`Invalid amount value: ${amountStr}`);
    }
    return amount;
  } catch (error) {
    throw new ValidationError(`Error processing amount value: ${amountStr}`);
  }
};

// Helper function to parse date strings
const parseDateString = (dateStr, format) => {
  if (!dateStr) {
    throw new ValidationError('Date value is required');
  }

  try {
    let day, month, year;
    dateStr = dateStr.trim();
    const parts = dateStr.split(/[\/\-]/).map(part => part.trim());

    switch (format) {
      case 'DD/MM/YYYY':
        [day, month, year] = parts;
        break;
      default:
        [year, month, day] = parts;
    }

    // Ensure values are numbers
    day = parseInt(day, 10);
    month = parseInt(month, 10);
    year = parseInt(year, 10);

    if (isNaN(day) || isNaN(month) || isNaN(year)) {
      throw new ValidationError(`Invalid date components: ${dateStr}`);
    }

    // Validate date
    const date = new Date(year, month - 1, day);
    if (isNaN(date.getTime())) {
      throw new ValidationError(`Invalid date: ${dateStr}`);
    }

    // Return standardized format
    return date.toISOString().split('T')[0];
  } catch (error) {
    throw new ValidationError(`Error parsing date ${dateStr}: ${error.message}`);
  }
};

export default router;