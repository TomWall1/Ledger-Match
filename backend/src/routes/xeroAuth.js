import express from 'express';
import { XeroClient } from 'xero-node';

const router = express.Router();

// Create the xero client
const xero = new XeroClient({
  clientId: process.env.XERO_CLIENT_ID,
  clientSecret: process.env.XERO_CLIENT_SECRET,
  redirectUris: [process.env.XERO_REDIRECT_URI],
  scopes: ['offline_access', 'accounting.transactions.read', 'accounting.contacts.read'],
  httpTimeout: 30000 // 30 second timeout
});

// Verify client configuration
console.log('Xero client initialized with:', {
  clientId: process.env.XERO_CLIENT_ID ? `${process.env.XERO_CLIENT_ID.substring(0, 4)}...` : 'Missing',
  clientSecret: process.env.XERO_CLIENT_SECRET ? `${process.env.XERO_CLIENT_SECRET.substring(0, 4)}...` : 'Missing',
  redirectUri: process.env.XERO_REDIRECT_URI
});

router.get('/xero', async (req, res) => {
  try {
    const consentUrl = await xero.buildConsentUrl();
    console.log('Generated consent URL');
    res.json({ url: consentUrl });
  } catch (error) {
    console.error('Error generating consent URL:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/xero/callback', async (req, res) => {
  console.log('Received callback request:', {
    code: req.body.code ? 'Present' : 'Missing'
  });

  try {
    const { code } = req.body;
    if (!code) {
      throw new Error('No authorization code received');
    }

    try {
      // Use the OAuth2 auth code grant to get tokens directly
      console.log('Requesting tokens...');
      const response = await fetch('https://identity.xero.com/connect/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${process.env.XERO_CLIENT_ID}:${process.env.XERO_CLIENT_SECRET}`).toString('base64')}`
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: process.env.XERO_REDIRECT_URI
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Token request failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(`Token request failed: ${response.status} ${errorData}`);
      }

      const tokenData = await response.json();
      console.log('Token response received:', {
        hasAccessToken: !!tokenData.access_token,
        hasRefreshToken: !!tokenData.refresh_token,
        expiresIn: tokenData.expires_in
      });

      // Set the token in the client
      await xero.setTokenSet(tokenData);
      console.log('Token set saved');

      // Get connections (tenants)
      const tenants = await xero.updateTenants();
      console.log('Retrieved tenants:', tenants?.length || 0);

      res.json({
        success: true,
        tenants: tenants || []
      });
    } catch (tokenError) {
      console.error('Token exchange error:', tokenError);
      throw tokenError;
    }
  } catch (error) {
    console.error('Callback processing error:', {
      name: error.name,
      message: error.message,
      status: error.status
    });
    res.status(500).json({
      error: 'Failed to process Xero callback',
      details: error.message,
      type: error.constructor.name
    });
  }
});

router.get('/verify', async (req, res) => {
  try {
    const tenants = await xero.updateTenants();
    res.json({ authenticated: true });
  } catch (error) {
    res.status(401).json({ authenticated: false });
  }
});

export default router;
