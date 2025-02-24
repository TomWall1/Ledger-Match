import React, { createContext, useContext, useState } from 'react';

const XeroContext = createContext();

export const XeroProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [customerData, setCustomerData] = useState(null);

  const checkAuth = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'https://ledger-match-backend.onrender.com';
      const response = await fetch(`${apiUrl}/auth/xero/status`);
      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(data.isAuthenticated);
        return data.isAuthenticated;
      }
      return false;
    } catch (error) {
      console.error('Error checking Xero auth:', error);
      return false;
    }
  };

  return (
    <XeroContext.Provider value={{
      isAuthenticated,
      setIsAuthenticated,
      customerData,
      setCustomerData,
      checkAuth
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
