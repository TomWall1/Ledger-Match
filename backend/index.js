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

app.get('/api/xero/auth-url', (req, res) => {
  const authUrl = xero.buildConsentUrl();
  res.json({ url: authUrl });
});

app.post('/api/xero/callback', async (req, res) => {
  try {
    const { code } = req.body;
    await xero.apiCallback(code);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/xero/invoices/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const invoices = await xero.accountingApi.getInvoices(tenantId);
    res.json(invoices.body);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});