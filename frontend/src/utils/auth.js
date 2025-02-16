const AUTH_STORAGE_KEY = 'xero_auth_state';

export const AuthUtils = {
  setAuthState: (state) => {
    console.log('Setting auth state:', state);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
      ...state,
      timestamp: Date.now()
    }));
  },

  getAuthState: () => {
    console.log('Getting auth state');
    const state = localStorage.getItem(AUTH_STORAGE_KEY);
    console.log('Current state:', state);
    if (!state) return null;
    return JSON.parse(state);
  },

  clearAuthState: () => {
    console.log('Clearing auth state');
    localStorage.removeItem(AUTH_STORAGE_KEY);
  },

  verifyAuth: async () => {
    console.log('Verifying auth state');
    const state = AuthUtils.getAuthState();
    console.log('Retrieved state:', state);
    
    if (!state) {
      console.log('No auth state found');
      return false;
    }

    // Check URL parameters
    const params = new URLSearchParams(window.location.search);
    const authenticated = params.get('authenticated');
    if (authenticated === 'true') {
      console.log('Found authenticated=true in URL');
      return true;
    }

    // Token is valid for 30 minutes
    const TOKEN_VALIDITY = 30 * 60 * 1000; // 30 minutes in milliseconds
    const isExpired = Date.now() - state.timestamp > TOKEN_VALIDITY;

    if (isExpired) {
      console.log('Auth state expired');
      AuthUtils.clearAuthState();
      return false;
    }

    console.log('Auth state valid');
    return state.isAuthenticated;
  }
};