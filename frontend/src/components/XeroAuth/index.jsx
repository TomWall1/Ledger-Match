import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const XeroAuth = () => {
  const [authStatus, setAuthStatus] = useState('idle');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const error = params.get('error');

    if (code) {
      handleAuthCallback(code);
    } else if (error) {
      setError(`Authentication failed: ${error}`);
      setAuthStatus('error');
    }
  }, []);

  const handleConnectToXero = async () => {
    try {
      setAuthStatus('connecting');
      const response = await fetch('/api/auth/xero/connect');
      const data = await response.json();

      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        throw new Error('Failed to get authorization URL');
      }
    } catch (err) {
      setError('Failed to connect to Xero. Please try again.');
      setAuthStatus('error');
    }
  };

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
        navigate('/dashboard');
      } else {
        throw new Error(data.message || 'Authentication failed');
      }
    } catch (err) {
      setError(err.message);
      setAuthStatus('error');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="p-8 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Connect to Xero</h2>
        
        {authStatus === 'idle' && (
          <button
            onClick={handleConnectToXero}
            className="w-full px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
          >
            Connect with Xero
          </button>
        )}

        {authStatus === 'connecting' && (
          <div className="text-gray-600">
            Connecting to Xero...
          </div>
        )}

        {authStatus === 'authenticating' && (
          <div className="text-gray-600">
            Completing authentication...
          </div>
        )}

        {authStatus === 'error' && (
          <div className="text-red-500">
            <p className="mb-4">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setAuthStatus('idle');
              }}
              className="w-full px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default XeroAuth;