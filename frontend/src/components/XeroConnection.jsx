import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavHeader from './NavHeader';
import { useXero } from '../context/XeroContext';

const XeroConnection = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { isAuthenticated, checkAuth, error: xeroError } = useXero();

  useEffect(() => {
    // Check the authentication status when component mounts
    const checkConnection = async () => {
      setIsLoading(true);
      try {
        // Use the context's checkAuth function to verify status with the server
        const authStatus = await checkAuth();
        setIsConnected(authStatus || isAuthenticated);
      } catch (error) {
        console.error('Error checking connection:', error);
        setError('Failed to check Xero connection status');
      } finally {
        setIsLoading(false);
      }
    };

    checkConnection();
  }, [checkAuth, isAuthenticated]);

  // Use the error from XeroContext if available
  useEffect(() => {
    if (xeroError) {
      setError(xeroError);
    }
  }, [xeroError]);

  const handleConnect = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const apiUrl = process.env.REACT_APP_API_URL || 'https://ledger-match-backend.onrender.com';
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${apiUrl}/auth/xero/connect`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Failed to initiate Xero connection: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      window.location.href = data.authUrl;
    } catch (error) {
      console.error('Error connecting to Xero:', error);
      setError(`Failed to connect to Xero: ${error.message}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const apiUrl = process.env.REACT_APP_API_URL || 'https://ledger-match-backend.onrender.com';
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${apiUrl}/auth/xero/disconnect`, {
        method: 'POST',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Failed to disconnect from Xero: ${response.status} ${response.statusText}`);
      }

      // Clear local authentication state
      localStorage.removeItem('xeroAuth');
      setIsConnected(false);
      
      // Refresh the page to ensure all components update
      window.location.reload();
    } catch (error) {
      console.error('Error disconnecting from Xero:', error);
      setError(`Failed to disconnect from Xero: ${error.message}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    navigate('/upload', { state: { xeroEnabled: true } });
  };

  const handleTryAgain = () => {
    setError(null);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavHeader />
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-[#1B365D] mb-8">Connect to Xero</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <div className="flex items-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Connection Error</span>
              </div>
              <p>{error}</p>
              <button 
                onClick={handleTryAgain}
                className="mt-2 px-3 py-1 bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors text-sm"
              >
                Try Again
              </button>
            </div>
          )}

          <div className="space-y-6">
            {!isConnected ? (
              <div>
                <p className="text-[#647789] mb-4">
                  Connect your Xero account to import Accounts Receivable data directly from your organization.
                </p>
                <button
                  onClick={handleConnect}
                  disabled={isLoading}
                  className={`flex items-center px-6 py-3 rounded-lg transition-colors ${isLoading ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#13B5EA] hover:bg-[#0EA2D4]'} text-white font-medium`}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Connecting...
                    </>
                  ) : (
                    <>
                      <img 
                        src="/xero-logo.svg" 
                        alt="Xero logo" 
                        className="w-5 h-5 mr-2"
                      />
                      Connect to Xero
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center text-green-600 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Connected to Xero
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={handleContinue}
                    className="flex items-center px-6 py-3 rounded-lg transition-colors bg-[#00A4B4] hover:bg-[#008999] text-white font-medium"
                  >
                    Continue to Upload
                  </button>
                  <button
                    onClick={handleDisconnect}
                    disabled={isLoading}
                    className={`flex items-center px-4 py-2 rounded-lg transition-colors ${isLoading ? 'bg-gray-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'} text-white font-medium`}
                  >
                    {isLoading ? 'Disconnecting...' : (
                      <>
                        <img 
                          src="/xero-logo.svg" 
                          alt="Xero logo" 
                          className="w-4 h-4 mr-2 opacity-80"
                        />
                        Disconnect
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default XeroConnection;