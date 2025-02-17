import express from 'express';
import multer from 'multer';
import { parse } from 'csv-parse';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Process CSV file
router.post('/process-csv', upload.fields([
  { name: 'file1', maxCount: 1 },
  { name: 'file2', maxCount: 1 }
]), async (req, res) => {
  try {
    if (!req.files.file1 && !req.files.file2) {
      throw new Error('No files uploaded');
    }

    const results = {};

    if (req.files.file1) {
      const fileContent = req.files.file1[0].buffer.toString();
      const records = [];
      const parser = parse(fileContent, {
        columns: true,
        skip_empty_lines: true
      });

      for await (const record of parser) {
        records.push(record);
      }
      results.company1Data = records;
    }

    if (req.files.file2) {
      const fileContent = req.files.file2[0].buffer.toString();
      const records = [];
      const parser = parse(fileContent, {
        columns: true,
        skip_empty_lines: true
      });

      for await (const record of parser) {
        records.push(record);
      }
      results.company2Data = records;
    }

    res.json(results);
  } catch (error) {
    console.error('Error processing CSV:', error);
    res.status(500).json({
      error: 'Failed to process CSV',
      details: error.message
    });
  }
});

// Match data endpoint
router.post('/match-data', express.json(), async (req, res) => {
  try {
    const { company1Data, company2Data } = req.body;

    if (!company1Data || !company2Data) {
      throw new Error('Both datasets are required');
    }

    // Calculate totals
    const company1Total = company1Data.reduce((sum, item) => sum + parseFloat(item.amount), 0);
    const company2Total = company2Data.reduce((sum, item) => sum + parseFloat(item.amount), 0);

    // Find exact matches
    const perfectMatches = company1Data.filter(item1 => 
      company2Data.some(item2 => 
        item1.transaction_number === item2.transaction_number &&
        parseFloat(item1.amount) === parseFloat(item2.amount)
      )
    );

    // Find mismatches (transactions with same number but different amounts)
    const mismatches = company1Data.filter(item1 => {
      const match = company2Data.find(item2 => 
        item1.transaction_number === item2.transaction_number &&
        parseFloat(item1.amount) !== parseFloat(item2.amount)
      );
      return match !== undefined;
    });

    // Find unmatched items
    const unmatchedCompany1 = company1Data.filter(item1 => 
      !company2Data.some(item2 => item1.transaction_number === item2.transaction_number)
    );

    const unmatchedCompany2 = company2Data.filter(item2 => 
      !company1Data.some(item1 => item2.transaction_number === item1.transaction_number)
    );

    res.json({
      totals: {
        company1Total: company1Total.toFixed(2),
        company2Total: company2Total.toFixed(2),
        variance: (company1Total - company2Total).toFixed(2)
      },
      perfectMatches,
      mismatches,
      unmatchedItems: {
        company1: unmatchedCompany1,
        company2: unmatchedCompany2
      }
    });
  } catch (error) {
    console.error('Error matching data:', error);
    res.status(500).json({
      error: 'Failed to match data',
      details: error.message
    });
  }
});

export default router;