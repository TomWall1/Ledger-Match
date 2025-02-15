import express from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Helper function to clean amount values
const cleanAmount = (amountStr) => {
  if (!amountStr) return 0;
  const str = amountStr.toString();
  const cleaned = str
    .replace(/[$£€¥]/g, '')
    .replace(/,/g, '')
    .replace(/\s/g, '')
    .trim();
  return isNaN(parseFloat(cleaned)) ? 0 : parseFloat(cleaned);
};

// Function to parse date strings
const parseDateString = (dateStr, format) => {
  if (!dateStr) return null;

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
        throw new Error(`Unsupported date format: ${format}`);
    }

    const date = new Date(year, month - 1, day);
    if (!isValidDate(date)) {
      throw new Error('Invalid date');
    }
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.error(`Error parsing date: ${dateStr} with format ${format}`, error);
    return null;
  }
};

// Parse CSV file
const parseCSV = (filePath, dateFormat) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        const parsedAmount = cleanAmount(data.amount);
        const parsedIssueDate = parseDateString(data.issue_date, dateFormat);
        const parsedDueDate = parseDateString(data.due_date, dateFormat);

        const cleanedData = {
          transactionNumber: data.transaction_number,
          type: data.transaction_type,
          amount: parsedAmount,
          date: parsedIssueDate,
          dueDate: parsedDueDate,
          status: data.status,
          reference: data.reference || ''
        };
        results.push(cleanedData);
      })
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
};

// Process single CSV file
router.post('/process-csv', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const dateFormat = req.body.dateFormat || 'YYYY-MM-DD';
    console.log('Processing file:', req.file.originalname, 'with format:', dateFormat);

    const data = await parseCSV(req.file.path, dateFormat);
    
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json(data);
  } catch (error) {
    console.error('Error processing CSV:', error);
    res.status(500).json({ error: error.message });
  }
});

// Match data from both sources
router.post('/match-data', async (req, res) => {
  try {
    const { company1Data, company2Data } = req.body;

    if (!company1Data || !company2Data) {
      return res.status(400).json({ error: 'Both datasets are required' });
    }

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
    company1Data.forEach(company1Item => {
      const company2Item = company2Map.get(company1Item.transactionNumber);

      if (!company2Item) {
        onlyInCompany1.push(company1Item);
      } else {
        const amount1 = parseFloat(company1Item.amount.toFixed(2));
        const amount2 = parseFloat(company2Item.amount.toFixed(2));
        
        const isExactMatch = 
          amount1 === amount2 &&
          company1Item.date === company2Item.date &&
          company1Item.status.toLowerCase() === company2Item.status.toLowerCase() &&
          company1Item.type === company2Item.type;

        if (isExactMatch) {
          perfectMatches.push({
            source: company1Item,
            matched: company2Item
          });
        } else {
          mismatches.push({
            source: company1Item,
            matched: company2Item,
            differences: {
              amount: amount1 !== amount2,
              date: company1Item.date !== company2Item.date,
              status: company1Item.status.toLowerCase() !== company2Item.status.toLowerCase(),
              type: company1Item.type !== company2Item.type
            }
          });
        }
        
        company2Map.delete(company1Item.transactionNumber);
      }
    });

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
      }
    };

    console.log('Match results:', {
      perfectMatches: results.perfectMatches.length,
      mismatches: results.mismatches.length,
      unmatchedCompany1: results.unmatchedItems.company1.length,
      unmatchedCompany2: results.unmatchedItems.company2.length
    });

    res.json(results);
  } catch (error) {
    console.error('Error matching data:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
