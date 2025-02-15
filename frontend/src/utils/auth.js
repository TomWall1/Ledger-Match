const AUTH_STORAGE_KEY = 'xero_auth_state';

export const AuthUtils = {
  setAuthState(state) {
    try {
      const authState = {
        isAuthenticated: state.isAuthenticated,
        tenants: state.tenants,
        lastChecked: new Date().toISOString(),
      };
      sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));
    } catch (error) {
      console.error('Error storing auth state:', error);
    }
  },

  getAuthState() {
    try {
      const state = sessionStorage.getItem(AUTH_STORAGE_KEY);
      if (!state) return { isAuthenticated: false };
      
      return JSON.parse(state);
    } catch (error) {
      console.error('Error reading auth state:', error);
      return { isAuthenticated: false };
    }
  },

  clearAuthState() {
    try {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing auth state:', error);
    }
  },

  async verifyAuth() {
    try {
      // Check if we already have a valid token
      const currentState = this.getAuthState();
      if (!currentState.isAuthenticated) {
        return false;
      }

      const apiUrl = process.env.REACT_APP_API_URL || 'https://ledger-match-backend.onrender.com';
      console.log('Verifying auth with:', apiUrl);

      const response = await fetch(`${apiUrl}/auth/verify`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Verify response:', response.status);

      if (!response.ok) {
        this.clearAuthState();
        return false;
      }

      const result = await response.json();
      console.log('Verify result:', result);

      if (result.authenticated) {
        this.setAuthState({
          isAuthenticated: true,
          tenants: result.tenants
        });
        return true;
      } else {
        this.clearAuthState();
        return false;
      }
    } catch (error) {
      console.error('Error verifying auth:', error);
      this.clearAuthState();
      return false;
    }
  },

  async logout() {
    this.clearAuthState();
    window.location.href = '/';
  }
};
