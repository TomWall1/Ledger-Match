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
      console.log('Received authorization code:', code);
      
      if (!code) {
        setError('No authorization code received');
        return;
      }

      try {
        console.log('Making callback request to:', `${process.env.REACT_APP_API_URL}/auth/xero/callback`);
        const response = await axios.post(
          `${process.env.REACT_APP_API_URL}/auth/xero/callback`,
          { code },
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        console.log('Callback response:', response);

        if (response.data.success) {
          navigate('/dashboard');
        } else {
          throw new Error('Failed to complete Xero connection');
        }
      } catch (error) {
        console.error('Error in Xero callback:', error);
        setError(error.response?.data?.error || 'Error connecting to Xero');
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Connecting to Xero...</h2>
      
      {error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      ) : (
        <p>Please wait while we complete your connection to Xero.</p>
      )}
    </div>
  );
};
