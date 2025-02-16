const LOCAL_STORAGE_KEY = 'xero_auth_state';

export const AuthUtils = {
  setAuthState: (state) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
      ...state,
      timestamp: Date.now()
    }));
  },

  getAuthState: () => {
    const state = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!state) return null;
    return JSON.parse(state);
  },

  clearAuthState: () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  },

  verifyAuth: async () => {
    const state = AuthUtils.getAuthState();
    if (!state) return false;

    // Token is valid for 30 minutes
    const TOKEN_VALIDITY = 30 * 60 * 1000;
    const isExpired = Date.now() - state.timestamp > TOKEN_VALIDITY;

    if (isExpired) {
      AuthUtils.clearAuthState();
      return false;
    }

    return state.isAuthenticated;
  }
};