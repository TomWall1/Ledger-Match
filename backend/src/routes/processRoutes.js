import express from 'express';
import multer from 'multer';
import Papa from 'papaparse';
import iconv from 'iconv-lite';
import { matchRecords } from '../utils/matching.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/api/match', upload.fields([
  { name: 'company1File', maxCount: 1 },
  { name: 'company2File', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('Received files:', req.files);
    console.log('Received body:', req.body);

    let company1Data;
    let company2Data;

    // Handle Company 1 data (either from file or Xero)
    if (req.files.company1File) {
      const company1Buffer = req.files.company1File[0].buffer;
      const company1Csv = iconv.decode(company1Buffer, 'utf-8');
      const company1ParseResult = Papa.parse(company1Csv, {
        header: true,
        skipEmptyLines: true,
        transformHeader: header => header.trim().toLowerCase()
      });
      company1Data = company1ParseResult.data;
    } else if (req.body.company1Data) {
      company1Data = JSON.parse(req.body.company1Data);
    } else {
      throw new Error('No Company 1 data provided');
    }

    // Process Company 2 data
    const company2Buffer = req.files.company2File[0].buffer;
    const company2Csv = iconv.decode(company2Buffer, 'utf-8');
    const company2ParseResult = Papa.parse(company2Csv, {
      header: true,
      skipEmptyLines: true,
      transformHeader: header => header.trim().toLowerCase()
    });
    company2Data = company2ParseResult.data;

    // Get date formats from request
    const dateFormat1 = req.body.dateFormat1 || 'MM/DD/YYYY';
    const dateFormat2 = req.body.dateFormat2 || 'MM/DD/YYYY';

    // Process the records
    const matchResults = await matchRecords(company1Data, company2Data, dateFormat1, dateFormat2);

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

export { router as default };
