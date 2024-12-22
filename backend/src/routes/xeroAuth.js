import express from 'express';
import { xeroClient } from '../config/xero.js';

const router = express.Router();

// This is the /xero route that gets called when users click "Connect to Xero"
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

// This is the callback route that Xero calls after user authorizes
router.post('/xero/callback', async (req, res) => {
  try {
    // Debug: Log everything we receive
    console.log('Full request:', {
      body: req.body,
      query: req.query,
      headers: {
        host: req.headers.host,
        origin: req.headers.origin,
        referer: req.headers.referer
      }
    });

    const { code } = req.body;
    console.log('Processing code:', code);

    if (!code) {
      throw new Error('No authorization code received');
    }

    try {
      // Use apiCallback directly
      const tokenSet = await xeroClient.apiCallback(code);
      console.log('Token exchange successful:', !!tokenSet);

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

// This gets the list of Xero organizations
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
