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
  try {
    // Remove currency symbols and extra spaces
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

// Helper function to clean and pad date components
const padDateComponent = (component) => {
  return component.toString().padStart(2, '0');
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

    // Split by either slash or dash
    const parts = dateStr.split(/[\/\-]/).map(part => part.trim());
    
    if (parts.length !== 3) {
      throw new ValidationError(`Invalid date format: ${dateStr}`);
    }

    switch (format) {
      case 'YYYY-MM-DD':
        [year, month, day] = parts;
        break;
      case 'DD/MM/YYYY':
        [day, month, year] = parts;
        break;
      case 'MM/DD/YYYY':
        [month, day, year] = parts;
        break;
      case 'DD-MM-YYYY':
        [day, month, year] = parts;
        break;
      case 'MM-DD-YYYY':
        [month, day, year] = parts;
        break;
      default:
        throw new ValidationError(`Unsupported date format: ${format}`);
    }

    // Convert to numbers and pad with zeros
    day = padDateComponent(parseInt(day, 10));
    month = padDateComponent(parseInt(month, 10));
    year = parseInt(year, 10);

    if (isNaN(day) || isNaN(month) || isNaN(year)) {
      throw new ValidationError(`Invalid date components: ${dateStr}`);
    }

    const date = new Date(year, month - 1, parseInt(day, 10));
    if (!isValidDate(date)) {
      throw new ValidationError(`Invalid date: ${dateStr}`);
    }

    return `${year}-${month}-${day}`;
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
    const dateFormat = req.body.dateFormat || 'DD/MM/YYYY';
    validateDateFormat(dateFormat);

    console.log('Processing file:', req.file.originalname, 'with format:', dateFormat);

    // Read and parse the CSV file
    const results = [];
    let rowNum = 0;

    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv({
          separator: ',',
          skipLines: 0,
          headers: ['transaction_number', 'transaction_type', 'amount', 'issue_date', 'due_date', 'status', 'reference'],
          strict: true
        }))
        .on('data', (row) => {
          rowNum++;
          try {
            console.log(`Processing row ${rowNum}:`, row);

            // Basic validation
            if (!row.transaction_number || !row.transaction_type || !row.amount || 
                !row.issue_date || !row.due_date || !row.status) {
              console.log('Invalid row data:', row);
              throw new ValidationError(`Missing required fields in row ${rowNum}`);
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
            console.error(`Error processing row ${rowNum}:`, error);
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
          console.error('CSV parsing error:', error);
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