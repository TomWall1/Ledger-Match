import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileUpload } from '../components/FileUpload';
import DateFormatSelect from '../components/DateFormatSelect';

const Upload = () => {
  const [files, setFiles] = useState({ ar: null, ap: null });
  const [dateFormats, setDateFormats] = useState({ ar: 'MM/DD/YYYY', ap: 'MM/DD/YYYY' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isXeroAuthenticated, setIsXeroAuthenticated] = useState(false);
  const [xeroData, setXeroData] = useState(null);
  const [sourceType, setSourceType] = useState('csv');

  useEffect(() => {
    checkXeroAuth();
  }, []);

  const checkXeroAuth = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'https://ledger-match-backend.onrender.com';
      const response = await fetch(`${apiUrl}/auth/xero/status`);
      if (response.ok) {
        const data = await response.json();
        setIsXeroAuthenticated(data.isAuthenticated);
      }
    } catch (error) {
      console.error('Error checking Xero auth status:', error);
    }
  };

  const handleXeroSelect = async (customerId) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const apiUrl = process.env.REACT_APP_API_URL || 'https://ledger-match-backend.onrender.com';
      const response = await fetch(`${apiUrl}/auth/xero/customer/${customerId}/invoices`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch Xero data');
      }

      const data = await response.json();
      setXeroData(data);
      setFiles(prev => ({ ...prev, ar: { type: 'xero', data: data.invoices } }));
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMatch = async () => {
    if (!files.ar || !files.ap) {
      setError('Please upload both AR and AP files');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      
      // Handle AR data (either CSV or Xero)
      if (files.ar.type === 'csv') {
        formData.append('company1File', files.ar.file);
      } else if (files.ar.type === 'xero') {
        formData.append('company1Data', JSON.stringify(files.ar.data));
      }

      formData.append('company2File', files.ap);
      formData.append('dateFormat1', dateFormats.ar);
      formData.append('dateFormat2', dateFormats.ap);

      const apiUrl = process.env.REACT_APP_API_URL || 'https://ledger-match-backend.onrender.com';
      const response = await fetch(`${apiUrl}/api/match`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to process files');
      }

      const results = await response.json();
      navigate('/results', { state: { results } });
    } catch (error) {
      setError(error.message || 'Error processing files');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-[#1B365D]">Upload Files</h1>
          <Link
            to="/"
            className="flex items-center text-[#1B365D] hover:text-[#00A4B4] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Home
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-[#1B365D]">Accounts Receivable Data</h2>
            {isXeroAuthenticated && (
              <div className="mb-4">
                <div className="flex space-x-4">
                  <button
                    onClick={() => setSourceType('csv')}
                    className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors
                      ${sourceType === 'csv' 
                        ? 'bg-[#1B365D] text-white' 
                        : 'bg-white text-[#1B365D] border border-[#1B365D] hover:bg-[#1B365D] hover:bg-opacity-5'}`}
                  >
                    Upload CSV
                  </button>
                  <button
                    onClick={() => setSourceType('xero')}
                    className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors
                      ${sourceType === 'xero' 
                        ? 'bg-[#13B5EA] text-white' 
                        : 'bg-white text-[#13B5EA] border border-[#13B5EA] hover:bg-[#13B5EA] hover:bg-opacity-5'}`}
                  >
                    From Xero
                  </button>
                </div>
              </div>
            )}
            <div className="space-y-4">
              {(sourceType === 'csv' || !isXeroAuthenticated) ? (
                <>
                  <FileUpload
                    onFileSelected={(file) => setFiles(prev => ({ ...prev, ar: { type: 'csv', file } }))}
                    accept=".csv"
                    label="Upload AR CSV"
                  />
                  {files.ar?.type === 'csv' && files.ar.file && (
                    <p className="text-sm text-green-600">
                      ✓ {files.ar.file.name} uploaded
                    </p>
                  )}
                  <DateFormatSelect
                    selectedFormat={dateFormats.ar}
                    onChange={(format) => setDateFormats(prev => ({ ...prev, ar: format }))}
                    label="Select Date Format"
                  />
                </>
              ) : (
                <div className="space-y-4">
                  <p className="text-[#647789]">
                    Select a customer to import their invoices
                  </p>
                  {/* Implement Xero customer selection here */}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-[#1B365D]">Accounts Payable Data</h2>
            <div className="space-y-4">
              <FileUpload
                onFileSelected={(file) => setFiles(prev => ({ ...prev, ap: file }))}
                accept=".csv"
                label="Upload AP CSV"
              />
              {files.ap && (
                <p className="text-sm text-green-600">
                  ✓ {files.ap.name} uploaded
                </p>
              )}
              <DateFormatSelect
                selectedFormat={dateFormats.ap}
                onChange={(format) => setDateFormats(prev => ({ ...prev, ap: format }))}
                label="Select Date Format"
              />
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <button
            onClick={handleMatch}
            disabled={!files.ar || !files.ap || isLoading}
            className={`
              px-8 py-3 rounded-lg font-medium flex items-center transition-colors
              ${(!files.ar || !files.ap || isLoading)
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-[#00A4B4] hover:bg-[#008999] text-white'
              }
            `}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                Match Records
              </>
            )}
          </button>
        </div>

        <div className="mt-8 bg-[#1B365D] bg-opacity-5 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-3 text-[#1B365D]">
            Data Requirements
          </h2>
          <div>
            <h3 className="font-medium text-[#1B365D] mb-2">Required Fields:</h3>
            <ul className="list-disc list-inside space-y-1 text-[#647789]">
              <li>transaction_number</li>
              <li>transaction_type</li>
              <li>amount (decimal number)</li>
              <li>issue_date</li>
              <li>due_date</li>
              <li>status</li>
              <li>reference</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;