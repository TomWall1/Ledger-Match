import express from 'express';
import { xeroClient } from '../config/xero.js';
const router = express.Router();

// Add this new route for initiating Xero OAuth flow
router.post('/xero/callback', async (req, res) => {
  try {
    console.log('Initiating Xero OAuth flow...');
    const consentUrl = await xeroClient.buildConsentUrl();
    console.log('Generated consent URL:', consentUrl);
    
    res.header('Access-Control-Allow-Origin', 'https://ledger-match.vercel.app');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    res.json({ url: consentUrl });
  } catch (error) {
    console.error('Error generating Xero consent URL:', error);
    res.status(500).json({ 
      error: 'Failed to generate authorization URL',
      details: error.message 
    });
  }
});

// Handle OAuth callback
router.post('/xero/callback', async (req, res) => {
  // ... rest of your callback code ...
});

// ... rest of your routes ...

export default router;
