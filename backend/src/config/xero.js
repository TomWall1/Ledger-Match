import { XeroClient } from 'xero-node';

const config = {
  clientId: process.env.XERO_CLIENT_ID,
  clientSecret: process.env.XERO_CLIENT_SECRET,
  redirectUris: [process.env.XERO_REDIRECT_URI],
  grantType: 'authorization_code',
  state: 'randomState',
  scopes: ['offline_access', 'accounting.transactions.read', 'accounting.contacts.read']
};

// Log configuration for debugging
console.log('Initializing Xero client with config:', {
  clientId: process.env.XERO_CLIENT_ID ? 'Set' : 'Missing',
  clientSecret: process.env.XERO_CLIENT_SECRET ? 'Set' : 'Missing',
  redirectUri: process.env.XERO_REDIRECT_URI,
  scopes: config.scopes,
  grantType: config.grantType
});

const xeroClient = new XeroClient({
  ...config,
  httpTimeout: 30000,
});

// Add helper methods for token management
xeroClient.getTokenFromCode = async (code) => {
  try {
    const tokenSet = await xeroClient.oauth2Client.getToken({
      code,
      grant_type: 'authorization_code',
      redirect_uri: process.env.XERO_REDIRECT_URI
    });
    
    console.log('Token exchange successful:', !!tokenSet);
    return tokenSet;
  } catch (error) {
    console.error('Token exchange error:', error);
    throw error;
  }
};

// Export configured client
export { xeroClient };
