import Redis from 'ioredis';

let redis;
if (process.env.REDIS_URL) {
    redis = new Redis(process.env.REDIS_URL);
} else {
    redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD
    });
}

const TOKEN_KEY = 'xero_tokens';
const TOKEN_EXPIRY = 30 * 60; // 30 minutes in seconds

export const tokenStore = {
    async saveTokens(tokens) {
        const tokenData = {
            ...tokens,
            expires_at: Date.now() + (tokens.expires_in * 1000)
        };
        await redis.setex(TOKEN_KEY, TOKEN_EXPIRY, JSON.stringify(tokenData));
        return tokenData;
    },

    async getTokens() {
        const tokensStr = await redis.get(TOKEN_KEY);
        if (!tokensStr) return null;
        return JSON.parse(tokensStr);
    },

    async clearTokens() {
        await redis.del(TOKEN_KEY);
    },

    async getValidTokens() {
        const tokens = await this.getTokens();
        if (!tokens) return null;

        // Check if tokens are expired
        if (Date.now() >= tokens.expires_at) {
            await this.clearTokens();
            return null;
        }

        return tokens;
    }
};
