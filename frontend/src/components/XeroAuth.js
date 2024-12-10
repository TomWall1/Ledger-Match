import React, { useState } from 'react';
import axios from 'axios';

const XeroAuth = () => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    console.log('Button clicked - starting Xero connection process');
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Current environment:', {
        NODE_ENV: process.env.NODE_ENV,
        API_URL: process.env.REACT_APP_API_URL
      });

      const apiUrl = `${process.env.REACT_APP_API_URL}/auth/xero`;
      console.log('Attempting to connect to:', apiUrl);

      const response = await axios({
        method: 'get',
        url: apiUrl,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log('Response received:', response);

      if (response?.data?.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error('No authorization URL received from server');
      }
    } catch (error) {
      console.error('Connection error:', error);
      setError(error.response?.data?.error || error.message || 'Failed to connect to Xero');
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
        <p className="mt-2 text-center text-sm text-gray-600">
          Connect your Xero account to sync your financial data
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
              <p>{error}</p>
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
