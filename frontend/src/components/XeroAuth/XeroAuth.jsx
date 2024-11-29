import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const XeroAuth = () => {
  const [authStatus, setAuthStatus] = useState('idle');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Handle the initial connection to Xero
  const handleConnectToXero = async () => {
    try {
      setAuthStatus('connecting');
      const response = await fetch('/api/auth/xero/connect');
      const data = await response.json();
      
      if (data.authUrl) {
        // Store the current path so we can return after auth
        sessionStorage.setItem('auth_redirect', location.pathname);
        // Redirect to Xero login
        window.location.href = data.authUrl;
      } else {
        throw new Error('Failed to get authorization URL');
      }
    } catch (err) {
      setError('Failed to connect to Xero. Please try again.');
      setAuthStatus('error');
    }
  };

  // Check if we're returning from Xero auth
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const code = queryParams.get('code');
    const error = queryParams.get('error');
    
    if (code) {
      handleAuthCallback(code);
    } else if (error) {
      setError('Authentication failed: ' + error);
      setAuthStatus('error');
    }
  }, [location]);

  // Handle the callback from Xero
  const handleAuthCallback = async (code) => {
    try {
      setAuthStatus('authenticating');
      const response = await fetch('/api/auth/xero/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (response.ok) {
        setAuthStatus('authenticated');
        // Get the stored redirect path
        const redirectPath = sessionStorage.getItem('auth_redirect') || '/';
        sessionStorage.removeItem('auth_redirect');
        navigate(redirectPath);
      } else {
        throw new Error(data.message || 'Authentication failed');
      }
    } catch (err) {
      setError(err.message);
      setAuthStatus('error');
    }
  };

  // Show different content based on auth status
  const renderContent = () => {
    switch (authStatus) {
      case 'connecting':
        return <div>Connecting to Xero...</div>;
      case 'authenticating':
        return <div>Completing authentication...</div>;
      case 'error':
        return (
          <div>
            <p className="text-red-500">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setAuthStatus('idle');
              }}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Try Again
            </button>
          </div>
        );
      default:
        return (
          <button
            onClick={handleConnectToXero}
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            Connect to Xero
          </button>
        );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6">
      <h2 className="text-2xl font-bold mb-6">Xero Integration</h2>
      {renderContent()}
    </div>
  );
};

export default XeroAuth;