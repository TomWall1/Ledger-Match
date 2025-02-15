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

// Store tokens in memory (for development)
let tokenStore = null;

// Log configuration at startup
console.log('Xero client configuration:', {
  clientId: process.env.XERO_CLIENT_ID ? `${process.env.XERO_CLIENT_ID.substring(0, 4)}...` : 'Missing',
  clientSecret: process.env.XERO_CLIENT_SECRET ? 'Present' : 'Missing',
  redirectUri: process.env.XERO_REDIRECT_URI,
  hasXeroClient: !!xero
});

// Helper function to check token and refresh if needed
const ensureValidToken = async () => {
  if (!tokenStore?.access_token) {
    throw new Error('No access token available');
  }

  // TODO: Add token refresh logic if token is expired
  return tokenStore.access_token;
};

router.get('/xero/customers', async (req, res) => {
  try {
    const accessToken = await ensureValidToken();
    
    // Get the first organization
    const tenantsResponse = await fetch('https://api.xero.com/connections', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
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
          'Authorization': `Bearer ${accessToken}`,
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

router.get('/xero/customer/:customerId/invoices', async (req, res) => {
  try {
    const { customerId } = req.params;
    const accessToken = await ensureValidToken();
    
    // Get the first organization
    const tenantsResponse = await fetch('https://api.xero.com/connections', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
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
          'Authorization': `Bearer ${accessToken}`,
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

// ... rest of the existing routes (xero, callback, verify) ...

export default router;
