const express = require('express');
const cors = require('cors');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');

const app = express();

// Enable CORS with specific options
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3003',
    'http://localhost:3005',  // Added your new development port
    'https://ledger-match.vercel.app',
    'https://ledger-match-git-main-tomwall1.vercel.app',
    'https://ledger-match-9knq3j55o-toms-projects-c3abf80c.vercel.app'
  ],
  methods: ['POST', 'GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept'],
  credentials: false
}));

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Helper function to clean amount values
const cleanAmount = (amountStr) => {
  if (!amountStr) return 0;
  
  // Convert to string in case we receive a number
  const str = amountStr.toString();
  
  // Remove currency symbols, commas, and spaces
  const cleaned = str
    .replace(/[$£€¥]/g, '') // Remove common currency symbols
    .replace(/,/g, '')      // Remove commas
    .replace(/\s/g, '')     // Remove spaces
    .trim();
  
  // Convert to float
  const amount = parseFloat(cleaned);
  
  // Return 0 if not a valid number
  return isNaN(amount) ? 0 : amount;
};

// Function to parse date strings according to format
const parseDateString = (dateStr, format) => {
  if (!dateStr) return null;

  // Helper to check if a date is valid
  const isValidDate = (date) => {
    return date instanceof Date && !isNaN(date);
  };

  try {
    console.log('Parsing date:', dateStr, 'with format:', format);

    let day, month, year;
    // Remove any leading/trailing whitespace
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

    console.log('Parsed components:', { day, month, year });

    const date = new Date(year, month - 1, day);
    
    if (!isValidDate(date)) {
      console.log('Invalid date created:', date);
      throw new Error('Invalid date');
    }

    const result = date.toISOString().split('T')[0];
    console.log('Formatted result:', result);
    
    return result;
  } catch (error) {
    console.error(`Error parsing date: ${dateStr} with format ${format}`, error);
    return null;
  }
};

// Function to parse CSV file with date format handling
const parseCSV = (filePath, dateFormat) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        console.log('Raw amount:', data.amount);
        
        const parsedAmount = cleanAmount(data.amount);
        console.log('Parsed amount:', parsedAmount);

        const parsedIssueDate = parseDateString(data.issue_date, dateFormat);
        const parsedDueDate = parseDateString(data.due_date, dateFormat);

        console.log('Parsed dates:', {
          issueDate: parsedIssueDate,
          dueDate: parsedDueDate
        });

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
      .on('end', () => {
        console.log(`Parsed ${results.length} rows from CSV with date format ${dateFormat}`);
        if (results.length > 0) {
          console.log('Sample processed row:', results[0]);
        }
        resolve(results);
      })
      .on('error', (error) => reject(error));
  });
};

// Function to analyze and match transactions
const analyzeTransactions = (company1Data, company2Data) => {
  console.log('Starting transaction analysis');
  console.log('Company 1 data count:', company1Data.length);
  console.log('Company 2 data count:', company2Data.length);

  const company1Total = company1Data
    .filter(t => t.status === 'Open')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const company2Total = company2Data
    .filter(t => t.status === 'Open')
    .reduce((sum, t) => sum + t.amount, 0);

  console.log('Company 1 total (Open items):', company1Total);
  console.log('Company 2 total (Open items):', company2Total);

  const perfectMatches = [];
  const mismatches = [];
  const onlyInCompany1 = [];
  const onlyInCompany2 = [];

  const company2Map = new Map();
  company2Data.forEach(item => {
    company2Map.set(item.transactionNumber, item);
  });

  company1Data.forEach(company1Item => {
    const company2Item = company2Map.get(company1Item.transactionNumber);

    if (!company2Item) {
      console.log('No match found for:', company1Item.transactionNumber);
      onlyInCompany1.push(company1Item);
    } else {
      const amount1 = parseFloat(company1Item.amount.toFixed(2));
      const amount2 = parseFloat(company2Item.amount.toFixed(2));
      
      console.log('Comparing amounts:', {
        transaction: company1Item.transactionNumber,
        amount1: amount1,
        amount2: amount2
      });

      const isExactMatch = 
        amount1 === amount2 &&
        company1Item.date === company2Item.date &&
        company1Item.status === company2Item.status &&
        company1Item.type === company2Item.type;

      if (isExactMatch) {
        console.log('Perfect match found for:', company1Item.transactionNumber);
        perfectMatches.push({
          source: company1Item,
          matched: company2Item
        });
      } else {
        console.log('Mismatch found for:', company1Item.transactionNumber, {
          amountDiff: Math.abs(amount1 - amount2),
          dateDiff: company1Item.date !== company2Item.date,
          statusDiff: company1Item.status !== company2Item.status,
          typeDiff: company1Item.type !== company2Item.type
        });
        
        mismatches.push({
          source: company1Item,
          matched: company2Item,
          differences: {
            amount: amount1 !== amount2,
            date: company1Item.date !== company2Item.date,
            status: company1Item.status !== company2Item.status,
            type: company1Item.type !== company2Item.type
          }
        });
      }
      
      company2Map.delete(company1Item.transactionNumber);
    }
  });

  onlyInCompany2.push(...Array.from(company2Map.values()));

  console.log('Analysis results:');
  console.log('Perfect matches:', perfectMatches.length);
  console.log('Mismatches:', mismatches.length);
  console.log('Only in Company 1:', onlyInCompany1.length);
  console.log('Only in Company 2:', onlyInCompany2.length);

  return {
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
};

// Test endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Ledger matching service is running' });
});

// Handle file upload and matching
app.post('/match', upload.fields([
  { name: 'file1', maxCount: 1 },
  { name: 'file2', maxCount: 1 }
]), async (req, res) => {
  try {
    if (!req.files || !req.files.file1 || !req.files.file2) {
      console.log('Missing files in request:', req.files);
      return res.status(400).json({ error: 'Both files are required' });
    }

    const dateFormat1 = req.body.dateFormat1 || 'YYYY-MM-DD';
    const dateFormat2 = req.body.dateFormat2 || 'YYYY-MM-DD';

    console.log('Files received:');
    console.log('File 1:', req.files.file1[0].originalname);
    console.log('File 2:', req.files.file2[0].originalname);
    console.log('Date formats:', { format1: dateFormat1, format2: dateFormat2 });

    const company1Data = await parseCSV(req.files.file1[0].path, dateFormat1);
    const company2Data = await parseCSV(req.files.file2[0].path, dateFormat2);

    console.log('Sample data after parsing:');
    console.log('Company 1 first row:', company1Data[0]);
    console.log('Company 2 first row:', company2Data[0]);

    const results = analyzeTransactions(company1Data, company2Data);

    fs.unlinkSync(req.files.file1[0].path);
    fs.unlinkSync(req.files.file2[0].path);

    console.log('Sending response to client');
    res.json(results);
  } catch (error) {
    console.error('Error processing files:', error);
    res.status(500).json({ error: error.message });
  }
});

// Modified server startup
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

const server = app.listen(PORT, HOST, (error) => {
  if (error) {
    console.error('Error starting server:', error);
    return;
  }
  console.log(`Server running on http://${HOST}:${PORT}`);
  console.log('Ready to process CSV files');
});

// Add error handler for the server
server.on('error', (error) => {
  console.error('Server error:', error);
});

// Add graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  server.close(() => {
    console.log('Server shut down complete');
    process.exit(0);
  });
});