import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function XeroCallback() {
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');

    if (!code) {
      setError('No authorization code received');
      return;
    }

    const exchangeCode = async () => {
      try {
        const response = await fetch('https://ledger-match-backend.onrender.com/auth/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        });

        if (!response.ok) {
          throw new Error('Failed to exchange code');
        }

        // Redirect to home with authentication flag
        navigate('/?authenticated=true');
      } catch (err) {
        setError(err.message);
      }
    };

    exchangeCode();
  }, [location.search, navigate]);

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
        <p>Processing Xero authentication...</p>
      </div>
    </div>
  );
}

export default XeroCallback;