const AUTH_STORAGE_KEY = 'xero_auth_state';

export const AuthUtils = {
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
      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/verify`, {
        credentials: 'include'
      });
      
      const result = await response.json();
      const isAuthenticated = result.authenticated;
      this.setAuthState({ isAuthenticated });
      
      return isAuthenticated;
    } catch (error) {
      console.error('Error verifying auth:', error);
      return false;
    }
  },

  async logout() {
    try {
      this.clearAuthState();
      window.location.href = '/';
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }
};