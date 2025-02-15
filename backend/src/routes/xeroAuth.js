import express from 'express';
import { XeroClient } from 'xero-node';

const router = express.Router();

// Create a single instance of XeroClient
const xero = new XeroClient({
  clientId: process.env.XERO_CLIENT_ID,
  clientSecret: process.env.XERO_CLIENT_SECRET,
  redirectUris: [process.env.XERO_REDIRECT_URI],
  scopes: ['offline_access', 'accounting.transactions.read', 'accounting.contacts.read']
});

router.get('/xero', async (req, res) => {
  try {
    console.log('Building consent URL with config:', {
      clientId: process.env.XERO_CLIENT_ID ? 'Present' : 'Missing',
      clientSecret: process.env.XERO_CLIENT_SECRET ? 'Present' : 'Missing',
      redirectUri: process.env.XERO_REDIRECT_URI
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
  console.log('Callback received with code:', {
    body: req.body,
    code: req.body.code ? 'Present' : 'Missing'
  });

  try {
    const { code } = req.body;
    if (!code) {
      throw new Error('No authorization code received');
    }

    try {
      // Get token set
      console.log('Starting token exchange...');
      const tokenSet = await xero.getTokenSetFromAuthorizationCode(code);
      
      console.log('Token exchange result:', {
        hasAccessToken: !!tokenSet?.access_token,
        hasRefreshToken: !!tokenSet?.refresh_token,
        expiresIn: tokenSet?.expires_in
      });

      if (!tokenSet?.access_token) {
        throw new Error('No access token received');
      }

      // Save the token set
      await xero.setTokenSet(tokenSet);
      console.log('Token set saved');

      // Get tenants
      const tenants = await xero.updateTenants();
      console.log('Tenants retrieved:', tenants?.length || 0);

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
      throw new Error(`Token exchange failed: ${tokenError.message}`);
    }
  } catch (error) {
    console.error('Callback error:', {
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
    const tenants = await xero.updateTenants();
    res.json({ authenticated: true });
  } catch (error) {
    res.status(401).json({ authenticated: false });
  }
});

export default router;
