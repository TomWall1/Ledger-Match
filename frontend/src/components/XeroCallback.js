import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const XeroCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Process the callback immediately
  React.useEffect(() => {
    // Navigate to the main app with authenticated flag
    navigate('/?authenticated=true');
  }, [navigate]);

  return (
    <div className="min-h-screen bg-secondary-white flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md text-center">
        <svg className="animate-spin h-10 w-10 text-xero-blue mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <h2 className="text-xl font-semibold mb-2 text-primary-navy">Finishing Xero Connection</h2>
        <p className="text-secondary-gray">Please wait while we complete your Xero connection...</p>
      </div>
    </div>
  );
};

export default XeroCallback;