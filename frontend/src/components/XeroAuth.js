import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

const XeroAuth = () => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const location = useLocation();

  useEffect(() => {
    if (location.state?.error) {
      setError(location.state.error);
    }
  }, [location]);

  const handleConnect = async () => {
    console.log('Button clicked - start');
    setIsLoading(true);
    setError(null);
    
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'https://ledger-match-backend.onrender.com';
      const fullUrl = `${apiUrl}/auth/xero`;
      
      // Store debug info
      const debug = {
        apiUrl,
        fullUrl,
        env: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      };
      setDebugInfo(debug);
      console.log('Debug info:', debug);

      console.log('Making request to:', fullUrl);
      const response = await axios({
        method: 'get',
        url: fullUrl,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        withCredentials: true,
        timeout: 30000 // 30 second timeout
      });
      
      console.log('Response received:', response);

      if (response?.data?.url) {
        console.log('Redirecting to:', response.data.url);
        window.location.href = response.data.url;
      } else {
        throw new Error('No authorization URL received');
      }
    } catch (error) {
      console.error('Connection error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        code: error.code
      });
      
      let errorMessage = 'Failed to connect to Xero';
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Connection timeout - the server is taking too long to respond. Please try again.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please try again.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Access denied. Please check your permissions.';
      } else if (error.response?.data?.error) {
        errorMessage = `Error: ${error.response.data.error}`;
      } else {
        errorMessage = `Error: ${error.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary-white">
      <nav className="bg-primary-navy text-white py-4 mb-8 shadow-lg">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
            LedgerLink
          </h1>
        </div>
      </nav>

      <div className="container mx-auto px-4 pt-8">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-8">
            <div className="flex items-center justify-center mb-6">
              <img 
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRK9TSFH5YNbmgR7PIcX8mG-sB-iBOLPTwfGe_iVjw&s" 
                alt="Xero logo" 
                className="h-12 w-12" 
              />
            </div>
            
            <h2 className="text-2xl font-bold text-center text-primary-navy mb-2">
              Connect to Xero
            </h2>
            <p className="text-secondary-gray text-center mb-8">
              Connect your Xero account to import your accounting data
            </p>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-red-700 font-medium mb-2">{error}</div>
                {debugInfo && (
                  <div className="text-sm">
                    <details>
                      <summary className="cursor-pointer text-red-600 hover:text-red-800">
                        Debug Information
                      </summary>
                      <pre className="mt-2 p-2 bg-red-50 rounded overflow-x-auto text-xs">
                        {JSON.stringify(debugInfo, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleConnect}
              disabled={isLoading}
              className={`w-full flex justify-center items-center py-3 px-4 rounded-lg font-medium text-white transition-colors ${isLoading ? 'bg-primary-teal/70 cursor-not-allowed' : 'bg-primary-teal hover:bg-teal-600'}`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Connecting to Xero...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Connect with Xero
                </>
              )}
            </button>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-secondary-gray">
                    Or go back to
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <a
                  href="/"
                  className="w-full flex justify-center items-center py-3 px-4 border border-gray-200 rounded-lg font-medium text-secondary-gray hover:bg-secondary-white transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                  CSV Upload
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default XeroAuth;