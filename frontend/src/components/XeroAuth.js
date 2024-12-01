import React, { useState } from 'react';
import axios from 'axios';

const XeroAuth = () => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Making request to:', `${process.env.REACT_APP_API_URL}/api/xero/auth-url`);
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/xero/auth-url`);
      console.log('Response:', response.data);
      
      if (response.data.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error('No authorization URL received');
      }
    } catch (error) {
      console.error('Error connecting to Xero:', error);
      setError(error.message || 'Failed to connect to Xero');
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
            <div className="mb-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              <p>{error}</p>
            </div>
          )}

          <button
            onClick={handleConnect}
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {isLoading ? 'Connecting...' : 'Connect to Xero'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default XeroAuth;
