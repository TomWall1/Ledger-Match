const express = require('express');
const cors = require('cors');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const { XeroClient } = require('xero-node');
require('dotenv').config();

const app = express();

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Enable CORS with specific options
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3003',
    'http://localhost:3005',
    'https://ledger-match.vercel.app',
    'https://ledger-match-git-main-tomwall1.vercel.app',
    'https://ledger-match-9knq3j55o-toms-projects-c3abf80c.vercel.app',
    'https://ledger-match-5y3c9ltn2-toms-projects-c3abf80c.vercel.app'
  ],
  methods: ['POST', 'GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept'],
  credentials: false
}));

app.use(express.json());

// Initialize Xero client
const xero = new XeroClient({
  clientId: process.env.XERO_CLIENT_ID,
  clientSecret: process.env.XERO_CLIENT_SECRET,
  redirectUris: [process.env.XERO_REDIRECT_URI],
  scopes: ['accounting.transactions.read', 'accounting.contacts.read']
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

// Root endpoint
app.get('/', (req, res) => {
  res.json({ status: 'API is running' });
});

// Xero configuration endpoint
app.get('/api/xero/config', (req, res) => {
  res.json({
    clientId: process.env.XERO_CLIENT_ID ? '✓ Set' : '✗ Missing',
    clientSecret: process.env.XERO_CLIENT_SECRET ? '✓ Set' : '✗ Missing',
    redirectUri: process.env.XERO_REDIRECT_URI,
  });
});

// Xero authentication URL endpoint
app.get('/api/xero/auth-url', async (req, res) => {
  try {
    console.log('Generating Xero consent URL');
    const consentUrl = await xero.buildConsentUrl();
    console.log('Consent URL generated:', consentUrl);
    res.json({ url: consentUrl });
  } catch (error) {
    console.error('Error generating consent URL:', error);
    res.status(500).json({ error: error.message });
  }
});

// Xero callback endpoint
app.post('/api/xero/callback', async (req, res) => {
  try {
    const { code } = req.body;
    await xero.apiCallback(code);
    res.json({ success: true });
  } catch (error) {
    console.error('Error in Xero callback:', error);
    res.status(500).json({ error: error.message });
  }
});

// Xero invoices endpoint
app.get('/api/xero/invoices/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const invoices = await xero.accountingApi.getInvoices(tenantId);
    res.json(invoices.body);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: error.message });
  }
});

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

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Environment:', {
    clientId: process.env.XERO_CLIENT_ID ? '✓ Set' : '✗ Missing',
    clientSecret: process.env.XERO_CLIENT_SECRET ? '✓ Set' : '✗ Missing',
    redirectUri: process.env.XERO_REDIRECT_URI,
  });
});
