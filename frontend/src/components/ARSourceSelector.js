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
              'bg-xero-blue text-white' : 
              'bg-secondary-white text-secondary-gray border border-xero-blue hover:bg-xero-blue hover:bg-opacity-10'}`}
          >
            <img 
              src="https://www.xero.com/etc/designs/xero/public/assets/images/xero-logo-new.svg" 
              alt="Xero logo" 
              className={`w-5 h-5 mr-2 ${sourceType !== 'xero' && 'filter brightness-0 opacity-60'}`}
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
            <div className="text-secondary-gray p-8 text-center">
              <svg className="inline animate-spin h-8 w-8 text-xero-blue mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <div>{selectedCustomer ? 'Loading invoices...' : 'Loading customers...'}</div>
            </div>
          ) : error ? (
            <div className="text-red-600 p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="font-medium mb-2">{error}</div>
              <button 
                onClick={fetchCustomers}
                className="text-xero-blue hover:text-xero-hover underline flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Retry
              </button>
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto border rounded-lg divide-y divide-gray-200 bg-white">
              {customers.length === 0 ? (
                <p className="p-8 text-center text-secondary-gray">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-secondary-gray" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  No customers found in Xero
                </p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {customers.map(customer => (
                    <li 
                      key={customer.ContactID}
                      className={`p-4 cursor-pointer hover:bg-xero-blue hover:bg-opacity-5 transition-colors
                        ${selectedCustomer === customer.ContactID ? 'bg-xero-blue bg-opacity-10' : ''}`}
                      onClick={() => handleCustomerSelect(customer)}
                    >
                      <div className="font-medium text-primary-navy">{customer.Name}</div>
                      <div className="text-sm text-secondary-gray mt-1">
                        Outstanding Balance: {customer.Balances?.AccountsReceivable?.Outstanding ? 
                          new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
                            .format(customer.Balances.AccountsReceivable.Outstanding) : 
                          '$0.00'
                        }
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