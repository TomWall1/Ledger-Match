import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const XeroCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
  const handleCallback = async () => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');  // Get state from URL
    console.log('Received from Xero:', { code, state });

    if (!code) {
      setError('No authorization code received');
      return;
    }

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/auth/xero/callback`,
        { code, state },  // Pass both code and state
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Callback response:', response.data);

      if (response.data.success) {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error details:', error);
      const errorMessage = error.response?.data?.details || error.message;
      setError(errorMessage);
    }
  };

  handleCallback();
}, [searchParams, navigate]);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Connecting to Xero...</h2>
      
      {error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">Error connecting to Xero:</p>
          <p>{error}</p>
        </div>
      ) : (
        <p>Please wait while we complete your connection to Xero.</p>
      )}
    </div>
  );
};

export default XeroCallback;
