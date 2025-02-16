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

// Helper function to make authenticated Xero API calls
async function callXeroApi(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  });

  const text = await response.text();
  console.log(`Response from ${url}:`, {
    status: response.status,
    headers: response.headers.raw(),
    body: text
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.status} ${text}`);
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    console.error('Failed to parse response:', text);
    throw new Error('Invalid JSON response from Xero');
  }
}

// All other existing routes remain the same...

// Get customer invoices
router.get('/xero/customer/:customerId/invoices', requireXeroAuth, async (req, res) => {
  try {
    const { customerId } = req.params;
    console.log('Fetching invoices for customer:', customerId);

    // Get organization first
    const tenants = await callXeroApi('https://api.xero.com/connections', {
      headers: {
        'Authorization': `Bearer ${req.xeroTokens.access_token}`
      }
    });

    if (!tenants || tenants.length === 0) {
      throw new Error('No organizations found');
    }

    const tenantId = tenants[0].tenantId;

    // Get invoices - using ContactID in filter
    const url = `https://api.xero.com/api.xro/2.0/Invoices?where=Contact.ContactID.ToString()=="${customerId}"&order=Date DESC`;
    console.log('Fetching invoices with URL:', url);

    const invoicesData = await callXeroApi(url, {
      headers: {
        'Authorization': `Bearer ${req.xeroTokens.access_token}`,
        'Xero-tenant-id': tenantId
      }
    });
    
    // Transform to match CSV format
    console.log('Received invoices:', invoicesData);
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