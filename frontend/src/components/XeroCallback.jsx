import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const XeroCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      if (code) {
        try {
          const response = await axios.post(
            `${process.env.REACT_APP_API_URL}/xero/auth/callback`,
            { code }
          );
          localStorage.setItem('xero_token', response.data.access_token);
          navigate('/xero-connection');
        } catch (error) {
          console.error('Error handling Xero callback:', error);
          navigate('/');
        }
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">Connecting to Xero...</h2>
      <p className="mt-2">Please wait while we complete the connection.</p>
    </div>
  );
};

export default XeroCallback;
