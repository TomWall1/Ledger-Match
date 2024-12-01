import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const XeroConnection = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const navigate = useNavigate();

  const handleConnect = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/xero/auth/url`);
      window.location.href = response.data.authorization_url;
    } catch (error) {
      console.error('Error connecting to Xero:', error);
    }
  };

  const handleCustomerSelect = async (customerId) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/xero/customer/${customerId}/invoices`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('xero_token')}`
          }
        }
      );
      // Store the invoices data and move to matching screen
      localStorage.setItem('ar_data', JSON.stringify(response.data.invoices));
      navigate('/match');
    } catch (error) {
      console.error('Error fetching customer invoices:', error);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Connect to Xero</h2>
      
      {!isConnected ? (
        <button
          onClick={handleConnect}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Connect to Xero
        </button>
      ) : (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Select Customer</h3>
          <select
            onChange={(e) => handleCustomerSelect(e.target.value)}
            className="border p-2 rounded w-full max-w-md"
          >
            <option value="">Select a customer...</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default XeroConnection;
