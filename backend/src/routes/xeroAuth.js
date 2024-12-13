import express from 'express';
import { xeroClient } from '../config/xero.js';

const router = express.Router();

router.get('/xero', async (req, res) => {
  try {
    console.log('Initiating Xero OAuth flow...');
    const consentUrl = await xeroClient.buildConsentUrl();
    console.log('Generated URL:', consentUrl);
    res.json({ url: consentUrl });
  } catch (error) {
    console.error('Error generating URL:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/xero/callback', async (req, res) => {
  try {
    const { code } = req.body;
    console.log('Received auth code:', code);

    if (!code) {
      throw new Error('No authorization code received');
    }

    // Try direct token exchange
    const response = await xeroClient.oauth2Client.getToken({
      code,
      grant_type: 'authorization_code',
      redirect_uri: process.env.XERO_REDIRECT_URI
    });

    console.log('Token response:', response ? 'Success' : 'Failed');

    if (!response || !response.token) {
      throw new Error('Failed to exchange token');
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Callback error:', error);
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

// Single export at the end
export default router;
