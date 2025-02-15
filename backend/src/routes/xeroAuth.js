import express from 'express';
import { XeroClient } from 'xero-node';
import fetch from 'node-fetch';
import { tokenStore } from '../utils/tokenStore.js';

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

// Helper function to refresh token if needed
async function ensureValidToken() {
  const tokens = await tokenStore.getTokens();
  
  if (!tokens) {
    throw new Error('No tokens available. Please authenticate with Xero.');
  }

  if (tokenStore.isTokenExpired()) {
    try {
      const newTokenSet = await xero.refreshToken();
      
      // Calculate expiration time (30 minutes from now)
      const expires_at = Date.now() + (30 * 60 * 1000);
      
      // Save new tokens
      await tokenStore.saveTokens({
        ...newTokenSet,
        expires_at
      });
      
      return newTokenSet.access_token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      await tokenStore.clearTokens();
      throw new Error('Failed to refresh token. Please re-authenticate.');
    }
  }

  return tokens.access_token;
}

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
    
    // Calculate token expiration (30 minutes from now)
    const expires_at = Date.now() + (30 * 60 * 1000);
    
    // Save the tokens
    await tokenStore.saveTokens({
      ...tokenSet,
      expires_at
    });

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

// Middleware to handle token validation
const requireValidToken = async (req, res, next) => {
  try {
    const accessToken = await ensureValidToken();
    req.accessToken = accessToken;
    next();
  } catch (error) {
    res.status(401).json({
      error: 'Authentication required',
      message: error.message
    });
  }
};

router.get('/xero/customers', requireValidToken, async (req, res) => {
  try {
    // Get the first organization
    const tenantsResponse = await fetch('https://api.xero.com/connections', {
      headers: {
        'Authorization': `Bearer ${req.accessToken}`,
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

    // Get customers for this organization
    const customersResponse = await fetch(
      'https://api.xero.com/api.xro/2.0/Contacts?where=IsCustomer=true', {
        headers: {
          'Authorization': `Bearer ${req.accessToken}`,
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

router.get('/xero/customer/:customerId/invoices', requireValidToken, async (req, res) => {
  try {
    const { customerId } = req.params;
    
    // Get the first organization
    const tenantsResponse = await fetch('https://api.xero.com/connections', {
      headers: {
        'Authorization': `Bearer ${req.accessToken}`,
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

    // Get invoices for this customer
    const invoicesResponse = await fetch(
      `https://api.xero.com/api.xro/2.0/Invoices?where=Contact.ContactID=guid(${customerId})`, {
        headers: {
          'Authorization': `Bearer ${req.accessToken}`,
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
    
    // Transform invoices to match your CSV format
    const transformedInvoices = invoicesData.Invoices.map(invoice => ({
      transactionNumber: invoice.InvoiceNumber,
      type: invoice.Type,
      amount: invoice.Total,
      date: invoice.Date,
      dueDate: invoice.DueDate,
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