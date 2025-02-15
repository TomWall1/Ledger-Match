import express from 'express';
import { XeroClient } from 'xero-node';
import fetch from 'node-fetch';

const router = express.Router();

// Create the xero client
const xero = new XeroClient({
  clientId: process.env.XERO_CLIENT_ID,
  clientSecret: process.env.XERO_CLIENT_SECRET,
  redirectUris: [process.env.XERO_REDIRECT_URI],
  scopes: ['offline_access', 'accounting.transactions.read', 'accounting.contacts.read'],
  state: 'your-state-here',
  httpTimeout: 30000 // 30 second timeout
});

// Log configuration at startup
console.log('Xero client configuration:', {
  clientId: process.env.XERO_CLIENT_ID ? `${process.env.XERO_CLIENT_ID.substring(0, 4)}...` : 'Missing',
  clientSecret: process.env.XERO_CLIENT_SECRET ? 'Present' : 'Missing',
  redirectUri: process.env.XERO_REDIRECT_URI,
  hasXeroClient: !!xero
});

router.get('/xero', async (req, res) => {
  try {
    console.log('Starting OAuth flow...');
    const consentUrl = await xero.buildConsentUrl();
    console.log('Consent URL generated:', consentUrl);
    res.json({ url: consentUrl });
  } catch (error) {
    console.error('Error in /xero:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/xero/callback', async (req, res) => {
  console.log('Callback received:', {
    hasCode: !!req.body.code,
    clientId: process.env.XERO_CLIENT_ID ? 'Present' : 'Missing',
    clientSecret: process.env.XERO_CLIENT_SECRET ? 'Present' : 'Missing',
    redirectUri: process.env.XERO_REDIRECT_URI
  });

  try {
    const { code } = req.body;
    if (!code) {
      throw new Error('No authorization code received');
    }

    try {
      // Prepare the token request
      const tokenUrl = 'https://identity.xero.com/connect/token';
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.XERO_REDIRECT_URI
      });

      const auth = Buffer.from(
        `${process.env.XERO_CLIENT_ID}:${process.env.XERO_CLIENT_SECRET}`
      ).toString('base64');

      console.log('Making token request to:', tokenUrl);
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
      });

      const responseText = await response.text();
      console.log('Token response:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        body: responseText
      });

      if (!response.ok) {
        throw new Error(`Token request failed: ${response.status} ${responseText}`);
      }

      const tokenData = JSON.parse(responseText);
      if (!tokenData.access_token) {
        throw new Error('No access token in response');
      }

      console.log('Token data received:', {
        hasAccessToken: !!tokenData.access_token,
        hasRefreshToken: !!tokenData.refresh_token,
        expiresIn: tokenData.expires_in
      });

      // Save the tokens
      await xero.setTokenSet(tokenData);
      console.log('Token set saved');

      // Get the tenants
      const tenants = await xero.updateTenants();
      console.log('Tenants retrieved:', tenants?.length || 0);

      res.json({
        success: true,
        tenants: tenants || []
      });
    } catch (tokenError) {
      console.error('Token exchange error:', {
        message: tokenError.message,
        name: tokenError.name,
        stack: tokenError.stack,
        response: tokenError.response?.data
      });
      throw tokenError;
    }
  } catch (error) {
    console.error('Callback processing error:', {
      message: error.message,
      name: error.name,
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
