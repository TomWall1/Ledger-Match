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
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + '.csv')
  }
});

const upload = multer({ 
  storage: storage,
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

// ... (other helper functions remain the same)

// Process single CSV file
router.post('/process-csv', upload.single('upload'), async (req, res, next) => {
  let filePath = null;
  
  try {
    // Log request details
    console.log('Received CSV upload request:', {
      file: req.file ? {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        path: req.file.path
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

    const fileContent = fs.readFileSync(filePath, 'utf8');
    console.log('File content preview:', fileContent.substring(0, 200));

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