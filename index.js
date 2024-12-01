const express = require('express');
const cors = require('cors');
const { XeroClient } = require('xero-node');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const xero = new XeroClient({
  clientId: process.env.XERO_CLIENT_ID,
  clientSecret: process.env.XERO_CLIENT_SECRET,
  redirectUris: [process.env.XERO_REDIRECT_URI],
  scopes: ['accounting.transactions.read', 'accounting.contacts.read']
});

app.get('/', (req, res) => {
  res.json({ status: 'API is running' });
});

app.get('/api/xero/config', (req, res) => {
  res.json({
    clientId: process.env.XERO_CLIENT_ID ? '✓ Set' : '✗ Missing',
    clientSecret: process.env.XERO_CLIENT_SECRET ? '✓ Set' : '✗ Missing',
    redirectUri: process.env.XERO_REDIRECT_URI,
  });
});

app.get('/api/xero/auth-url', async (req, res) => {
  try {
    console.log('Generating Xero consent URL');
    const consentUrl = await xero.buildConsentUrl();
    console.log('Consent URL generated:', consentUrl);
    res.json({ url: consentUrl });
  } catch (error) {
    console.error('Error generating consent URL:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/xero/callback', async (req, res) => {
  try {
    const { code } = req.body;
    await xero.apiCallback(code);
    res.json({ success: true });
  } catch (error) {
    console.error('Error in Xero callback:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/xero/invoices/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const invoices = await xero.accountingApi.getInvoices(tenantId);
    res.json(invoices.body);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Environment:', {
    clientId: process.env.XERO_CLIENT_ID ? '✓ Set' : '✗ Missing',
    clientSecret: process.env.XERO_CLIENT_SECRET ? '✓ Set' : '✗ Missing',
    redirectUri: process.env.XERO_REDIRECT_URI,
  });
});