import express from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import { 
  ValidationError, 
  DataProcessingError,
  validateFile,
  validateDateFormat,
  validateTransactionData
} from '../utils/errors.js';

const router = express.Router();

// Configure multer with file size limits
const upload = multer({ 
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Add CORS headers for file uploads
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://ledger-match.vercel.app');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Helper function to clean amount values
const cleanAmount = (amountStr) => {
  if (!amountStr) return 0;
  const str = amountStr.toString();
  try {
    const cleaned = str
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

// Function to parse date strings
const parseDateString = (dateStr, format) => {
  if (!dateStr) {
    throw new ValidationError('Date value is required');
  }

  const isValidDate = (date) => {
    return date instanceof Date && !isNaN(date);
  };

  try {
    console.log('Parsing date:', dateStr, 'with format:', format);
    let day, month, year;
    dateStr = dateStr.trim();

    switch (format) {
      case 'YYYY-MM-DD':
        [year, month, day] = dateStr.split('-').map(Number);
        break;
      case 'DD/MM/YYYY':
        [day, month, year] = dateStr.split('/').map(Number);
        break;
      case 'MM/DD/YYYY':
        [month, day, year] = dateStr.split('/').map(Number);
        break;
      case 'DD-MM-YYYY':
        [day, month, year] = dateStr.split('-').map(Number);
        break;
      case 'MM-DD-YYYY':
        [month, day, year] = dateStr.split('-').map(Number);
        break;
      default:
        throw new ValidationError(`Unsupported date format: ${format}`);
    }

    if (isNaN(day) || isNaN(month) || isNaN(year)) {
      throw new ValidationError(`Invalid date components: ${dateStr}`);
    }

    const date = new Date(year, month - 1, day);
    if (!isValidDate(date)) {
      throw new ValidationError(`Invalid date: ${dateStr}`);
    }
    return date.toISOString().split('T')[0];
  } catch (error) {
    throw new ValidationError(`Error parsing date ${dateStr} with format ${format}: ${error.message}`);
  }
};

// Process single CSV file
router.post('/process-csv', upload.single('csvFile'), async (req, res, next) => {
  let filePath = null;
  
  try {
    // Log request details
    console.log('Received CSV upload request:', {
      file: req.file ? {
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      } : 'No file',
      body: req.body
    });

    // Validate file
    if (!req.file) {
      throw new ValidationError('No file provided');
    }
    filePath = req.file.path;
    validateFile(req.file);

    // Validate date format
    const dateFormat = req.body.dateFormat || 'YYYY-MM-DD';
    validateDateFormat(dateFormat);

    console.log('Processing file:', req.file.originalname, 'with format:', dateFormat);

    // Read and parse the CSV file
    const results = [];
    let rowNum = 0;

    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          rowNum++;
          try {
            console.log(`Processing row ${rowNum}:`, row);

            // Validate required fields
            if (!row.transaction_number) {
              throw new ValidationError(`Missing transaction number at row ${rowNum}`);
            }
            if (!row.transaction_type) {
              throw new ValidationError(`Missing transaction type at row ${rowNum}`);
            }
            if (!row.amount) {
              throw new ValidationError(`Missing amount at row ${rowNum}`);
            }
            if (!row.issue_date) {
              throw new ValidationError(`Missing issue date at row ${rowNum}`);
            }
            if (!row.due_date) {
              throw new ValidationError(`Missing due date at row ${rowNum}`);
            }
            if (!row.status) {
              throw new ValidationError(`Missing status at row ${rowNum}`);
            }

            // Process the data
            const cleanedData = {
              transactionNumber: String(row.transaction_number).trim(),
              type: String(row.transaction_type).trim(),
              amount: cleanAmount(row.amount),
              date: parseDateString(row.issue_date, dateFormat),
              dueDate: parseDateString(row.due_date, dateFormat),
              status: String(row.status).trim(),
              reference: row.reference ? String(row.reference).trim() : ''
            };

            results.push(cleanedData);
          } catch (error) {
            reject(new DataProcessingError(`Error processing row ${rowNum}: ${error.message}`));
          }
        })
        .on('end', () => {
          if (results.length === 0) {
            reject(new ValidationError('No valid data found in CSV file'));
          } else {
            resolve();
          }
        })
        .on('error', (error) => {
          reject(new DataProcessingError(`Error reading CSV: ${error.message}`));
        });
    });

    console.log(`Successfully processed ${results.length} rows`);
    res.json(results);
  } catch (error) {
    console.error('Error processing CSV:', error);
    next(error);
  } finally {
    // Clean up the file
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        console.error('Error cleaning up file:', e);
      }
    }
  }
});

// Match data endpoint remains the same...

export default router;