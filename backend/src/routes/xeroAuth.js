import express from 'express';
import { xeroClient } from '../config/xero.js';

const router = express.Router();

// Initiate Xero OAuth flow at /auth/xero
router.get('/xero', async (req, res) => {
  try {
    console.log('Initiating Xero OAuth flow...', {
      clientId: process.env.XERO_CLIENT_ID ? 'Set' : 'Missing',
      clientSecret: process.env.XERO_CLIENT_SECRET ? 'Set' : 'Missing',
      redirectUri: process.env.XERO_REDIRECT_URI,
      scopes: process.env.XERO_SCOPES
    });

    // Ensure required environment variables are set
    if (!process.env.XERO_CLIENT_ID || !process.env.XERO_CLIENT_SECRET) {
      throw new Error('Missing required Xero credentials');
    }

    const consentUrl = await xeroClient.buildConsentUrl();
    console.log('Generated consent URL:', consentUrl);

    // Add CORS headers explicitly
    res.header('Access-Control-Allow-Origin', 'https://ledger-match.vercel.app');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    res.json({ url: consentUrl });
  } catch (error) {
    console.error('Error in /auth/xero:', error);
    
    // Add CORS headers even for error responses
    res.header('Access-Control-Allow-Origin', 'https://ledger-match.vercel.app');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    res.status(500).json({ 
      error: 'Failed to generate authorization URL',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Handle OAuth callback at /auth/xero/callback
router.get('/xero/callback', async (req, res) => {
  try {
    console.log('Received callback from Xero');
    const { code } = req.query;
    
    if (!code) {
      throw new Error('No authorization code received from Xero');
    }

    console.log('Exchanging auth code for tokens...');
    const tokenSet = await xeroClient.apiCallback(code);
    
    console.log('Successfully obtained Xero tokens');
    
    res.redirect(`${process.env.FRONTEND_URL}/xero-connected`);
  } catch (error) {
    console.error('Error in Xero callback:', error);
    res.redirect(`${process.env.FRONTEND_URL}/xero-error?message=${encodeURIComponent(error.message)}`);
  }
});

// Get connected Xero organizations
router.get('/xero/organizations', async (req, res) => {
  try {
    const tenants = await xeroClient.updateTenants();
    
    // Add CORS headers
    res.header('Access-Control-Allow-Origin', 'https://ledger-match.vercel.app');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    res.json({ organizations: tenants });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    
    // Add CORS headers for error responses
    res.header('Access-Control-Allow-Origin', 'https://ledger-match.vercel.app');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    res.status(500).json({ 
      error: 'Failed to fetch organizations',
      details: error.message 
    });
  }
});

// Add OPTIONS handler for CORS preflight
router.options('/xero', (req, res) => {
  res.header('Access-Control-Allow-Origin', 'https://ledger-match.vercel.app');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(200);
});

export default router;
