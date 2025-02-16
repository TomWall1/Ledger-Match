import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://red-cuon34bqf0us7393iir0:6379');

// Log Redis connection status
redis.on('connect', () => {
    console.log('Connected to Redis');
});

redis.on('error', (err) => {
    console.error('Redis error:', err);
});

const TOKEN_KEY = 'xero_tokens';
const TOKEN_EXPIRY = 30 * 60; // 30 minutes in seconds

export const tokenStore = {
    async saveTokens(tokens) {
        try {
            console.log('Saving tokens to Redis...');
            const tokenData = {
                ...tokens,
                expires_at: Date.now() + (tokens.expires_in * 1000)
            };
            await redis.setex(TOKEN_KEY, TOKEN_EXPIRY, JSON.stringify(tokenData));
            console.log('Tokens saved successfully');
            return tokenData;
        } catch (error) {
            console.error('Error saving tokens:', error);
            throw error;
        }
    },

    async getTokens() {
        try {
            console.log('Getting tokens from Redis...');
            const tokensStr = await redis.get(TOKEN_KEY);
            if (!tokensStr) {
                console.log('No tokens found in Redis');
                return null;
            }
            const tokens = JSON.parse(tokensStr);
            console.log('Retrieved tokens from Redis');
            return tokens;
        } catch (error) {
            console.error('Error getting tokens:', error);
            return null;
        }
    },

    async clearTokens() {
        try {
            console.log('Clearing tokens from Redis...');
            await redis.del(TOKEN_KEY);
            console.log('Tokens cleared successfully');
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
