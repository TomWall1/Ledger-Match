import { XeroClient } from 'xero-node';

const defaultScopes = 'offline_access accounting.transactions.read accounting.contacts.read';

const xeroConfig = {
  clientId: process.env.XERO_CLIENT_ID,
  clientSecret: process.env.XERO_CLIENT_SECRET,
  redirectUris: [process.env.XERO_REDIRECT_URI],
  scopes: (process.env.XERO_SCOPES || defaultScopes).split(' ')
};

export const xeroClient = new XeroClient(xeroConfig);
