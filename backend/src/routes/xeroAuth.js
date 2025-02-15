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
    console.log('Received callback with body:', req.body);
    const { code } = req.body;

    if (!code) {
      throw new Error('No authorization code received');
    }

    try {
      // Use apiCallback instead of getTokenSet
      console.log('Exchanging code for token...');
      const tokenSet = await xeroClient.apiCallback(code);
      console.log('Token exchange response received');

      // Get connected tenants
      console.log('Updating tenants...');
      const tenants = await xeroClient.updateTenants();
      console.log('Got tenants:', tenants);

      res.json({ 
        success: true,
        tenants: tenants
      });
    } catch (tokenError) {
      console.error('Token exchange error details:', tokenError);
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

router.get('/verify', async (req, res) => {
  try {
    const tenants = await xeroClient.updateTenants();
    res.json({ authenticated: true });
  } catch (error) {
    res.status(401).json({ authenticated: false });
  }
});

export default router;
