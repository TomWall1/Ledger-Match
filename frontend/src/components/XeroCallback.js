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
      
      if (code) {
        try {
          await axios.post(`${process.env.REACT_APP_API_URL}/api/xero/callback`, { code });
          navigate('/dashboard');
        } catch (error) {
          setError('Error connecting to Xero');
          console.error('Error:', error);
        }
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

export default XeroCallback;
