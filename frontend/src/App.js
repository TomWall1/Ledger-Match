import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { FileUpload } from './components/FileUpload';
import MatchingResults from './components/MatchingResults';
import DateFormatSelect from './components/DateFormatSelect';
import XeroAuth from './components/XeroAuth';
import { AuthUtils } from './utils/auth';
import XeroCallback from './components/XeroCallback';

function PrivateRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const authStatus = await AuthUtils.verifyAuth();
      setIsAuthenticated(authStatus);
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/auth/xero" />;
}

function MainApp() {
  const [currentScreen, setCurrentScreen] = useState('upload');
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

  const handleFileUpload = (companyKey, file) => {
    setFiles(prev => ({
      ...prev,
      [companyKey]: file
    }));
    setError(null);
  };

  const handleDateFormatChange = (companyKey, format) => {
    setDateFormats(prev => ({
      ...prev,
      [companyKey]: format
    }));
  };

  const handleTemplateDownload = () => {
    const headers = [
      'transaction_number',
      'transaction_type',
      'amount',
      'issue_date',
      'due_date',
      'status',
      'reference'
    ];

    const exampleRows = [
      ['INV-001', 'Invoice', '1000.00', '2024-01-01', '2024-02-01', 'Open', 'PO-123'],
      ['PYMT-001', 'Payment', '-500.00', '2024-01-15', '2024-01-15', 'Open', 'INV-001']
    ];

    const csvContent = [
      headers.join(','),
      ...exampleRows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'ledger_template.csv');
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleProcessFiles = async () => {
    if (!files.company1 || !files.company2) {
      setError('Please upload both files before proceeding');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file1', files.company1);
      formData.append('file2', files.company2);
      formData.append('dateFormat1', dateFormats.company1);
      formData.append('dateFormat2', dateFormats.company2);
      
      const response = await fetch('https://ledger-match-backend.onrender.com/match', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
        body: formData
      });

      const responseText = await response.text();
      
      if (!response.ok) {
        throw new Error(responseText || `Server error: ${response.status}`);
      }

      const matchResults = JSON.parse(responseText);

      const processedResults = {
        totals: {
          company1Total: matchResults.totals?.company1Total || "0.00",
          company2Total: matchResults.totals?.company2Total || "0.00",
          variance: matchResults.totals?.variance || "0.00"
        },
        perfectMatches: Array.isArray(matchResults.perfectMatches) ? matchResults.perfectMatches : [],
        mismatches: Array.isArray(matchResults.mismatches) ? matchResults.mismatches : [],
        unmatchedItems: {
          company1: Array.isArray(matchResults.unmatchedItems?.company1) ? matchResults.unmatchedItems.company1 : [],
          company2: Array.isArray(matchResults.unmatchedItems?.company2) ? matchResults.unmatchedItems.company2 : []
        }
      };

      setMatches(processedResults);
      setCurrentScreen('results');
    } catch (error) {
      console.error('Error processing files:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      {currentScreen === 'upload' ? (
        <>
          <h1 className="text-2xl font-bold mb-6">Ledger Matching Tool</h1>
          
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="space-y-8">
            <div className="flex justify-end">
              <button
                onClick={handleTemplateDownload}
                className="px-4 py-2 text-sm bg-green-500 text-white rounded hover:bg-green-600"
              >
                Download Template CSV
              </button>
            </div>

            <div className="border rounded-lg p-6 bg-white">
              <h2 className="text-lg font-semibold mb-4">Accounts Receivable Ledger</h2>
              <FileUpload 
                onFileSelected={(file) => handleFileUpload('company1', file)} 
                accept=".csv"
                label="Upload Accounts Receivable CSV"
              />
              {files.company1 && (
                <p className="mt-2 text-sm text-green-600">
                  ✓ {files.company1.name} uploaded
                </p>
              )}
              <DateFormatSelect
                selectedFormat={dateFormats.company1}
                onChange={(format) => handleDateFormatChange('company1', format)}
                label="Select Date Format"
              />
            </div>

            <div className="border rounded-lg p-6 bg-white">
              <h2 className="text-lg font-semibold mb-4">Accounts Payable Ledger</h2>
              <FileUpload 
                onFileSelected={(file) => handleFileUpload('company2', file)} 
                accept=".csv"
                label="Upload Accounts Payable CSV"
              />
              {files.company2 && (
                <p className="mt-2 text-sm text-green-600">
                  ✓ {files.company2.name} uploaded
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
                className={`px-6 py-3 rounded-lg font-medium text-white
                  ${files.company1 && files.company2 && !isLoading
                    ? 'bg-blue-500 hover:bg-blue-600' 
                    : 'bg-gray-300 cursor-not-allowed'}`}
              >
                {isLoading ? 'Processing...' : 'Process Files'}
              </button>
            </div>

            <div className="mt-12">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-3 text-blue-800">
                  File Requirements
                </h2>
                <div>
                  <h3 className="font-medium text-blue-800 mb-2">Format Requirements:</h3>
                  <ul className="list-disc list-inside space-y-1 text-blue-900">
                    <li>Files must be in CSV format</li>
                    <li>File size should be under 10MB</li>
                    <li>UTF-8 encoding required</li>
                    <li>First row must contain column headers</li>
                  </ul>
                </div>
                <div className="mt-4">
                  <h3 className="font-medium text-blue-800 mb-2">Required Columns:</h3>
                  <ul className="list-disc list-inside space-y-1 text-blue-900">
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
        </>
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Ledger Matching Results</h1>
            <button
              onClick={() => {
                setCurrentScreen('upload');
                setFiles({ company1: null, company2: null });
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Back to Import
            </button>
          </div>
          <MatchingResults matchResults={matches} />
        </>
      )}
    </div>
  );
}

export function App() {
  return (
    <Router>
      <Routes>
        <Route path="/auth/xero" element={<XeroAuth />} />
        <Route path="/auth/xero/callback" element={<XeroCallback />} />
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <MainApp />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
