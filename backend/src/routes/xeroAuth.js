import express from 'express';
import { XeroClient } from 'xero-node';
import fetch from 'node-fetch';
import crypto from 'crypto';

const router = express.Router();

// Store states in memory (should use a proper database in production)
const pendingStates = new Set();

console.log('Starting Xero configuration with:', {
  clientId: process.env.XERO_CLIENT_ID ? '✓ Set' : '✗ Missing',
  clientSecret: process.env.XERO_CLIENT_SECRET ? '✓ Set' : '✗ Missing',
  redirectUri: process.env.XERO_REDIRECT_URI,
  frontendUrl: process.env.FRONTEND_URL
});

// Create the xero client
const xero = new XeroClient({
  clientId: process.env.XERO_CLIENT_ID,
  clientSecret: process.env.XERO_CLIENT_SECRET,
  redirectUris: [process.env.XERO_REDIRECT_URI || 'https://ledger-match-backend.onrender.com/auth/xero/callback'],
  scopes: ['offline_access', 'accounting.transactions.read', 'accounting.contacts.read'],
  httpTimeout: 30000 // 30 second timeout
});

// Initial Xero connection route
router.get('/xero', async (req, res) => {
  try {
    console.log('Building consent URL...');
    // Generate a random state
    const state = crypto.randomBytes(16).toString('hex');
    pendingStates.add(state);

    const redirectUri = process.env.XERO_REDIRECT_URI || 'https://ledger-match-backend.onrender.com/auth/xero/callback';
    const consentUrl = await xero.buildConsentUrl();
    
    // Make sure the URL uses our backend redirect URI
    const url = new URL(consentUrl);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('state', state);
    
    console.log('Generated consent URL:', {
      url: url.toString(),
      state,
      redirectUri
    });

    res.json({ 
      url: url.toString(),
      state
    });
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
    
    // Validate state
    if (!state || !pendingStates.has(state)) {
      console.error('Invalid or missing state:', { receivedState: state, knownStates: Array.from(pendingStates) });
      throw new Error('Invalid state parameter');
    }

    // Remove used state
    pendingStates.delete(state);

    if (!code) {
      console.error('No code in callback');
      throw new Error('No authorization code received');
    }

    console.log('Exchanging code for tokens...');
    // Exchange the code for tokens
    const tokenSet = await xero.apiCallback(code);
    console.log('Received token set:', {
      hasAccessToken: !!tokenSet.access_token,
      hasRefreshToken: !!tokenSet.refresh_token,
      expiresIn: tokenSet.expires_in
    });
    
    // Store the tokens (implementation depends on your storage solution)
    // For now, we'll store in memory
    global.xeroTokens = {
      ...tokenSet,
      expires_at: Date.now() + (tokenSet.expires_in * 1000)
    };

    console.log('Redirecting to frontend:', process.env.FRONTEND_URL);
    // Redirect back to the frontend
    res.redirect(`${process.env.FRONTEND_URL || 'https://ledger-match.vercel.app'}?success=true`);
  } catch (error) {
    console.error('Error in Xero callback:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'https://ledger-match.vercel.app';
    res.redirect(`${frontendUrl}?error=${encodeURIComponent(error.message)}`);
  }
});

export default router;