import { XeroClient } from 'xero-node';

const xeroConfig = {
  clientId: process.env.XERO_CLIENT_ID,
  clientSecret: process.env.XERO_CLIENT_SECRET,
  redirectUris: [process.env.XERO_REDIRECT_URI],
  scopes: process.env.XERO_SCOPES.split(' ')
};

export const xeroClient = new XeroClient(xeroConfig);
