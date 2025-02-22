import express from 'express';
import multer from 'multer';
import Papa from 'papaparse';

const router = express.Router();

// Configure multer
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Process CSV file
router.post('/process-csv', (req, res) => {
  upload.single('file')(req, res, async (err) => {
    try {
      if (err) {
        console.error('Upload error:', err);
        return res.status(400).json({ 
          error: err.message,
          code: err.code,
          field: err.field
        });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const dateFormat = req.body.dateFormat || 'DD/MM/YYYY';
      const fileContent = req.file.buffer.toString('utf8');

      console.log('Processing CSV with format:', {
        dateFormat,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        firstFewChars: fileContent.substring(0, 100)
      });

      // Use Papaparse with improved configuration
      const parseResult = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: 'greedy',
        transformHeader: (header) => header.trim().toLowerCase(),
        transform: (value) => value.trim(),
        delimitersToGuess: [',', '\t', '|', ';'],  // Try multiple delimiters
        dynamicTyping: false  // Keep everything as strings for now
      });

      if (parseResult.errors.length > 0) {
        console.error('CSV parsing errors:', parseResult.errors);
        return res.status(400).json({
          error: 'CSV parsing failed',
          details: parseResult.errors
        });
      }

      console.log('CSV Parse Result Headers:', parseResult.meta.fields);
      console.log('First row raw:', parseResult.data[0]);

      // Filter out empty rows and clean the data
      const data = parseResult.data.filter(row => 
        Object.values(row).some(val => val && val.trim())
      ).map(row => {
        const cleanRow = {};
        Object.entries(row).forEach(([key, value]) => {
          if (value && value.trim()) {
            cleanRow[key] = value.trim();
          }
        });
        return cleanRow;
      });

      const results = [];
      for (const row of data) {
        try {
          if (!row.transaction_number) {
            console.warn('Skipping row without transaction number:', row);
            continue;
          }

          const processedRow = {
            transactionNumber: String(row.transaction_number || '').trim(),
            type: String(row.transaction_type || '').trim(),
            amount: cleanAmount(row.amount),
            date: parseDateString(row.issue_date, dateFormat),
            dueDate: parseDateString(row.due_date, dateFormat),
            status: String(row.status || '').trim(),
            reference: row.reference ? String(row.reference).trim() : ''
          };

          console.log('Processed row:', {
            original: row,
            processed: processedRow
          });

          results.push(processedRow);
        } catch (error) {
          console.error('Row processing error:', {
            error: error.message,
            row: row
          });
          return res.status(400).json({
            error: `Error in row ${data.indexOf(row) + 1}: ${error.message}`,
            row: row
          });
        }
      }

      console.log(`Successfully processed ${results.length} rows`);
      return res.json(results);

    } catch (error) {
      console.error('Processing error:', error);
      return res.status(500).json({
        error: error.message || 'Internal server error',
        details: error.stack
      });
    }
  });
});

