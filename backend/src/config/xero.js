import { XeroClient } from 'xero-node';

const xeroConfig = {
  clientId: process.env.XERO_CLIENT_ID,
  clientSecret: process.env.XERO_CLIENT_SECRET,
  redirectUris: [process.env.XERO_REDIRECT_URI],
  scopes: process.env.XERO_SCOPES?.split(' ') || [
    'offline_access',
    'accounting.transactions.read',
    'accounting.contacts.read'
  ]
};

console.log('Xero Config:', {
  clientId: process.env.XERO_CLIENT_ID ? 'Set' : 'Missing',
  clientSecret: process.env.XERO_CLIENT_SECRET ? 'Set' : 'Missing',
  redirectUri: process.env.XERO_REDIRECT_URI,
  scopes: xeroConfig.scopes
});

export const xeroClient = new XeroClient(xeroConfig);
