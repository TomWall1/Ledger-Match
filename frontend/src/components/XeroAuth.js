import React, { useState } from 'react';
import axios from 'axios';

const XeroAuth = () => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    console.log('Button clicked - starting connection');
    setIsLoading(true);
    setError(null);
    
    try {
      const apiUrl = `${process.env.REACT_APP_API_URL}/auth/xero`;
      console.log('Making request to:', apiUrl);

      const response = await axios({
        method: 'get',
        url: apiUrl,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response:', response);

      if (response?.data?.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error('No authorization URL received');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to connect to Xero. Please try again.');
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
