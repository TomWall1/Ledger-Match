import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import MatchingResults from './components/MatchingResults.jsx';
import DateFormatSelect from './components/DateFormatSelect.jsx';
import XeroAuth from './components/XeroAuth.js';
import XeroCallback from './components/XeroCallback.js';
import ARSourceSelector from './components/ARSourceSelector.js';
import { FileUpload } from './components/FileUpload.jsx';
import { AuthUtils } from './utils/auth.js';
import { TestUpload } from './components/TestUpload.jsx';

function MainApp() {
  const [currentScreen, setCurrentScreen] = useState('upload');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();
  const [matches, setMatches] = useState({
    totals: {
      company1Total: "0.00",
      company2Total: "0.00",
      variance: "0.00"
    },
    perfectMatches: [],
    mismatches: [],
    unmatchedItems: {
      company1: [],
      company2: []
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [files, setFiles] = useState({
    company1: null,
    company2: null
  });
  const [dateFormats, setDateFormats] = useState({
    company1: 'YYYY-MM-DD',
    company2: 'YYYY-MM-DD'
  });

  useEffect(() => {
    const checkAuth = async () => {
      const params = new URLSearchParams(location.search);
      const authenticated = params.get('authenticated');
      
      if (authenticated === 'true') {
        AuthUtils.setAuthState({ isAuthenticated: true });
        setIsAuthenticated(true);
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        const authStatus = await AuthUtils.verifyAuth();
        setIsAuthenticated(authStatus);
      }
    };
    checkAuth();
  }, [location.search]);

  const handleFileUpload = (companyKey, fileData) => {
    setFiles(prev => ({
      ...prev,
      [companyKey]: fileData
    }));
    setError(null);
  };

  const handleDateFormatChange = (companyKey, format) => {
    setDateFormats(prev => ({
      ...prev,
      [companyKey]: format
    }));
  };

  const processFile = async (file, dateFormat) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('dateFormat', dateFormat);

    console.log('Sending file:', {
      name: file.name,
      size: file.size,
      type: file.type,
      dateFormat: dateFormat
    });

    const response = await fetch('https://ledger-match-backend.onrender.com/process-csv', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const responseData = await response.json();
      console.error('Server error:', responseData);
      throw new Error(`Failed to process CSV file: ${JSON.stringify(responseData)}`);
    }

    return response.json();
  };

  const handleProcessFiles = async () => {
    if (!files.company1 || !files.company2) {
      setError('Please provide both sets of data before proceeding');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let company1Data, company2Data;

      // Process company 1 data (AR)
      if (files.company1.type === 'csv') {
        company1Data = await processFile(files.company1.file, dateFormats.company1);
      } else {
        company1Data = files.company1.data;
      }

      // Process company 2 data (AP)
      company2Data = await processFile(files.company2.file, dateFormats.company2);

      // Perform matching
      const matchResults = await fetch('https://ledger-match-backend.onrender.com/match-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          company1Data,
          company2Data
        })
      });

      if (!matchResults.ok) {
        const errorData = await matchResults.json();
        console.error('Match error:', errorData);
        throw new Error(`Failed to match data: ${JSON.stringify(errorData)}`);
      }

      const results = await matchResults.json();
      setMatches(results);
      setCurrentScreen('results');
    } catch (error) {
      console.error('Error processing files:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplateDownload = () => {
    const template = 'transaction_number,transaction_type,amount,issue_date,due_date,status,reference\nINV-001,Invoice,1000.00,2024-01-01,2024-02-01,Open,PO-123\nPYMT-001,Payment,-500.00,2024-01-15,2024-01-15,Open,INV-001';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-secondary-white">
      <nav className="bg-primary-navy text-white py-4 mb-8 shadow-lg">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
            LedgerLink
          </h1>
          {!isAuthenticated && (
            <a 
              href="/auth/xero"
              className="flex items-center px-4 py-2 bg-xero-blue text-white rounded-lg hover:bg-xero-hover transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
              Connect to Xero
            </a>
          )}
        </div>
      </nav>

      <div className="container mx-auto px-4">
        {currentScreen === 'upload' ? (
          <div className="space-y-8">
            {error && (
              <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleTemplateDownload}
                className="px-4 py-2 text-sm bg-primary-teal text-white rounded hover:bg-teal-600"
              >
                Download Template CSV
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
              <h2 className="text-lg font-semibold mb-4 text-primary-navy">Accounts Receivable Ledger</h2>
              <ARSourceSelector 
                onFileSelected={(data) => handleFileUpload('company1', data)}
                onDateFormatChange={(format) => handleDateFormatChange('company1', format)}
                selectedDateFormat={dateFormats.company1}
                file={files.company1}
                isXeroAuthenticated={isAuthenticated}
              />
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
              <h2 className="text-lg font-semibold mb-4 text-primary-navy">Accounts Payable Ledger</h2>
              <FileUpload 
                onFileSelected={(file) => handleFileUpload('company2', { type: 'csv', file })} 
                accept=".csv"
                label="Upload Accounts Payable CSV"
              />
              {files.company2?.type === 'csv' && files.company2.file && (
                <p className="mt-2 text-sm text-accent-green">
                  ✓ {files.company2.file.name} uploaded
                </p>
              )}
              <DateFormatSelect
                selectedFormat={dateFormats.company2}
                onChange={(format) => handleDateFormatChange('company2', format)}
                label="Select Date Format"
              />
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleProcessFiles}
                disabled={!files.company1 || !files.company2 || isLoading}
                className={`px-6 py-3 rounded-lg font-medium text-white ${files.company1 && files.company2 && !isLoading ? 'bg-primary-teal hover:bg-teal-600' : 'bg-gray-300 cursor-not-allowed'}`}
              >
                {isLoading ? 'Processing...' : 'Match'}
              </button>
            </div>

            <div className="mt-12">
              <div className="bg-primary-navy bg-opacity-5 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-3 text-primary-navy">
                  Data Requirements
                </h2>
                <div>
                  <h3 className="font-medium text-primary-navy mb-2">Required Fields:</h3>
                  <ul className="list-disc list-inside space-y-1 text-secondary-gray">
                    <li>transaction_number</li>
                    <li>transaction_type</li>
                    <li>amount (decimal number)</li>
                    <li>issue_date (select format above)</li>
                    <li>due_date (select format above)</li>
                    <li>status</li>
                    <li>reference</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Ledger Matching Results</h1>
              <button
                onClick={() => {
                  setCurrentScreen('upload');
                  setFiles({ company1: null, company2: null });
                }}
                className="px-4 py-2 bg-primary-teal text-white rounded hover:bg-teal-600"
              >
                Back to Import
              </button>
            </div>
            <MatchingResults matchResults={matches} />
          </>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/auth/xero" element={<XeroAuth />} />
        <Route path="/auth/xero/callback" element={<XeroCallback />} />
        <Route path="/test" element={<TestUpload />} />
        <Route path="/*" element={<MainApp />} />
      </Routes>
    </Router>
  );
}

export default App;