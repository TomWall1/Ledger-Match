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

// Configure multer
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    console.log('Multer processing file:', file);
    if (!file.originalname.toLowerCase().endsWith('.csv')) {
      return cb(new Error('Only CSV files are allowed'));
    }
    cb(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
}).any();

// Process CSV file
router.post('/process-csv', (req, res) => {
  console.log('Request received:', {
    headers: req.headers,
    contentType: req.headers['content-type']
  });

  upload(req, res, async function(err) {
    try {
      if (err) {
        console.error('Upload error:', err);
        return res.status(400).json({
          error: err.message,
          details: err
        });
      }

      console.log('Upload callback received:', {
        files: req.files,
        body: req.body
      });

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          error: 'No file uploaded'
        });
      }

      // Get the first file
      const file = req.files[0];
      console.log('Processing file:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      });

      const dateFormat = req.body.dateFormat || 'DD/MM/YYYY';
      
      // Convert buffer to string
      const fileContent = file.buffer.toString('utf8');
      console.log('File content preview:', fileContent.substring(0, 200));
      
      // Split into lines and remove empty ones
      const lines = fileContent.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      if (lines.length < 2) {
        return res.status(400).json({
          error: 'CSV file must contain headers and at least one data row'
        });
      }

      // Get headers
      const headers = lines[0].split(',').map(h => h.trim());
      console.log('CSV Headers:', headers);

      // Process data rows
      const results = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const values = line.split(',').map(v => v.trim());

        // Create row data object
        const rowData = {};
        headers.forEach((header, index) => {
          rowData[header] = values[index] || '';
        });

        try {
          results.push({
            transactionNumber: String(rowData.transaction_number || '').trim(),
            type: String(rowData.transaction_type || '').trim(),
            amount: cleanAmount(rowData.amount),
            date: parseDateString(rowData.issue_date, dateFormat),
            dueDate: parseDateString(rowData.due_date, dateFormat),
            status: String(rowData.status || '').trim(),
            reference: rowData.reference ? String(rowData.reference).trim() : ''
          });
        } catch (error) {
          return res.status(400).json({
            error: `Error in row ${i + 1}: ${error.message}`,
            row: rowData
          });
        }
      }

      console.log(`Successfully processed ${results.length} rows`);
      return res.json(results);

    } catch (error) {
      console.error('Processing error:', error);
      return res.status(500).json({
        error: error.message || 'Internal server error',
        details: error
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