// Helper function to clean amount values
const cleanAmount = (amountStr) => {
  if (!amountStr) return 0;
  try {
    // Handle negative amounts with dollar signs
    const isNegative = amountStr.includes('-');
    // Remove dollar sign, commas, minus signs, and spaces
    let cleaned = amountStr
      .replace(/[^0-9.]/g, '')  // Remove all non-numeric characters except decimal point
      .trim();

    const amount = parseFloat(cleaned);
    if (isNaN(amount)) {
      throw new Error(`Invalid amount value: ${amountStr}`);
    }
    return isNegative ? -amount : amount;
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
    const cleanDateStr = dateStr.toString().trim();
    const parts = cleanDateStr.split(/[\/\-]/).map(part => part.trim());

    if (parts.length !== 3) {
      throw new Error(`Invalid date format: ${dateStr}`);
    }

    // Handle various date formats
    switch (format.toUpperCase()) {
      case 'DD/MM/YYYY':
      case 'DD-MM-YYYY':
        [day, month, year] = parts;
        break;
      case 'MM/DD/YYYY':
      case 'MM-DD-YYYY':
        [month, day, year] = parts;
        break;
      case 'YYYY/MM/DD':
      case 'YYYY-MM-DD':
        [year, month, day] = parts;
        break;
      default:
        throw new Error(`Unsupported date format: ${format}`);
    }

    // Convert to numbers and validate
    day = parseInt(day, 10);
    month = parseInt(month, 10);
    year = parseInt(year, 10);

    if (isNaN(day) || isNaN(month) || isNaN(year)) {
      throw new Error(`Invalid date components: ${dateStr}`);
    }

    // Handle 2-digit years
    if (year < 100) {
      year += year < 50 ? 2000 : 1900;
    }

    // Validate date range
    if (day < 1 || day > 31 || month < 1 || month > 12) {
      throw new Error(`Invalid date values: day=${day}, month=${month}`);
    }

    // Construct and validate date
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

// Match data endpoint
router.post('/match-data', express.json(), async (req, res) => {
  try {
    console.log('Received match data request');
    const { company1Data, company2Data } = req.body;

    if (!company1Data || !company2Data) {
      return res.status(400).json({
        error: 'Missing data - both company1Data and company2Data are required'
      });
    }

    console.log('Data received:', {
      company1Length: company1Data.length,
      company2Length: company2Data.length,
      company1Sample: company1Data[0],
      company2Sample: company2Data[0]
    });

    // Initialize results structure
    const results = {
      totals: {
        company1Total: 0,
        company2Total: 0,
        variance: 0
      },
      perfectMatches: [],
      mismatches: [],
      unmatchedItems: {
        company1: [],
        company2: []
      }
    };

    // Calculate totals
    results.totals.company1Total = company1Data.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    results.totals.company2Total = company2Data.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    results.totals.variance = results.totals.company1Total - results.totals.company2Total;

    // Create lookup maps
    const company1Map = new Map();
    const company2Map = new Map();

    // Populate maps with proper data validation
    company1Data.forEach(item => {
      if (item.transactionNumber) {
        company1Map.set(item.transactionNumber.trim(), {
          ...item,
          amount: parseFloat(item.amount) || 0
        });
      }
    });

    company2Data.forEach(item => {
      if (item.transactionNumber) {
        company2Map.set(item.transactionNumber.trim(), {
          ...item,
          amount: parseFloat(item.amount) || 0
        });
      }
    });

    console.log('Map sizes:', {
      company1MapSize: company1Map.size,
      company2MapSize: company2Map.size
    });

    // Find matches and mismatches
    for (const [transactionNumber, company1Item] of company1Map) {
      const company2Item = company2Map.get(transactionNumber);
      
      console.log('Checking match for:', {
        transactionNumber,
        company1Amount: company1Item.amount,
        company2Amount: company2Item ? company2Item.amount : 'Not found'
      });

      if (company2Item) {
        // AR should be positive, AP should be negative
        const expectedOppositeAmount = -company1Item.amount;
        const variance = company2Item.amount - expectedOppositeAmount;

        if (Math.abs(variance) < 0.01) { // Using small threshold for float comparison
          results.perfectMatches.push({
            company1: company1Item,
            company2: company2Item
          });
        } else {
          results.mismatches.push({
            company1: company1Item,
            company2: company2Item,
            variance: variance
          });
        }
        company2Map.delete(transactionNumber); // Remove matched items
      } else {
        results.unmatchedItems.company1.push(company1Item);
      }
    }

    // Remaining items in company2Map are unmatched
    results.unmatchedItems.company2 = Array.from(company2Map.values());

    console.log('Match results:', {
      totalMatches: results.perfectMatches.length,
      totalMismatches: results.mismatches.length,
      unmatchedCompany1: results.unmatchedItems.company1.length,
      unmatchedCompany2: results.unmatchedItems.company2.length,
      company1Total: results.totals.company1Total,
      company2Total: results.totals.company2Total,
      variance: results.totals.variance
    });

    return res.json(results);

  } catch (error) {
    console.error('Error matching data:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

export default router;