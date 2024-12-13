import { XeroClient } from 'xero-node';

const xeroConfig = {
  clientId: process.env.XERO_CLIENT_ID,
  clientSecret: process.env.XERO_CLIENT_SECRET,
  redirectUris: [process.env.XERO_REDIRECT_URI],
  grantType: 'authorization_code',
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
  scopes: xeroConfig.scopes,
  grantType: xeroConfig.grantType
});

const xeroClient = new XeroClient(xeroConfig);

// Add helper method for token exchange
xeroClient.handleCallback = async (code) => {
  try {
    const tokenSet = await xeroClient.apiCallback(code);
    console.log('Token exchange successful:', !!tokenSet);
    return tokenSet;
  } catch (error) {
    console.error('Token exchange error:', error);
    throw error;
  }
};

export { xeroClient };
