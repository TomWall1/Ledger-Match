import express from 'express';
import { XeroClient } from 'xero-node';

const router = express.Router();

router.get('/xero', async (req, res) => {
  try {
    console.log('Initiating Xero OAuth flow with config:', {
      clientId: process.env.XERO_CLIENT_ID ? 'Present' : 'Missing',
      clientSecret: process.env.XERO_CLIENT_SECRET ? 'Present' : 'Missing',
      redirectUri: process.env.XERO_REDIRECT_URI
    });

    const xero = new XeroClient({
      clientId: process.env.XERO_CLIENT_ID,
      clientSecret: process.env.XERO_CLIENT_SECRET,
      redirectUris: [process.env.XERO_REDIRECT_URI],
      scopes: ['offline_access', 'accounting.transactions.read', 'accounting.contacts.read']
    });

    const consentUrl = await xero.buildConsentUrl();
    console.log('Generated URL:', consentUrl);
    res.json({ url: consentUrl });
  } catch (error) {
    console.error('Error generating URL:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/xero/callback', async (req, res) => {
  console.log('Callback received:', {
    body: req.body,
    headers: req.headers,
    env: {
      clientId: process.env.XERO_CLIENT_ID ? 'Present' : 'Missing',
      clientSecret: process.env.XERO_CLIENT_SECRET ? 'Present' : 'Missing',
      redirectUri: process.env.XERO_REDIRECT_URI
    }
  });

  try {
    const { code } = req.body;
    if (!code) {
      throw new Error('No authorization code received');
    }

    try {
      const xero = new XeroClient({
        clientId: process.env.XERO_CLIENT_ID,
        clientSecret: process.env.XERO_CLIENT_SECRET,
        redirectUris: [process.env.XERO_REDIRECT_URI],
        scopes: ['offline_access', 'accounting.transactions.read', 'accounting.contacts.read']
      });

      console.log('Attempting token exchange using apiCallback...');
      const tokenSet = await xero.oauth2Client.grant({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.XERO_REDIRECT_URI
      });
      
      console.log('Token response:', {
        hasAccessToken: !!tokenSet?.access_token,
        hasRefreshToken: !!tokenSet?.refresh_token,
        expiresIn: tokenSet?.expires_in
      });

      if (!tokenSet?.access_token) {
        throw new Error('No access token received');
      }

      console.log('Setting token set...');
      await xero.setTokenSet(tokenSet);
      console.log('Token set successfully stored');

      const tenants = await xero.updateTenants(false);
      console.log('Tenants retrieved:', tenants?.length || 0);

      res.json({ 
        success: true,
        tenants: tenants || []
      });
    } catch (tokenError) {
      console.error('Token exchange error:', {
        message: tokenError.message,
        stack: tokenError.stack,
        response: tokenError.response?.data
      });
      throw tokenError;
    }
  } catch (error) {
    console.error('Callback processing error:', {
      message: error.message,
      stack: error.stack,
      type: error.constructor.name
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
    const xero = new XeroClient({
      clientId: process.env.XERO_CLIENT_ID,
      clientSecret: process.env.XERO_CLIENT_SECRET,
      redirectUris: [process.env.XERO_REDIRECT_URI],
      scopes: ['offline_access', 'accounting.transactions.read', 'accounting.contacts.read']
    });

    const tenants = await xero.updateTenants(false);
    res.json({ authenticated: true });
  } catch (error) {
    res.status(401).json({ authenticated: false });
  }
});

export default router;
