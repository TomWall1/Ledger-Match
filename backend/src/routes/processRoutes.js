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

      const dateFormat = req.body.dateFormat || 'YYYY-MM-DD';
      const fileContent = req.file.buffer.toString('utf8');

      // Use Papaparse for robust CSV parsing
      const parseResult = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
        transformHeader: (header) => header.trim(),
      });

      if (parseResult.errors.length > 0) {
        console.error('CSV parsing errors:', parseResult.errors);
        return res.status(400).json({
          error: 'CSV parsing failed',
          details: parseResult.errors
        });
      }

      const results = [];
      for (const row of parseResult.data) {
        try {
          results.push({
            transactionNumber: String(row.transaction_number || '').trim(),
            type: String(row.transaction_type || '').trim(),
            amount: cleanAmount(row.amount),
            date: parseDateString(row.issue_date, dateFormat),
            dueDate: parseDateString(row.due_date, dateFormat),
            status: String(row.status || '').trim(),
            reference: row.reference ? String(row.reference).trim() : ''
          });
        } catch (error) {
          console.error('Row processing error:', {
            error: error.message,
            row: row
          });
          return res.status(400).json({
            error: `Error in row ${parseResult.data.indexOf(row) + 1}: ${error.message}`,
            row: row
          });
        }
      }

      console.log(`Successfully processed ${results.length} rows`);
      return res.json(results);

    } catch (error) {
      console.error('Processing error:', error);
      return res.status(500).json({
        error: error.message || 'Internal server error'
      });
    }
  });
});

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
    results.totals.company1Total = company1Data.reduce((sum, item) => sum + item.amount, 0);
    results.totals.company2Total = company2Data.reduce((sum, item) => sum + item.amount, 0);
    results.totals.variance = results.totals.company1Total - results.totals.company2Total;

    // Create lookup maps
    const company1Map = new Map(company1Data.map(item => [item.transactionNumber, item]));
    const company2Map = new Map(company2Data.map(item => [item.transactionNumber, item]));

    // Find matches and mismatches
    for (const [transactionNumber, company1Item] of company1Map) {
      const company2Item = company2Map.get(transactionNumber);
      if (company2Item) {
        if (Math.abs(company1Item.amount + company2Item.amount) < 0.01) { // Using small threshold for float comparison
          results.perfectMatches.push({
            company1: company1Item,
            company2: company2Item
          });
        } else {
          results.mismatches.push({
            company1: company1Item,
            company2: company2Item,
            variance: company1Item.amount + company2Item.amount
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
      unmatchedCompany2: results.unmatchedItems.company2.length
    });

    return res.json(results);

  } catch (error) {
    console.error('Error matching data:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// Helper function to clean amount values
const cleanAmount = (amountStr) => {
  if (!amountStr) return 0;
  try {
    // Remove any quotes first
    let cleaned = amountStr.toString().replace(/["']/g, '');
    // Then remove currency symbols and spaces
    cleaned = cleaned
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
    dateStr = dateStr.toString().trim();
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