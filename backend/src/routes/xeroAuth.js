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
      console.log('Starting token exchange process...');
      
      // Get initial tokens
      const accessToken = await xeroClient.oauth2Client.getAccessToken({
        code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.XERO_REDIRECT_URI
      });
      
      console.log('Access token received:', !!accessToken);

      if (!accessToken) {
        throw new Error('Failed to get access token');
      }

      // Get connected tenants
      console.log('Getting tenants...');
      const tenants = await xeroClient.updateTenants();
      console.log('Tenants received:', tenants);

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
      details: error.message,
      stack: error.stack
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
