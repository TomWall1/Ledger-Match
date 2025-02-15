import fs from 'fs/promises';
import path from 'path';

// Store tokens in a JSON file (for development)
// In production, you should use a database
const TOKEN_FILE = path.join(process.cwd(), 'tokens.json');

class TokenStore {
    constructor() {
        this.tokens = null;
        this.initialize();
    }

    async initialize() {
        try {
            const data = await fs.readFile(TOKEN_FILE, 'utf8');
            this.tokens = JSON.parse(data);
        } catch (error) {
            // If file doesn't exist or is invalid, start with empty tokens
            this.tokens = null;
            await this.saveTokens(null);
        }
    }

    async saveTokens(tokens) {
        this.tokens = tokens;
        await fs.writeFile(TOKEN_FILE, JSON.stringify(tokens, null, 2));
    }

    async getTokens() {
        if (!this.tokens) {
            try {
                const data = await fs.readFile(TOKEN_FILE, 'utf8');
                this.tokens = JSON.parse(data);
            } catch (error) {
                return null;
            }
        }
        return this.tokens;
    }

    async clearTokens() {
        await this.saveTokens(null);
    }

    isTokenExpired() {
        if (!this.tokens || !this.tokens.expires_at) {
            return true;
        }
        // Add 30 second buffer before actual expiration
        return Date.now() >= (this.tokens.expires_at - 30000);
    }
}

export const tokenStore = new TokenStore();
