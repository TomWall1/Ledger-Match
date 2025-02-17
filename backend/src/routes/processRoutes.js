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

const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log('Multer processing file:', {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype
    });
    if (!file.originalname.toLowerCase().endsWith('.csv')) {
      return cb(new Error('Only CSV files are allowed'));
    }
    cb(null, true);
  }
}).any(); // Accept any files, we'll validate them later

// Process single CSV file
router.post('/process-csv', async (req, res, next) => {
  upload(req, res, async function(err) {
    try {
      console.log('Request headers:', req.headers);
      console.log('Request files:', req.files);
      console.log('Request body:', req.body);

      if (err) {
        console.error('Multer error:', err);
        throw new Error(err.message);
      }

      if (!req.files || req.files.length === 0) {
        throw new Error('No file provided');
      }

      const file = req.files[0]; // Get the first file
      const dateFormat = req.body.dateFormat || 'DD/MM/YYYY';

      // Convert buffer to string and parse CSV
      const fileContent = file.buffer.toString('utf8');
      console.log('File content preview:', fileContent.substring(0, 200));

      const rows = fileContent.split('\n')
        .map(row => row.trim())
        .filter(row => row.length > 0);

      // Get headers and validate
      const headers = rows[0].split(',').map(h => h.trim());
      const requiredHeaders = ['transaction_number', 'transaction_type', 'amount', 'issue_date', 'due_date', 'status'];
      for (const required of requiredHeaders) {
        if (!headers.includes(required)) {
          throw new Error(`Missing required header: ${required}`);
        }
      }

      // Process data rows
      const results = [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const values = row.split(',').map(v => v.trim());
        if (values.length !== headers.length) {
          throw new Error(`Row ${i + 1} has incorrect number of fields`);
        }

        const rowData = {};
        headers.forEach((header, index) => {
          rowData[header] = values[index];
        });

        try {
          const cleanedData = {
            transactionNumber: String(rowData.transaction_number),
            type: String(rowData.transaction_type),
            amount: cleanAmount(rowData.amount),
            date: parseDateString(rowData.issue_date, dateFormat),
            dueDate: parseDateString(rowData.due_date, dateFormat),
            status: String(rowData.status),
            reference: rowData.reference ? String(rowData.reference) : ''
          };
          results.push(cleanedData);
        } catch (error) {
          throw new Error(`Error in row ${i + 1}: ${error.message}`);
        }
      }

      console.log(`Successfully processed ${results.length} rows`);
      res.json(results);
    } catch (error) {
      console.error('Processing error:', error);
      res.status(500).json({
        error: error.message,
        path: req.path,
        timestamp: new Date().toISOString()
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