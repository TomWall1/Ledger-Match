import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const XeroContext = createContext();

export const XeroProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const [error, setError] = useState(null);
  // Use a ref to track if we've already performed the initial check
  const initialCheckDone = useRef(false);

  useEffect(() => {
    // Only do the initial auth check once
    if (!initialCheckDone.current) {
      initialCheckDone.current = true;
      checkAuth();
    }
  }, []);

  const checkAuth = async () => {
    // Prevent multiple simultaneous auth checks
    if (isCheckingAuth) return isAuthenticated;
    
    try {
      setIsCheckingAuth(true);
      setLoading(true);
      setError(null);
      
      // First try to get from localStorage to avoid unnecessary API calls
      const storedAuth = localStorage.getItem('xeroAuth') === 'true';
      if (storedAuth) {
        setIsAuthenticated(true);
        setLoading(false);
        setIsCheckingAuth(false);
        return true;
      }
      
      // Only call the API if we don't have the auth state in localStorage
      try {
        const apiUrl = process.env.REACT_APP_API_URL || 'https://ledger-match-backend.onrender.com';
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
        
        const response = await fetch(`${apiUrl}/auth/xero/status`, {
          signal: controller.signal,
          credentials: 'include' // Include cookies if any
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Xero authentication status:', data);
          
          setIsAuthenticated(data.isAuthenticated);
          
          // Also update localStorage to keep state consistent
          if (data.isAuthenticated) {
            localStorage.setItem('xeroAuth', 'true');
          } else {
            localStorage.removeItem('xeroAuth');
          }
          
          return data.isAuthenticated;
        } else {
          throw new Error(`API returned status: ${response.status}`);
        }
      } catch (error) {
        // If the API call fails (e.g., timeout), use the localStorage value
        console.error('Error fetching auth status:', error);
        setError(`Failed to connect to Xero service: ${error.message}`);
        return storedAuth;
      }
    } catch (error) {
      console.error('Error checking Xero auth:', error);
      setError(`Authentication error: ${error.message}`);
      return false;
    } finally {
      setLoading(false);
      setIsCheckingAuth(false);
    }
  };

  return (
    <XeroContext.Provider value={{
      isAuthenticated,
      setIsAuthenticated,
      customerData,
      setCustomerData,
      checkAuth,
      loading,
      error
    }}>
      {children}
    </XeroContext.Provider>
  );
};

export const useXero = () => {
  const context = useContext(XeroContext);
  if (!context) {
    throw new Error('useXero must be used within a XeroProvider');
  }
  return context;
};
