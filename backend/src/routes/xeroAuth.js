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

// Initial Xero connection route
router.get('/xero', async (req, res) => {
  try {
    const consentUrl = await xero.buildConsentUrl();
    res.json({ url: consentUrl });
  } catch (error) {
    console.error('Error generating consent URL:', error);
    res.status(500).json({
      error: 'Failed to initialize Xero connection',
      details: error.message
    });
  }
});

// Xero OAuth callback route
router.get('/xero/callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      throw new Error('No authorization code received');
    }

    // Exchange the code for tokens
    const tokenSet = await xero.apiCallback(code);
    
    // Store the tokens (implementation depends on your storage solution)
    // For now, we'll store in memory
    global.xeroTokens = {
      ...tokenSet,
      expires_at: Date.now() + (30 * 60 * 1000) // 30 minutes
    };

    // Redirect back to the frontend
    res.redirect(process.env.FRONTEND_URL || 'https://ledger-match.vercel.app');
  } catch (error) {
    console.error('Error in Xero callback:', error);
    res.status(500).json({
      error: 'Failed to complete Xero authentication',
      details: error.message
    });
  }
});

// The rest of your existing routes...

export default router;
