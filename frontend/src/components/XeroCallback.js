import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { AuthUtils } from '../utils/auth';

const XeroCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const scope = searchParams.get('scope');
      
      const debug = {
        code: code ? 'Present' : 'Missing',
        scope: scope || 'Missing',
        url: window.location.href
      };
      setDebugInfo(debug);
      console.log('XeroCallback initiated with:', debug);

      if (!code) {
        setError('No authorization code received from Xero');
        return;
      }

      try {
        const apiUrl = process.env.REACT_APP_API_URL || 'https://ledger-match-backend.onrender.com';
        console.log('Sending code to backend:', { code, apiUrl });

        // Change to GET request with code as query parameter
        const response = await axios.get(
          `${apiUrl}/auth/xero/callback?code=${encodeURIComponent(code)}`,
          {
            headers: {
              'Content-Type': 'application/json'
            },
            timeout: 10000 // 10 second timeout
          }
        );

        console.log('Backend response:', response.data);

        if (response.data.success) {
          console.log('Authentication successful');
          AuthUtils.setAuthState({ 
            isAuthenticated: true,
            tenants: response.data.tenants
          });
          navigate('/');
        } else {
          throw new Error(response.data.error || 'Unexpected response from server');
        }
      } catch (error) {
        console.error('Error during callback:', error.response?.data || error);
        const errorMessage = error.response?.data?.details || error.message;
        setError(errorMessage);
        setDebugInfo(prev => ({
          ...prev,
          error: {
            message: errorMessage,
            status: error.response?.status,
            data: error.response?.data
          }
        }));
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-bold text-gray-900 mb-4">
          Connecting to Xero
        </h2>
        
        {error ? (
          <div className="rounded-md bg-red-50 p-4 mt-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error connecting to Xero</h3>
                <p className="mt-2 text-sm text-red-700">{error}</p>
                {debugInfo && (
                  <div className="mt-2">
                    <details>
                      <summary className="text-sm cursor-pointer text-red-600">Debug Information</summary>
                      <pre className="mt-2 text-xs bg-red-50 p-2 rounded overflow-x-auto">
                        {JSON.stringify(debugInfo, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
                <div className="mt-4">
                  <button
                    onClick={() => navigate('/auth/xero')}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-2 text-center text-sm text-gray-600">
            <svg className="inline animate-spin h-5 w-5 text-blue-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Completing your connection to Xero...
          </div>
        )}
      </div>
    </div>
  );
};

export default XeroCallback;
