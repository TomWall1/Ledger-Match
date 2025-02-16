const LOCAL_STORAGE_KEY = 'xero_auth_state';

export const AuthUtils = {
  setAuthState: (state) => {
    console.log('Setting auth state:', state);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
      ...state,
      timestamp: Date.now()
    }));
  },

  getAuthState: () => {
    const state = localStorage.getItem(LOCAL_STORAGE_KEY);
    console.log('Getting auth state:', state);
    if (!state) return null;
    return JSON.parse(state);
  },

  clearAuthState: () => {
    console.log('Clearing auth state');
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  },

  verifyAuth: async () => {
    const state = AuthUtils.getAuthState();
    console.log('Verifying auth state:', state);
    
    if (!state) {
      console.log('No auth state found');
      return false;
    }

    // Token is valid for 30 minutes
    const TOKEN_VALIDITY = 30 * 60 * 1000; // 30 minutes in milliseconds
    const isExpired = Date.now() - state.timestamp > TOKEN_VALIDITY;

    if (isExpired) {
      console.log('Auth state expired');
      AuthUtils.clearAuthState();
      return false;
    }

    console.log('Auth state valid:', state.isAuthenticated);
    return state.isAuthenticated;
  }
};