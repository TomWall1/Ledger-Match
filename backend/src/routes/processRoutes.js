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
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
}).single('csvFile');

// Process CSV file
router.post('/process-csv', (req, res) => {
  upload(req, res, async function(err) {
    try {
      console.log('Upload request received:', {
        body: req.body,
        file: req.file ? {
          fieldname: req.file.fieldname,
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size
        } : null
      });

      if (err) {
        console.error('Upload error:', err);
        return res.status(400).json({
          error: err.message,
          details: err
        });
      }

      if (!req.file) {
        console.error('No file in request');
        return res.status(400).json({
          error: 'No file provided'
        });
      }

      const dateFormat = req.body.dateFormat || 'DD/MM/YYYY';
      console.log('Using date format:', dateFormat);

      // Convert buffer to string and process CSV
      const fileContent = req.file.buffer.toString('utf8');
      console.log('File content preview:', fileContent.substring(0, 200));

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

      // Validate required headers
      const requiredHeaders = ['transaction_number', 'transaction_type', 'amount', 'issue_date', 'due_date', 'status'];
      for (const required of requiredHeaders) {
        if (!headers.includes(required)) {
          return res.status(400).json({
            error: `Missing required header: ${required}`,
            headers: headers
          });
        }
      }

      // Process data rows
      const results = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const values = line.split(',').map(v => v.trim());

        if (values.length !== headers.length) {
          return res.status(400).json({
            error: `Row ${i + 1} has ${values.length} fields but expected ${headers.length}`,
            row: line
          });
        }

        // Create object from headers and values
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
            error: `Error in row ${i + 1}: ${error.message}`,
            row: rowData
          });
        }
      }

      console.log(`Successfully processed ${results.length} rows`);
      res.json(results);

    } catch (error) {
      console.error('Processing error:', error);
      res.status(500).json({
        error: error.message,
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