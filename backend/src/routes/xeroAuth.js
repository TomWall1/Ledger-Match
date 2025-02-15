import express from 'express';
import { XeroClient } from 'xero-node';

const router = express.Router();

const xero = new XeroClient({
  clientId: process.env.XERO_CLIENT_ID,
  clientSecret: process.env.XERO_CLIENT_SECRET,
  redirectUris: [process.env.XERO_REDIRECT_URI],
  scopes: ['offline_access', 'accounting.transactions.read', 'accounting.contacts.read']
});

router.get('/xero', async (req, res) => {
  try {
    console.log('Initiating Xero OAuth flow...');
    const consentUrl = await xero.buildConsentUrl();
    console.log('Generated URL:', consentUrl);
    res.json({ url: consentUrl });
  } catch (error) {
    console.error('Error generating URL:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/xero/callback', async (req, res) => {
  try {
    const { code } = req.body;
    console.log('Processing authorization code');

    if (!code) {
      throw new Error('No authorization code received');
    }

    try {
      // Get the redirectUri from env
      const redirectUri = process.env.XERO_REDIRECT_URI;
      if (!redirectUri) {
        throw new Error('Redirect URI not configured');
      }

      console.log('Starting authorization with:', {
        codePresent: !!code,
        redirectUri
      });

      // Exchange authorization code for tokens
      const tokenSet = await xero.authorize(code, redirectUri);
      console.log('Token exchange successful:', {
        hasAccessToken: !!tokenSet.access_token,
        hasRefreshToken: !!tokenSet.refresh_token,
        expiresIn: tokenSet.expires_in
      });

      // Store tokens
      await xero.setTokenSet(tokenSet);

      // Get tenants
      const tenants = await xero.updateTenants(false);
      console.log('Retrieved tenants:', tenants?.length || 0);

      res.json({ 
        success: true,
        tenants: tenants || []
      });
    } catch (tokenError) {
      console.error('Token exchange error:', tokenError);
      throw new Error('Token exchange failed: ' + tokenError.message);
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
    const tenants = await xero.updateTenants(false);
    res.json({ authenticated: true });
  } catch (error) {
    res.status(401).json({ authenticated: false });
  }
});

export default router;
