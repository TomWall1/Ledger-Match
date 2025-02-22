import React, { useState, useEffect } from 'react';
import { FileUpload } from './FileUpload';
import DateFormatSelect from './DateFormatSelect';

const ARSourceSelector = ({ onFileSelected, onDateFormatChange, selectedDateFormat, file, isXeroAuthenticated }) => {
  const [sourceType, setSourceType] = useState('csv');
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (sourceType === 'xero' && isXeroAuthenticated) {
      fetchCustomers();
    }
  }, [sourceType, isXeroAuthenticated]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const apiUrl = process.env.REACT_APP_API_URL || 'https://ledger-match-backend.onrender.com';
      const response = await fetch(`${apiUrl}/auth/xero/customers`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }

      const data = await response.json();
      console.log('Fetched customers:', data);
      setCustomers(data.customers || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setError('Failed to load customers from Xero');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSelect = async (customer) => {
    try {
      setLoading(true);
      setError(null);
      console.log('Selected customer:', customer);
      
      const apiUrl = process.env.REACT_APP_API_URL || 'https://ledger-match-backend.onrender.com';
      const response = await fetch(`${apiUrl}/auth/xero/customer/${customer.ContactID}/invoices`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch customer invoices');
      }

      const data = await response.json();
      console.log('Fetched invoices:', data);
      
      // Notify parent component with the Xero data
      onFileSelected({
        type: 'xero',
        data: data.invoices,
        name: customer.Name || 'Selected Customer'
      });

      setSelectedCustomer(customer.ContactID);
    } catch (error) {
      console.error('Error fetching customer invoices:', error);
      setError('Failed to load customer invoices from Xero');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {isXeroAuthenticated && (
        <div className="flex space-x-4 mb-4">
          <button
            onClick={() => setSourceType('csv')}
            className={`px-4 py-2 rounded-lg ${sourceType === 'csv' ? 
              'bg-blue-600 text-white' : 
              'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            Upload CSV
          </button>
          <button
            onClick={() => setSourceType('xero')}
            className={`px-4 py-2 rounded-lg ${sourceType === 'xero' ? 
              'bg-blue-600 text-white' : 
              'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            From Xero
          </button>
        </div>
      )}

      {sourceType === 'csv' || !isXeroAuthenticated ? (
        <div className="space-y-4">
          <FileUpload 
            onFileSelected={(file) => onFileSelected({ type: 'csv', file })} 
            accept=".csv"
            label="Upload Accounts Receivable CSV"
          />
          {file?.type === 'csv' && file.file && (
            <p className="mt-2 text-sm text-green-600">
              ✓ {file.file.name} uploaded
            </p>
          )}
          <DateFormatSelect
            selectedFormat={selectedDateFormat}
            onChange={onDateFormatChange}
            label="Select Date Format"
          />
        </div>
      ) : (
        <div className="space-y-4">
          {loading ? (
            <div className="text-gray-600">
              <svg className="inline animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {selectedCustomer ? 'Loading invoices...' : 'Loading customers...'}
            </div>
          ) : error ? (
            <div className="text-red-600">
              {error}
              <button 
                onClick={fetchCustomers}
                className="ml-2 text-blue-600 hover:text-blue-800 underline"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto border rounded-lg">
              {customers.length === 0 ? (
                <p className="p-4 text-gray-600">No customers found in Xero</p>
              ) : (
                <ul className="divide-y">
                  {customers.map(customer => (
                    <li 
                      key={customer.ContactID}
                      className={`p-4 cursor-pointer hover:bg-gray-50 ${selectedCustomer === customer.ContactID ? 'bg-blue-50' : ''}`}
                      onClick={() => handleCustomerSelect(customer)}
                    >
                      <div className="font-medium">{customer.Name}</div>
                      <div className="text-sm text-gray-600">
                        Balance: ${customer.Balances?.AccountsReceivable?.Outstanding || '0.00'}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ARSourceSelector;