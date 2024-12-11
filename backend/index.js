import express from 'express';
import cors from 'cors';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import dotenv from 'dotenv';
import xeroRoutes from './src/routes/xeroAuth.js';

dotenv.config();

const app = express();

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Enable CORS with specific options
app.use(cors({
  origin: 'https://ledger-match.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  credentials: false
}));

// Handle OPTIONS preflight requests
app.options('*', cors());

// Add headers middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://ledger-match.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'false');
  next();
});

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount the Xero auth routes
app.use('/auth', xeroRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({ status: 'API is running' });
});

// Test endpoints
app.get('/test-cors', (req, res) => {
  res.json({ 
    message: 'CORS is working',
    origin: req.headers.origin || 'No origin header',
    method: req.method,
    headers: req.headers
  });
});

app.get('/auth/test', (req, res) => {
  res.json({ 
    status: 'Xero routes accessible',
    cors: 'enabled',
    env: {
      clientId: process.env.XERO_CLIENT_ID ? '✓ Set' : '✗ Missing',
      clientSecret: process.env.XERO_CLIENT_SECRET ? '✓ Set' : '✗ Missing',
      redirectUri: process.env.XERO_REDIRECT_URI,
      frontend: process.env.FRONTEND_URL
    }
  });
});

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

// Function to parse CSV file
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

// Function to analyze and match transactions
const analyzeTransactions = (company1Data, company2Data) => {
  console.log('Starting transaction analysis');
  
  const company1Total = company1Data
    .filter(t => t.status === 'Open')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const company2Total = company2Data
    .filter(t => t.status === 'Open')
    .reduce((sum, t) => sum + t.amount, 0);

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
      onlyInCompany1.push(company1Item);
    } else {
      const amount1 = parseFloat(company1Item.amount.toFixed(2));
      const amount2 = parseFloat(company2Item.amount.toFixed(2));
      
      const isExactMatch = 
        amount1 === amount2 &&
        company1Item.date === company2Item.date &&
        company1Item.status === company2Item.status &&
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
            status: company1Item.status !== company2Item.status,
            type: company1Item.type !== company2Item.type
          }
        });
      }
      
      company2Map.delete(company1Item.transactionNumber);
    }
  });

  onlyInCompany2.push(...Array.from(company2Map.values()));

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

// CSV matching endpoint
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

    // Clean up uploaded files
    fs.unlinkSync(req.files.file1[0].path);
    fs.unlinkSync(req.files.file2[0].path);

    console.log('Sending response to client');
    res.json(results);
  } catch (error) {
    console.error('Error processing files:', error);
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Environment:', {
    node_env: process.env.NODE_ENV,
    clientId: process.env.XERO_CLIENT_ID ? '✓ Set' : '✗ Missing',
    clientSecret: process.env.XERO_CLIENT_SECRET ? '✓ Set' : '✗ Missing',
    redirectUri: process.env.XERO_REDIRECT_URI,
    frontend: process.env.FRONTEND_URL
  });
});

// Add unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
