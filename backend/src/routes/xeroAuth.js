import express from 'express';
import { XeroClient } from 'xero-node';

const router = express.Router();

// Helper function to create Xero client
const createXeroClient = () => {
  const config = {
    clientId: process.env.XERO_CLIENT_ID,
    clientSecret: process.env.XERO_CLIENT_SECRET,
    redirectUris: [process.env.XERO_REDIRECT_URI],
    scopes: ['offline_access', 'accounting.transactions.read', 'accounting.contacts.read'],
    state: 'xero-auth'
  };

  console.log('Creating Xero client with config:', {
    clientId: config.clientId ? 'Present' : 'Missing',
    clientSecret: config.clientSecret ? 'Present' : 'Missing',
    redirectUri: config.redirectUris[0],
    scopes: config.scopes
  });

  return new XeroClient(config);
};

router.get('/xero', async (req, res) => {
  try {
    const xero = createXeroClient();
    console.log('Building consent URL...');
    const consentUrl = await xero.buildConsentUrl();
    console.log('Generated URL:', consentUrl);
    res.json({ url: consentUrl });
  } catch (error) {
    console.error('Error generating consent URL:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/xero/callback', async (req, res) => {
  try {
    console.log('Callback received:', req.body);
    const { code } = req.body;

    if (!code) {
      console.error('No authorization code in request');
      throw new Error('No authorization code received');
    }

    try {
      const xero = createXeroClient();
      console.log('Exchanging code for token...');

      // First try to initialize the client
      await xero.initialize();
      console.log('Client initialized');

      // Then use apiCallback
      const tokens = await xero.apiCallback(code);
      console.log('Token exchange complete', {
        hasAccessToken: !!tokens?.access_token,
        hasRefreshToken: !!tokens?.refresh_token,
        expiresIn: tokens?.expires_in
      });

      if (!tokens?.access_token) {
        throw new Error('No access token in response');
      }

      // Set the token
      await xero.setTokenSet(tokens);
      console.log('Token set in client');

      // Test the connection by getting tenants
      const tenants = await xero.updateTenants();
      console.log('Retrieved tenants:', tenants?.length || 0);

      res.json({ 
        success: true,
        tenants: tenants || []
      });
    } catch (tokenError) {
      console.error('Token exchange error:', {
        name: tokenError.name,
        message: tokenError.message,
        response: tokenError.response?.data,
        stack: tokenError.stack
      });
      throw tokenError;
    }
  } catch (error) {
    console.error('Callback processing error:', {
      name: error.name,
      message: error.message,
      stack: error.stack
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
    const xero = createXeroClient();
    const tenants = await xero.updateTenants();
    res.json({ authenticated: true });
  } catch (error) {
    res.status(401).json({ authenticated: false });
  }
});

export default router;
