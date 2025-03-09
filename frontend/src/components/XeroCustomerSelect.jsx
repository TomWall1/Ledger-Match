import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const XeroCustomerSelect = ({ onCustomerSelect }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const apiUrl = process.env.REACT_APP_API_URL || 'https://ledger-match-backend.onrender.com';
      // Removed cache-control headers that were causing CORS issues
      const response = await fetch(`${apiUrl}/auth/xero/customers`);
      
      if (!response.ok) {
        // Handle 401 Unauthorized specifically
        if (response.status === 401) {
          // Clear authentication state and redirect to reconnect
          localStorage.removeItem('xeroAuth');
          throw new Error('Your Xero session has expired. Please reconnect.');
        }
        throw new Error('Failed to fetch customers');
      }

      const data = await response.json();
      setCustomers(data.customers || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setError('Failed to load customers from Xero: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReconnect = () => {
    // Clear auth state and redirect to Xero auth
    localStorage.removeItem('xeroAuth');
    navigate('/auth/xero');
  };

  const handleCustomerSelect = async (customer) => {
    try {
      setLoading(true);
      setError(null);
      
      const apiUrl = process.env.REACT_APP_API_URL || 'https://ledger-match-backend.onrender.com';
      // Removed cache-control headers that were causing CORS issues
      const response = await fetch(`${apiUrl}/auth/xero/customer/${customer.ContactID}/invoices`);
      
      if (!response.ok) {
        // Handle 401 Unauthorized specifically
        if (response.status === 401) {
          // Clear authentication state and redirect to reconnect
          localStorage.removeItem('xeroAuth');
          throw new Error('Your Xero session has expired. Please reconnect.');
        }
        throw new Error('Failed to fetch customer invoices');
      }

      const data = await response.json();
      setSelectedCustomer(customer);
      onCustomerSelect({ ...data, customerName: customer.Name });
    } catch (error) {
      setError(error.message || 'Failed to load customer invoices. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#13B5EA] mx-auto mb-4"></div>
        <p className="text-[#647789]">
          {selectedCustomer ? 'Loading invoices...' : 'Loading customers...'}
        </p>
      </div>
    );
  }

  if (error) {
    const isAuthError = error.includes('session has expired');
    
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700 mb-2">{error}</p>
        {isAuthError ? (
          <button 
            onClick={handleReconnect}
            className="bg-[#13B5EA] text-white px-4 py-2 mt-2 rounded-lg hover:bg-opacity-90 transition-colors flex items-center"
          >
            <img 
              src="/xero-logo.svg" 
              alt="Xero logo" 
              className="w-5 h-5 mr-2"
            />
            Reconnect to Xero
          </button>
        ) : (
          <button 
            onClick={fetchCustomers}
            className="text-[#13B5EA] hover:underline flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            Try Again
          </button>
        )}
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="p-8 text-center">
        <img 
          src="/xero-logo.svg" 
          alt="Xero Logo" 
          className="h-12 w-12 mx-auto mb-4 opacity-30"
        />
        <p className="text-[#647789]">No customers found in your Xero account</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg divide-y divide-gray-200 bg-white overflow-hidden max-h-60 overflow-y-auto">
      <div className="bg-[#13B5EA] bg-opacity-10 p-3 flex items-center">
        <img 
          src="/xero-logo.svg" 
          alt="Xero logo" 
          className="w-5 h-5 mr-2"
        />
        <span className="font-medium text-[#1B365D]">Xero Customers</span>
      </div>
      {customers.map(customer => (
        <button
          key={customer.ContactID}
          className={`w-full text-left p-4 hover:bg-[#13B5EA] hover:bg-opacity-5 transition-colors
            ${selectedCustomer?.ContactID === customer.ContactID ? 'bg-[#13B5EA] bg-opacity-10' : ''}`}
          onClick={() => handleCustomerSelect(customer)}
        >
          <div className="font-medium text-[#1B365D]">{customer.Name}</div>
          <div className="text-sm text-[#647789] mt-1">
            Outstanding Balance: {customer.Balances?.AccountsReceivable?.Outstanding
              ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
                  .format(customer.Balances.AccountsReceivable.Outstanding)
              : '$0.00'
            }
          </div>
        </button>
      ))}
    </div>
  );
};

export default XeroCustomerSelect;