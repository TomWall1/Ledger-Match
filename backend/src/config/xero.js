import { XeroClient } from 'xero-node';

// Generate a random state
const generateState = () => Math.random().toString(36).substring(7);

const config = {
  clientId: process.env.XERO_CLIENT_ID,
  clientSecret: process.env.XERO_CLIENT_SECRET,
  redirectUris: [process.env.XERO_REDIRECT_URI],
  grantType: 'authorization_code',
  state: generateState(),
  scopes: ['offline_access', 'accounting.transactions.read', 'accounting.contacts.read']
};

console.log('Creating Xero client with config:', {
  clientId: process.env.XERO_CLIENT_ID ? 'Set' : 'Missing',
  clientSecret: process.env.XERO_CLIENT_SECRET ? 'Set' : 'Missing',
  redirectUri: process.env.XERO_REDIRECT_URI,
  scopes: config.scopes
});

const xeroClient = new XeroClient(config);

export { xeroClient, generateState as getState };
