import Redis from 'ioredis';

// Create Redis client with connection error handling
let redis;
try {
    redis = new Redis(process.env.REDIS_URL || 'redis://red-cuon34bqf0us7393iir0:6379', {
        retryStrategy: (times) => {
            // Retry connecting with exponential backoff
            const delay = Math.min(times * 50, 2000);
            return delay;
        },
        maxRetriesPerRequest: 3,
        connectTimeout: 10000
    });

    // Log Redis connection status
    redis.on('connect', () => {
        console.log('Connected to Redis');
    });

    redis.on('error', (err) => {
        console.error('Redis error:', err);
    });
} catch (error) {
    console.error('Failed to initialize Redis:', error);
    // Set up a dummy redis client that uses memory instead
    console.log('Using in-memory token storage fallback');
}

const TOKEN_KEY = 'xero_tokens';
const TOKEN_EXPIRY = 30 * 60; // 30 minutes in seconds

// In-memory fallback storage
let memoryTokens = null;

export const tokenStore = {
    async saveTokens(tokens) {
        try {
            console.log('Saving tokens...');
            const tokenData = {
                ...tokens,
                expires_at: Date.now() + (tokens.expires_in * 1000)
            };
            
            // Try Redis first
            if (redis && redis.status === 'ready') {
                await redis.setex(TOKEN_KEY, TOKEN_EXPIRY, JSON.stringify(tokenData));
                console.log('Tokens saved to Redis');
            } else {
                // Fallback to memory
                memoryTokens = tokenData;
                console.log('Tokens saved to memory');
            }
            
            return tokenData;
        } catch (error) {
            console.error('Error saving tokens:', error);
            // Fallback to memory
            memoryTokens = {
                ...tokens,
                expires_at: Date.now() + (tokens.expires_in * 1000)
            };
            console.log('Tokens saved to memory (fallback)');
            return memoryTokens;
        }
    },

    async getTokens() {
        try {
            console.log('Getting tokens...');
            
            // Try Redis first
            if (redis && redis.status === 'ready') {
                const tokensStr = await redis.get(TOKEN_KEY);
                if (tokensStr) {
                    console.log('Retrieved tokens from Redis');
                    return JSON.parse(tokensStr);
                }
            }
            
            // Fallback to memory if Redis failed or returned no tokens
            if (memoryTokens) {
                console.log('Retrieved tokens from memory');
                return memoryTokens;
            }
            
            console.log('No tokens found');
            return null;
        } catch (error) {
            console.error('Error getting tokens:', error);
            // Fallback to memory
            if (memoryTokens) {
                console.log('Retrieved tokens from memory (fallback)');
                return memoryTokens;
            }
            return null;
        }
    },

    async clearTokens() {
        try {
            console.log('Clearing tokens...');
            
            // Clear from Redis
            if (redis && redis.status === 'ready') {
                await redis.del(TOKEN_KEY);
                console.log('Tokens cleared from Redis');
            }
            
            // Always clear from memory too
            memoryTokens = null;
            console.log('Tokens cleared from memory');
            
        } catch (error) {
            console.error('Error clearing tokens:', error);
            // At least clear memory
            memoryTokens = null;
            console.log('Tokens cleared from memory (fallback)');
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
