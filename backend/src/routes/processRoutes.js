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

// Configure multer with basic settings
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
}).single('csvFile'); // Change field name to 'csvFile'

// Process single CSV file
router.post('/process-csv', (req, res) => {
  upload(req, res, async (err) => {
    try {
      if (err) {
        console.error('Multer error:', err);
        return res.status(400).json({
          error: err.message,
          details: err
        });
      }

      if (!req.file) {
        return res.status(400).json({
          error: 'No file provided'
        });
      }

      console.log('Received file:', {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });

      const dateFormat = req.body.dateFormat || 'DD/MM/YYYY';
      const results = [];

      // Convert buffer to string and process CSV
      const fileContent = req.file.buffer.toString('utf8');
      const rows = fileContent.split('\n');
      
      // Skip header row
      const dataRows = rows.slice(1);

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        if (!row.trim()) continue; // Skip empty rows

        const [transaction_number, transaction_type, amount, issue_date, due_date, status, reference] = 
          row.split(',').map(field => field.trim());

        try {
          if (!transaction_number || !transaction_type || !amount || !issue_date || !due_date || !status) {
            throw new Error(`Missing required fields in row ${i + 2}`);
          }

          // Process the data
          const cleanedData = {
            transactionNumber: transaction_number,
            type: transaction_type,
            amount: cleanAmount(amount),
            date: parseDateString(issue_date, dateFormat),
            dueDate: parseDateString(due_date, dateFormat),
            status: status,
            reference: reference || ''
          };

          results.push(cleanedData);
        } catch (error) {
          console.error(`Error processing row ${i + 2}:`, error);
          return res.status(400).json({
            error: `Error in row ${i + 2}: ${error.message}`,
            row: row
          });
        }
      }

      if (results.length === 0) {
        return res.status(400).json({
          error: 'No valid data found in CSV file'
        });
      }

      res.json(results);

    } catch (error) {
      console.error('Error processing file:', error);
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