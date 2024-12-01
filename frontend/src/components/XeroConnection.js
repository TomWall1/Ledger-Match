import React, { useState, useEffect } from 'react';
import axios from 'axios';

const XeroConnection = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  const handleConnect = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/xero/auth-url`);
      window.location.href = response.data.url;
    } catch (error) {
      setError('Error connecting to Xero');
      console.error('Error:', error);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Connect to Xero</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {!isConnected && (
        <button
          onClick={handleConnect}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          Connect Xero Account
        </button>
      )}
    </div>
  );
};

export default XeroConnection;
