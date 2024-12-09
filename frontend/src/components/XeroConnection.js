import React, { useState, useEffect } from 'react';
import axios from 'axios';

const XeroConnection = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [organizations, setOrganizations] = useState([]);

  // Check if connected to Xero and fetch organizations
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/auth/xero/organizations`);
        if (response.data.organizations && response.data.organizations.length > 0) {
          setIsConnected(true);
          setOrganizations(response.data.organizations);
        }
      } catch (error) {
        console.error('Error checking Xero connection:', error);
        // Don't set error state here as the user might not be connected yet
        setIsConnected(false);
      }
    };

    checkConnection();
  }, []);

  const handleConnect = async () => {
    try {
      setError(null);
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/auth/xero`);
      if (response.data.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error('No authorization URL received');
      }
    } catch (error) {
      setError('Error connecting to Xero. Please try again.');
      console.error('Error:', error);
    }
  };

  const handleDisconnect = async () => {
    try {
      setError(null);
      // You might want to implement a disconnect endpoint in your backend
      // await axios.post(`${process.env.REACT_APP_API_URL}/auth/xero/disconnect`);
      setIsConnected(false);
      setOrganizations([]);
    } catch (error) {
      setError('Error disconnecting from Xero');
      console.error('Error:', error);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Xero Integration</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {isConnected ? (
        <div className="space-y-4">
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            Connected to Xero
          </div>
          
          {organizations.length > 0 && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Connected Organizations:</h3>
              <ul className="list-disc pl-5">
                {organizations.map((org) => (
                  <li key={org.tenantId}>
                    {org.tenantName}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={handleDisconnect}
            className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600 transition-colors"
          >
            Disconnect from Xero
          </button>
        </div>
      ) : (
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
