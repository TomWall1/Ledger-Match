import express from 'express';
import { XeroClient } from 'xero-node';
import fetch from 'node-fetch';
import crypto from 'crypto';

const router = express.Router();
const pendingStates = new Set();

// Create the xero client
const xero = new XeroClient({
  clientId: process.env.XERO_CLIENT_ID,
  clientSecret: process.env.XERO_CLIENT_SECRET,
  redirectUris: [process.env.XERO_REDIRECT_URI || 'https://ledger-match-backend.onrender.com/auth/xero/callback'],
  scopes: ['offline_access', 'accounting.transactions.read', 'accounting.contacts.read'],
  httpTimeout: 30000
});

// Initial Xero connection route
router.get('/xero', async (req, res) => {
  try {
    const state = crypto.randomBytes(16).toString('hex');
    pendingStates.add(state);
    
    const consentUrl = await xero.buildConsentUrl();
    const url = new URL(consentUrl);
    url.searchParams.set('state', state);
    
    console.log('Generated consent URL:', { url: url.toString(), state });
    res.json({ url: url.toString() });
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
  console.log('Received callback with query params:', req.query);
  try {
    const { code, state } = req.query;
    if (!code) throw new Error('No authorization code received');
    if (!state || !pendingStates.has(state)) throw new Error('Invalid state parameter');

    pendingStates.delete(state);

    // Exchange code for tokens
    const frontendUrl = process.env.FRONTEND_URL || 'https://ledger-match.vercel.app';
    const tokens = await xero.apiCallback(code);

    // Store tokens
    global.xeroTokens = {
      ...tokens,
      expires_at: Date.now() + (tokens.expires_in * 1000)
    };

    res.redirect(`${frontendUrl}?authenticated=true`);
  } catch (error) {
    console.error('Error in Xero callback:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'https://ledger-match.vercel.app';
    res.redirect(`${frontendUrl}?error=${encodeURIComponent(error.message)}`);
  }
});

export default router;