import { XeroClient } from 'xero-node';

const config = {
  clientId: process.env.XERO_CLIENT_ID,
  clientSecret: process.env.XERO_CLIENT_SECRET,
  redirectUris: [process.env.XERO_REDIRECT_URI],
  scopes: ['offline_access', 'accounting.transactions.read', 'accounting.contacts.read'],
  state: 'random-state-string', // Fixed state for testing
  httpTimeout: 30000
};

if (!config.clientId || !config.clientSecret || !config.redirectUris[0]) {
  console.error('Missing required Xero configuration:', {
    clientId: config.clientId ? 'Set' : 'Missing',
    clientSecret: config.clientSecret ? 'Set' : 'Missing',
    redirectUri: config.redirectUris[0] || 'Missing'
  });
}

const xeroClient = new XeroClient(config);

// Initialize the client
xeroClient.initialize().catch(error => {
  console.error('Error initializing Xero client:', error);
});

export { xeroClient };
