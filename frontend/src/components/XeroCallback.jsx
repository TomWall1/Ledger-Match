import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useXero } from '../context/XeroContext';
import NavHeader from './NavHeader';

const XeroCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const { setIsAuthenticated } = useXero();

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code) {
      setError('No authorization code received');
      return;
    }

    const handleCallback = async () => {
      try {
        const apiUrl = process.env.REACT_APP_API_URL || 'https://ledger-match-backend.onrender.com';
        const response = await fetch(`${apiUrl}/auth/xero/callback?code=${code}&state=${state}`);

        if (!response.ok) {
          throw new Error('Failed to complete authentication');
        }

        // Force authentication state to true
        setIsAuthenticated(true);
        localStorage.setItem('xeroAuth', 'true');
        
        // Redirect to upload page with Xero enabled
        navigate('/upload', { state: { xeroEnabled: true } });
      } catch (error) {
        console.error('Xero callback error:', error);
        setError(error.message);
      }
    };

    handleCallback();
  }, [searchParams, navigate, setIsAuthenticated]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavHeader />
        <div className="max-w-7xl mx-auto p-6 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
            <div className="text-red-600 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-xl font-semibold text-center mb-2">Authentication Error</h2>
              <p className="text-center">{error}</p>
            </div>
            <button
              onClick={() => navigate('/upload')}
              className="w-full bg-[#1B365D] text-white py-2 px-4 rounded-lg hover:bg-opacity-90 transition-colors"
            >
              Return to Upload
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavHeader />
      <div className="max-w-7xl mx-auto p-6 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#13B5EA] mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-[#1B365D] mb-2">Completing Authentication</h2>
          <p className="text-[#647789]">Please wait while we connect your Xero account...</p>
        </div>
      </div>
    </div>
  );
};

export default XeroCallback;