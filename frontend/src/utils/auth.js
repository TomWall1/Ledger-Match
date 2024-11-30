const AUTH_STORAGE_KEY = 'xero_auth_state';

export const AuthUtils = {
  // Store authentication state
  setAuthState(state) {
    try {
      const authState = {
        isAuthenticated: state.isAuthenticated,
        lastChecked: new Date().toISOString(),
      };
      sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));
    } catch (error) {
      console.error('Error storing auth state:', error);
    }
  },

  // Get authentication state
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

  // Clear authentication state
  clearAuthState() {
    try {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing auth state:', error);
    }
  },

  // Verify authentication status with backend
  async verifyAuth() {
    try {
      const response = await fetch('/api/auth/verify', {
        credentials: 'include'
      });
      
      const isAuthenticated = response.ok;
      this.setAuthState({ isAuthenticated });
      
      return isAuthenticated;
    } catch (error) {
      console.error('Error verifying auth:', error);
      return false;
    }
  },

  // Handle logout
  async logout() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      this.clearAuthState();
      window.location.href = '/login';
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }
};