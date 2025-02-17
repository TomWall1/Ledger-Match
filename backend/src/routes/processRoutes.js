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

// Configure multer with simple storage
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    console.log('Received file:', {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype
    });
    if (!file.originalname.toLowerCase().endsWith('.csv')) {
      return cb(new Error('Only CSV files are allowed'));
    }
    cb(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
}).fields([
  { name: 'csvFile', maxCount: 1 }
]);

// Process CSV file
router.post('/process-csv', (req, res) => {
  upload(req, res, function(err) {
    try {
      console.log('Request received:', {
        body: req.body,
        files: req.files,
        headers: req.headers
      });

      if (err instanceof multer.MulterError) {
        console.error('Multer error:', err);
        return res.status(400).json({
          error: `Upload error: ${err.message}`,
          code: err.code
        });
      } else if (err) {
        console.error('Other error:', err);
        return res.status(500).json({
          error: `Server error: ${err.message}`
        });
      }

      if (!req.files || !req.files.csvFile || !req.files.csvFile[0]) {
        return res.status(400).json({
          error: 'No CSV file provided'
        });
      }

      const file = req.files.csvFile[0];
      const dateFormat = req.body.dateFormat || 'DD/MM/YYYY';

      console.log('Processing file:', {
        originalname: file.originalname,
        size: file.size,
        dateFormat: dateFormat
      });

      // Parse CSV content
      const fileContent = file.buffer.toString('utf8');
      const lines = fileContent.split('\n').map(line => line.trim()).filter(line => line);

      if (lines.length < 2) {
        return res.status(400).json({
          error: 'CSV file must contain headers and at least one data row'
        });
      }

      // Process CSV data
      const headers = lines[0].split(',').map(h => h.trim());
      const results = [];

      for (let i = 1; i < lines.length; i++) {
        const row = lines[i];
        const values = row.split(',').map(v => v.trim());

        if (values.length !== headers.length) {
          return res.status(400).json({
            error: `Row ${i + 1} has incorrect number of fields`
          });
        }

        const rowData = {};
        headers.forEach((header, index) => {
          rowData[header] = values[index];
        });

        try {
          results.push({
            transactionNumber: String(rowData.transaction_number),
            type: String(rowData.transaction_type),
            amount: cleanAmount(rowData.amount),
            date: parseDateString(rowData.issue_date, dateFormat),
            dueDate: parseDateString(rowData.due_date, dateFormat),
            status: String(rowData.status),
            reference: rowData.reference ? String(rowData.reference) : ''
          });
        } catch (error) {
          return res.status(400).json({
            error: `Error in row ${i + 1}: ${error.message}`
          });
        }
      }

      console.log(`Successfully processed ${results.length} rows`);
      res.json(results);

    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({
        error: error.message
      });
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
      throw new Error(`Invalid amount value: ${amountStr}`);
    }
    return amount;
  } catch (error) {
    throw new Error(`Error processing amount value: ${amountStr}`);
  }
};

// Helper function to parse date strings
const parseDateString = (dateStr, format) => {
  if (!dateStr) {
    throw new Error('Date value is required');
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
      throw new Error(`Invalid date components: ${dateStr}`);
    }

    // Validate date
    const date = new Date(year, month - 1, day);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date: ${dateStr}`);
    }

    // Return standardized format
    return date.toISOString().split('T')[0];
  } catch (error) {
    throw new Error(`Error parsing date ${dateStr}: ${error.message}`);
  }
};

export default router;