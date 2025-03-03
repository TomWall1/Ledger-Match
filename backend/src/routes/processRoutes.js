import express from 'express';
import multer from 'multer';
import Papa from 'papaparse';
import iconv from 'iconv-lite';
import fetch from 'node-fetch';
import { matchRecords } from '../utils/matching.js';
import { tokenStore } from '../utils/tokenStore.js';

export const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Helper function to fetch historical invoice data from Xero
async function fetchHistoricalInvoiceData() {
  try {
    // Get valid tokens
    const tokens = await tokenStore.getValidTokens();
    if (!tokens) {
      console.log('No Xero tokens available, skipping historical data fetch');
      return [];
    }

    const apiUrl = process.env.API_URL || 'https://ledger-match-backend.onrender.com';
    const response = await fetch(`${apiUrl}/auth/xero/historical-invoices`, {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch historical invoice data:', response.status);
      return [];
    }

    const data = await response.json();
    return data.invoices || [];
  } catch (error) {
    console.error('Error fetching historical invoice data:', error);
    return [];
  }
}

router.post('/api/match', upload.fields([
  { name: 'company1File', maxCount: 1 },
  { name: 'company2File', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('Received files:', req.files);
    console.log('Received body:', req.body);

    let company1Data;
    let company2Data;
    let useHistoricalData = req.body.useHistoricalData === 'true';

    // Handle Company 1 data (either from file or Xero)
    if (req.files.company1File) {
      const company1Buffer = req.files.company1File[0].buffer;
      const company1Csv = iconv.decode(company1Buffer, 'utf-8');
      
      // Improved CSV parsing with dynamic typing and trimming
      const company1ParseResult = Papa.parse(company1Csv, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,  // Convert numbers and booleans
        transformHeader: header => header.trim().toLowerCase(),
        transform: function(value, field) {
          // Trim all values
          if (typeof value === 'string') {
            return value.trim();
          }
          return value;
        }
      });
      
      company1Data = company1ParseResult.data;
      console.log('Parsed company1 data sample:', company1Data.slice(0, 2));
    } else if (req.body.company1Data) {
      company1Data = JSON.parse(req.body.company1Data);
      // If data is from Xero, automatically enable historical data usage
      useHistoricalData = true;
    } else {
      throw new Error('No Company 1 data provided');
    }

    // Process Company 2 data
    const company2Buffer = req.files.company2File[0].buffer;
    const company2Csv = iconv.decode(company2Buffer, 'utf-8');
    
    // Improved CSV parsing with dynamic typing and trimming
    const company2ParseResult = Papa.parse(company2Csv, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,  // Convert numbers and booleans
      transformHeader: header => header.trim().toLowerCase(),
      transform: function(value, field) {
        // Trim all values
        if (typeof value === 'string') {
          return value.trim();
        }
        return value;
      }
    });
    
    company2Data = company2ParseResult.data;
    console.log('Parsed company2 data sample:', company2Data.slice(0, 2));

    // Get date formats from request
    const dateFormat1 = req.body.dateFormat1 || 'MM/DD/YYYY';
    const dateFormat2 = req.body.dateFormat2 || 'MM/DD/YYYY';

    // Fetch historical data if using Xero integration and historical data is enabled
    let historicalData = [];
    if (useHistoricalData) {
      console.log('Fetching historical invoice data for enhanced matching...');
      historicalData = await fetchHistoricalInvoiceData();
      console.log(`Retrieved ${historicalData.length} historical invoices for matching`);
    }

    // Process the records with historical data if available
    const matchResults = await matchRecords(
      company1Data, 
      company2Data, 
      dateFormat1, 
      dateFormat2,
      historicalData
    );

    res.json(matchResults);
  } catch (error) {
    console.error('Error processing match request:', error);
    res.status(500).json({
      error: error.message || 'Error processing files',
      details: error.stack
    });
  }
});

router.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
