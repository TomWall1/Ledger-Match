import express from 'express';
import { xeroClient } from '../config/xero.js';
const router = express.Router();

// Initial connection route - matches /auth/xero
router.get('/xero', async (req, res) => {
  try {
    console.log('Initiating Xero OAuth flow...');
    const consentUrl = await xeroClient.buildConsentUrl();
    console.log('Generated consent URL:', consentUrl);
    
    // Send the consent URL back to the frontend
    res.json({ url: consentUrl });
  } catch (error) {
    console.error('Error generating Xero consent URL:', error);
    res.status(500).json({ 
      error: 'Failed to generate authorization URL',
      details: error.message 
    });
  }
});

// Callback route - matches /auth/xero/callback
router.post('/xero/callback', async (req, res) => {
  try {
    console.log('Received callback with body:', req.body);
    const { code } = req.body;
    
    if (!code) {
      throw new Error('No authorization code received from Xero');
    }

    console.log('Exchanging auth code for tokens with config:', {
      clientId: process.env.XERO_CLIENT_ID ? 'Set' : 'Missing',
      clientSecret: process.env.XERO_CLIENT_SECRET ? 'Set' : 'Missing',
      redirectUri: process.env.XERO_REDIRECT_URI
    });

    const tokenSet = await xeroClient.apiCallback(code);
    console.log('Token response received:', tokenSet ? 'Success' : 'Failed');
    
    if (!tokenSet) {
      throw new Error('Failed to obtain access token from Xero');
    }

    console.log('Successfully obtained Xero tokens');
    res.json({ success: true });
  } catch (error) {
    console.error('Detailed error in Xero callback:', error);
    res.status(500).json({ 
      error: 'Failed to process Xero callback',
      details: error.message
    });
  }
});

// Organizations route - matches /auth/xero/organizations
router.get('/xero/organizations', async (req, res) => {
  try {
    const tenants = await xeroClient.updateTenants();
    res.json({ organizations: tenants });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({ 
      error: 'Failed to fetch organizations',
      details: error.message 
    });
  }
});

export default router;
