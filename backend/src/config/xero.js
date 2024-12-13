import { XeroClient } from 'xero-node';

// Generate a random state
const generateState = () => Math.random().toString(36).substring(7);

const config = {
  clientId: process.env.XERO_CLIENT_ID,
  clientSecret: process.env.XERO_CLIENT_SECRET,
  redirectUris: [process.env.XERO_REDIRECT_URI],
  grantType: 'authorization_code',
  scopes: ['offline_access', 'accounting.transactions.read', 'accounting.contacts.read']
};

export const xeroClient = new XeroClient({
  ...config,
  httpTimeout: 30000
});

// Add state handling methods
export const getState = () => generateState();