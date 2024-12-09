import React, { useState } from 'react';
import axios from 'axios';

const XeroAuth = () => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const apiUrl = `${process.env.REACT_APP_API_URL}/auth/xero`;
      console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
      console.log('Full API URL:', apiUrl);
      
      const response = await axios.get(apiUrl, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      console.log('Full Response:', response);
      
      if (response.data.url) {
        console.log('Redirecting to:', response.data.url);
        window.location.href = response.data.url;
      } else {
        throw new Error('No authorization URL received');
      }
    } catch (error) {
      console.error('Detailed Error:', {
        message: error.message,
        response: error.response,
        config: error.config
      });
      setError(
        error.response?.data?.error || 
        error.message || 
        'Failed to connect to Xero. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
};

  const getErrorMessage = (error) => {
    if (error.includes('Failed to connect')) {
      return (
        <div>
          <p className="font-semibold">Connection Error</p>
          <p>Unable to connect to Xero at this time. Please try again later.</p>
        </div>
      );
    }
    return <p>{error}</p>;
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
            <div className="mb-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              {getErrorMessage(error)}
            </div>
          )}

          <button
            onClick={handleConnect}
            disabled={isLoading}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
              ${isLoading 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Connecting...
              </span>
            ) : (
              'Connect to Xero'
            )}
          </button>

          <div className="mt-4 text-sm text-gray-500 text-center">
            <p>You'll be redirected to Xero to authorize the connection</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default XeroAuth;
