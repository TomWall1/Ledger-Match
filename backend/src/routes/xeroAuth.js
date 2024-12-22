import express from 'express';
import { xeroClient } from '../config/xero.js';

const router = express.Router();

router.get('/xero', async (req, res) => {
  try {
    console.log('Initiating Xero OAuth flow...');
    const state = new Date().getTime().toString();
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
    const { code, state } = req.body;
    console.log('Received callback data:', { code, state });

    if (!code) {
      throw new Error('No authorization code received');
    }

    try {
      const tokenSet = await xeroClient.apiCallback(code, state);  // Pass both code and state
      console.log('Token exchange response:', !!tokenSet);

      if (!tokenSet) {
        throw new Error('Token exchange failed');
      }

      res.json({ success: true });
    } catch (tokenError) {
      console.error('Token exchange error:', tokenError);
      throw new Error(`Token exchange failed: ${tokenError.message}`);
    }
  } catch (error) {
    console.error('Callback error:', error);
    res.status(500).json({ 
      error: 'Failed to process Xero callback',
      details: error.message 
    });
  }
});

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
