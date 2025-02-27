import React, { createContext, useContext, useState, useEffect } from 'react';

const XeroContext = createContext();

export const XeroProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.REACT_APP_API_URL || 'https://ledger-match-backend.onrender.com';
      const response = await fetch(`${apiUrl}/auth/xero/status`);
      
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
      }
      return false;
    } catch (error) {
      console.error('Error checking Xero auth:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <XeroContext.Provider value={{
      isAuthenticated,
      setIsAuthenticated,
      customerData,
      setCustomerData,
      checkAuth,
      loading
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
