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

// Parse CSV file
const parseCSV = (filePath, dateFormat) => {
  return new Promise((resolve, reject) => {
    const results = [];
    let rowNum = 0;

    fs.createReadStream(filePath)
      .on('error', (error) => {
        reject(new DataProcessingError(`Error reading CSV file: ${error.message}`));
      })
      .pipe(csv())
      .on('data', (data) => {
        rowNum++;
        try {
          // Validate required fields
          if (!data.transaction_number) {
            throw new ValidationError(`Missing transaction number at row ${rowNum}`);
          }
          if (!data.transaction_type) {
            throw new ValidationError(`Missing transaction type at row ${rowNum}`);
          }

          const parsedAmount = cleanAmount(data.amount);
          const parsedIssueDate = parseDateString(data.issue_date, dateFormat);
          const parsedDueDate = parseDateString(data.due_date, dateFormat);

          if (!data.status) {
            throw new ValidationError(`Missing status at row ${rowNum}`);
          }

          const cleanedData = {
            transactionNumber: data.transaction_number.trim(),
            type: data.transaction_type.trim(),
            amount: parsedAmount,
            date: parsedIssueDate,
            dueDate: parsedDueDate,
            status: data.status.trim(),
            reference: (data.reference || '').trim()
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
          resolve(results);
        }
      })
      .on('error', (error) => {
        reject(new DataProcessingError(`Error parsing CSV: ${error.message}`));
      });
  });
};

// Process single CSV file
router.post('/process-csv', upload.single('csvFile'), async (req, res, next) => {
  let filePath = null;
  
  try {
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

    // Process the file
    const data = await parseCSV(filePath, dateFormat);
    validateTransactionData(data);

    res.json(data);
  } catch (error) {
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

// Match data from both sources
router.post('/match-data', async (req, res, next) => {
  try {
    const { company1Data, company2Data } = req.body;

    // Validate input data
    if (!company1Data || !company2Data) {
      throw new ValidationError('Both datasets are required');
    }

    validateTransactionData(company1Data);
    validateTransactionData(company2Data);

    console.log('Matching data sets:', {
      company1Size: company1Data.length,
      company2Size: company2Data.length
    });

    // Calculate totals
    const company1Total = company1Data
      .filter(t => t.status.toLowerCase() === 'open')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const company2Total = company2Data
      .filter(t => t.status.toLowerCase() === 'open')
      .reduce((sum, t) => sum + t.amount, 0);

    // Find matches and mismatches
    const perfectMatches = [];
    const mismatches = [];
    const onlyInCompany1 = [];
    const onlyInCompany2 = [];

    // Create map for company2 data
    const company2Map = new Map(
      company2Data.map(item => [item.transactionNumber, item])
    );

    // Compare each company1 item
    for (const company1Item of company1Data) {
      const company2Item = company2Map.get(company1Item.transactionNumber);

      if (!company2Item) {
        onlyInCompany1.push(company1Item);
      } else {
        const differences = {
          found: false,
          details: {}
        };

        // Check amount differences
        const amount1 = parseFloat(company1Item.amount.toFixed(2));
        const amount2 = parseFloat(company2Item.amount.toFixed(2));
        if (amount1 !== amount2) {
          differences.found = true;
          differences.details.amount = {
            diff: Math.abs(amount1 - amount2).toFixed(2),
            company1: amount1,
            company2: amount2
          };
        }

        // Check date differences
        if (company1Item.date !== company2Item.date) {
          differences.found = true;
          differences.details.date = {
            company1: company1Item.date,
            company2: company2Item.date
          };
        }

        // Check status differences
        if (company1Item.status.toLowerCase() !== company2Item.status.toLowerCase()) {
          differences.found = true;
          differences.details.status = {
            company1: company1Item.status,
            company2: company2Item.status
          };
        }

        // Check type differences
        if (company1Item.type !== company2Item.type) {
          differences.found = true;
          differences.details.type = {
            company1: company1Item.type,
            company2: company2Item.type
          };
        }

        if (!differences.found) {
          perfectMatches.push({
            source: company1Item,
            matched: company2Item
          });
        } else {
          mismatches.push({
            source: company1Item,
            matched: company2Item,
            differences: differences.details
          });
        }

        company2Map.delete(company1Item.transactionNumber);
      }
    }

    // Remaining items in company2 are unmatched
    onlyInCompany2.push(...Array.from(company2Map.values()));

    const results = {
      totals: {
        company1Total: company1Total.toFixed(2),
        company2Total: company2Total.toFixed(2),
        variance: (company1Total - company2Total).toFixed(2)
      },
      perfectMatches,
      mismatches,
      unmatchedItems: {
        company1: onlyInCompany1,
        company2: onlyInCompany2
      },
      summary: {
        totalTransactions: company1Data.length + company2Data.length,
        perfectMatches: perfectMatches.length,
        mismatches: mismatches.length,
        unmatchedCompany1: onlyInCompany1.length,
        unmatchedCompany2: onlyInCompany2.length
      }
    };

    console.log('Match results:', results.summary);
    res.json(results);
  } catch (error) {
    next(error);
  }
});

export default router;