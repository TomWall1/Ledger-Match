import express from 'express';
import { xeroClient, getState } from '../config/xero.js';

const router = express.Router();

router.get('/xero', async (req, res) => {
  try {
    console.log('Initiating Xero OAuth flow...');
    const state = getState();
    const consentUrl = await xeroClient.buildConsentUrl();
    console.log('Generated URL:', consentUrl);
    res.json({ url: consentUrl, state });
  } catch (error) {
    console.error('Error generating URL:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/xero/callback', async (req, res) => {
  try {
    const { code } = req.body;
    console.log('Received callback with code:', code);

    if (!code) {
      throw new Error('No authorization code received');
    }

    try {
      // Create token request parameters
      const tokenParams = {
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.XERO_REDIRECT_URI
      };

      console.log('Attempting token exchange with params:', {
        ...tokenParams,
        client_id: process.env.XERO_CLIENT_ID ? 'Present' : 'Missing'
      });

      // Exchange code for tokens
      const tokenSet = await xeroClient.getTokenSet(code);
      console.log('Token exchange response:', !!tokenSet);

      if (!tokenSet) {
        throw new Error('No token response received');
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
