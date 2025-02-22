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
            className={`flex items-center px-4 py-2 rounded-lg ${sourceType === 'csv' ? 
              'bg-primary-navy text-white' : 
              'bg-secondary-white text-secondary-gray hover:bg-gray-100'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Upload CSV
          </button>
          <button
            onClick={() => setSourceType('xero')}
            className={`flex items-center px-4 py-2 rounded-lg ${sourceType === 'xero' ? 
              'bg-primary-navy text-white' : 
              'bg-secondary-white text-secondary-gray hover:bg-gray-100'}`}
          >
            <img 
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRK9TSFH5YNbmgR7PIcX8mG-sB-iBOLPTwfGe_iVjw&s" 
              alt="Xero logo" 
              className="w-4 h-4 mr-2" 
            />
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
            <p className="mt-2 text-sm text-accent-green">
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
            <div className="text-secondary-gray">
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
                className="ml-2 text-accent-blue hover:text-blue-800 underline"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto border rounded-lg bg-white">
              {customers.length === 0 ? (
                <p className="p-4 text-secondary-gray">No customers found in Xero</p>
              ) : (
                <ul className="divide-y">
                  {customers.map(customer => (
                    <li 
                      key={customer.ContactID}
                      className={`p-4 cursor-pointer hover:bg-secondary-white 
                        ${selectedCustomer === customer.ContactID ? 'bg-primary-teal bg-opacity-10' : ''}`}
                      onClick={() => handleCustomerSelect(customer)}
                    >
                      <div className="font-medium text-primary-navy">{customer.Name}</div>
                      <div className="text-sm text-secondary-gray">
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