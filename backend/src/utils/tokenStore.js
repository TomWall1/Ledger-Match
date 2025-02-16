const TOKEN_KEY = 'xero_tokens';
const TOKEN_EXPIRY = 30 * 60 * 1000; // 30 minutes in milliseconds

export const tokenStore = {
    async saveTokens(tokens) {
        try {
            // Store tokens with expiry
            const tokenData = {
                ...tokens,
                expires_at: Date.now() + (tokens.expires_in * 1000)
            };
            
            // Store in memory for now (will persist in a future update)
            global.xeroTokenData = tokenData;
            return tokenData;
        } catch (error) {
            console.error('Error saving tokens:', error);
            throw error;
        }
    },

    async getTokens() {
        try {
            // Get from memory (will update in future)
            return global.xeroTokenData || null;
        } catch (error) {
            console.error('Error getting tokens:', error);
            return null;
        }
    },

    async clearTokens() {
        try {
            // Clear from memory
            global.xeroTokenData = null;
        } catch (error) {
            console.error('Error clearing tokens:', error);
            throw error;
        }
    },

    async getValidTokens() {
        try {
            const tokens = await this.getTokens();
            if (!tokens) {
                console.log('No tokens found');
                return null;
            }

            // Check if tokens are expired
            if (Date.now() >= tokens.expires_at) {
                console.log('Tokens are expired');
                await this.clearTokens();
                return null;
            }

            console.log('Valid tokens found');
            return tokens;
        } catch (error) {
            console.error('Error getting valid tokens:', error);
            return null;
        }
    }
};
