import express from 'express';
import { xeroClient, getState } from '../config/xero.js';

const router = express.Router();

router.get('/xero', async (req, res) => {
  try {
    console.log('Initiating Xero OAuth flow...');
    const state = getState();
    const consentUrl = await xeroClient.buildConsentUrl({ state });
    console.log('Generated URL:', consentUrl);
    res.json({ url: consentUrl, state });
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

    const tokenSet = await xeroClient.apiCallback(code, { state });
    console.log('Token exchange successful');

    res.json({ success: true });
  } catch (error) {
    console.error('Callback error:', error);
    res.status(500).json({ 
      error: 'Failed to process Xero callback',
      details: error.message 
    });
  }
});

// [rest of your routes stay the same]

export default router;

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
