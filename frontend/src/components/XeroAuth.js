import React, { useState } from 'react';
import axios from 'axios';

const XeroAuth = () => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);

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
          'Accept': 'application/json'
        },
        timeout: 10000 // 10 second timeout
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
      setError(`Failed to connect to Xero: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Connect to Xero
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
              <div className="font-bold mb-2">{error}</div>
              {debugInfo && (
                <div className="text-sm">
                  <details>
                    <summary className="cursor-pointer">Debug Information</summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded overflow-x-auto">
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
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            {isLoading ? 'Connecting...' : 'Connect to Xero'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default XeroAuth;
