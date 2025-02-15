import express from 'express';
import { XeroClient } from 'xero-node';
import { xeroClient } from '../config/xero.js';

const router = express.Router();

// Add credential verification endpoint
router.get('/verify-credentials', (req, res) => {
  const clientId = process.env.XERO_CLIENT_ID;
  const clientSecret = process.env.XERO_CLIENT_SECRET;
  const redirectUri = process.env.XERO_REDIRECT_URI;

  // Only show first/last 4 characters of secret
  const maskedSecret = clientSecret ? 
    `${clientSecret.substring(0, 4)}...${clientSecret.substring(clientSecret.length - 4)}` : 
    'Not set';

  res.json({
    credentials: {
      clientId: clientId || 'Not set',
      clientSecret: maskedSecret,
      redirectUri: redirectUri || 'Not set'
    },
    expectedValues: {
      clientId: '1115F9C9FB2044418FCF3CB4A5AB2503',
      redirectUri: 'https://ledger-match.vercel.app/auth/xero/callback'
    }
  });
});

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
      console.log('Using credentials:', {
        clientId: process.env.XERO_CLIENT_ID ? 'Set' : 'Missing',
        clientSecret: process.env.XERO_CLIENT_SECRET ? 'Starts with: ' + process.env.XERO_CLIENT_SECRET.substring(0, 4) : 'Missing',
        redirectUri: process.env.XERO_REDIRECT_URI
      });
      
      // Create a new client instance for token exchange
      const tokenClient = new XeroClient({
        clientId: process.env.XERO_CLIENT_ID,
        clientSecret: process.env.XERO_CLIENT_SECRET,
        redirectUris: [process.env.XERO_REDIRECT_URI],
        scopes: ['offline_access', 'accounting.transactions.read', 'accounting.contacts.read']
      });

      // Exchange the code for tokens
      const response = await tokenClient.apiCallback(code);
      console.log('Token exchange response received:', {
        success: !!response,
        hasAccessToken: !!response?.accessToken,
        hasRefreshToken: !!response?.refreshToken,
        hasExpiry: !!response?.expires_in
      });

      if (!response) {
        throw new Error('No response from token exchange');
      }

      // Get connected tenants
      console.log('Getting tenants...');
      const tenants = await tokenClient.updateTenants();
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
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
