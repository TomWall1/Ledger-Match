import express from 'express';
import { xeroClient } from '../config/xero.js';

const router = express.Router();

// Initiate Xero OAuth flow at /auth/xero
router.get('/xero', async (req, res) => {
  try {
    console.log('Initiating Xero OAuth flow...');
    const consentUrl = await xeroClient.buildConsentUrl();
    console.log('Generated consent URL:', consentUrl);
    res.json({ url: consentUrl });
  } catch (error) {
    console.error('Error generating Xero consent URL:', error);
    res.status(500).json({ 
      error: 'Failed to generate authorization URL',
      details: error.message 
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
    
    // TODO: Store tokens securely in your database
    console.log('Successfully obtained Xero tokens');
    
    // Redirect to frontend success page
    res.redirect(`${process.env.FRONTEND_URL}/xero-connected`);
  } catch (error) {
    console.error('Error in Xero OAuth callback:', error);
    // Redirect to frontend error page
    res.redirect(`${process.env.FRONTEND_URL}/xero-error?message=${encodeURIComponent(error.message)}`);
  }
});

// Get connected Xero organizations
router.get('/xero/organizations', async (req, res) => {
  try {
    // TODO: Get tokens from your secure storage
    const tenants = await xeroClient.updateTenants();
    res.json({ organizations: tenants });
  } catch (error) {
    console.error('Error fetching Xero organizations:', error);
    res.status(500).json({ 
      error: 'Failed to fetch organizations',
      details: error.message 
    });
  }
});

export default router;
