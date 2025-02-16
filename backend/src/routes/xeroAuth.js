import express from 'express';
import { XeroClient } from 'xero-node';
import fetch from 'node-fetch';
import crypto from 'crypto';
import { tokenStore } from '../utils/tokenStore.js';

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

// Middleware to verify Xero authentication
const requireXeroAuth = async (req, res, next) => {
  try {
    const tokens = await tokenStore.getValidTokens();
    if (!tokens) {
      throw new Error('Not authenticated with Xero');
    }
    req.xeroTokens = tokens;
    next();
  } catch (error) {
    res.status(401).json({
      error: 'Authentication required',
      details: error.message
    });
  }
};

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

    // Exchange code for tokens manually
    const tokenResponse = await fetch('https://identity.xero.com/connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(
          `${process.env.XERO_CLIENT_ID}:${process.env.XERO_CLIENT_SECRET}`
        ).toString('base64')
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.XERO_REDIRECT_URI || 'https://ledger-match-backend.onrender.com/auth/xero/callback'
      }).toString()
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      throw new Error(`Token exchange failed: ${tokenResponse.status} ${errorText}`);
    }

    const tokens = await tokenResponse.json();
    console.log('Token exchange successful:', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiresIn: tokens.expires_in
    });

    // Store tokens
    await tokenStore.saveTokens(tokens);

    const frontendUrl = process.env.FRONTEND_URL || 'https://ledger-match.vercel.app';
    res.redirect(`${frontendUrl}?authenticated=true`);
  } catch (error) {
    console.error('Error in Xero callback:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'https://ledger-match.vercel.app';
    res.redirect(`${frontendUrl}?error=${encodeURIComponent(error.message)}`);
  }
});

// Get Xero customers
router.get('/xero/customers', requireXeroAuth, async (req, res) => {
  try {
    // Get organization first
    const tenantsResponse = await fetch('https://api.xero.com/connections', {
      headers: {
        'Authorization': `Bearer ${req.xeroTokens.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!tenantsResponse.ok) {
      throw new Error('Failed to get organization');
    }

    const tenants = await tenantsResponse.json();
    if (!tenants || tenants.length === 0) {
      throw new Error('No organizations found');
    }

    const tenantId = tenants[0].tenantId;

    // Get customers
    const customersResponse = await fetch(
      'https://api.xero.com/api.xro/2.0/Contacts?where=IsCustomer=true', {
        headers: {
          'Authorization': `Bearer ${req.xeroTokens.access_token}`,
          'Content-Type': 'application/json',
          'Xero-tenant-id': tenantId
        }
      }
    );

    if (!customersResponse.ok) {
      const errorText = await customersResponse.text();
      throw new Error(`Failed to get customers: ${customersResponse.status} ${errorText}`);
    }

    const customersData = await customersResponse.json();
    res.json({
      success: true,
      customers: customersData.Contacts || []
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      error: 'Failed to fetch customers',
      details: error.message
    });
  }
});

// Get customer invoices
router.get('/xero/customer/:customerId/invoices', requireXeroAuth, async (req, res) => {
  try {
    const { customerId } = req.params;

    // Get organization first
    const tenantsResponse = await fetch('https://api.xero.com/connections', {
      headers: {
        'Authorization': `Bearer ${req.xeroTokens.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!tenantsResponse.ok) {
      throw new Error('Failed to get organization');
    }

    const tenants = await tenantsResponse.json();
    if (!tenants || tenants.length === 0) {
      throw new Error('No organizations found');
    }

    const tenantId = tenants[0].tenantId;

    // Get invoices
    const invoicesResponse = await fetch(
      `https://api.xero.com/api.xro/2.0/Invoices?where=Contact.ContactID=guid(${customerId})`, {
        headers: {
          'Authorization': `Bearer ${req.xeroTokens.access_token}`,
          'Content-Type': 'application/json',
          'Xero-tenant-id': tenantId
        }
      }
    );

    if (!invoicesResponse.ok) {
      const errorText = await invoicesResponse.text();
      throw new Error(`Failed to get invoices: ${invoicesResponse.status} ${errorText}`);
    }

    const invoicesData = await invoicesResponse.json();
    
    // Transform to match CSV format
    const transformedInvoices = (invoicesData.Invoices || []).map(invoice => ({
      transaction_number: invoice.InvoiceNumber,
      transaction_type: invoice.Type,
      amount: invoice.Total,
      issue_date: invoice.Date,
      due_date: invoice.DueDate,
      status: invoice.Status,
      reference: invoice.Reference || ''
    }));

    res.json({
      success: true,
      invoices: transformedInvoices
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({
      error: 'Failed to fetch invoices',
      details: error.message
    });
  }
});

export default router;