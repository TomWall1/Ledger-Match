import { XeroClient } from 'xero-node';

const config = {
  clientId: process.env.XERO_CLIENT_ID,
  clientSecret: process.env.XERO_CLIENT_SECRET,
  redirectUris: [process.env.XERO_REDIRECT_URI],
  grantType: 'authorization_code',
  scopes: ['offline_access', 'accounting.transactions.read', 'accounting.contacts.read']
};

if (!config.clientId || !config.clientSecret || !config.redirectUris[0]) {
  console.error('Missing required Xero configuration:', {
    clientId: config.clientId ? 'Set' : 'Missing',
    clientSecret: config.clientSecret ? 'Set' : 'Missing',
    redirectUri: config.redirectUris[0] || 'Missing'
  });
}

const xeroClient = new XeroClient({
  ...config,
  httpTimeout: 30000  // Increase timeout to 30 seconds
});

export { xeroClient };
