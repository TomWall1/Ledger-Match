import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const XeroAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleConnect = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('https://ledger-match-backend.onrender.com/auth/xero', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to connect to Xero');
      }

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No authorization URL received');
      }
    } catch (error) {
      console.error('Xero connection error:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-[#1B365D] text-white py-4 shadow-lg">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
            LedgerLink
          </h1>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-8">
            <div className="flex items-center justify-center mb-6">
              <img 
                src="https://www.xero.com/content/dam/xero/pilot-images/logo/x_secondary_blue_RGB.svg" 
                alt="Xero logo" 
                className="h-12" 
              />
            </div>
            
            <h2 className="text-2xl font-bold text-center text-[#1B365D] mb-2">
              Connect to Xero
            </h2>
            <p className="text-[#647789] text-center mb-8">
              Connect your Xero account to import your accounting data
            </p>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-red-700 font-medium">{error}</div>
              </div>
            )}

            <button
              onClick={handleConnect}
              disabled={isLoading}
              className={`w-full flex justify-center items-center py-3 px-4 rounded-lg font-medium text-white transition-colors
                ${isLoading ? 'bg-[#13B5EA]/70 cursor-not-allowed' : 'bg-[#13B5EA] hover:bg-[#0FA3D4]'}`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Connecting to Xero...
                </>
              ) : (
                <>
                  <img 
                    src="https://www.xero.com/content/dam/xero/pilot-images/logo/x_secondary_blue_RGB.svg" 
                    alt="Xero logo" 
                    className="w-5 h-5 mr-2 filter brightness-0 invert" 
                  />
                  Connect with Xero
                </>
              )}
            </button>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-[#647789]">
                    Or go back to
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <a
                  href="/"
                  className="w-full flex justify-center items-center py-3 px-4 border border-gray-200 rounded-lg font-medium text-[#647789] hover:bg-gray-50 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                  CSV Upload
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default XeroAuth;