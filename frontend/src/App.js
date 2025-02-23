import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import ARSourceSelector from './components/ARSourceSelector';
import { FileUpload } from './components/FileUpload';
import DateFormatSelect from './components/DateFormatSelect';
import MatchingResults from './components/MatchingResults';
import XeroAuth from './components/XeroAuth';
import XeroCallback from './components/XeroCallback';

function MainApp() {
  const [currentScreen, setCurrentScreen] = useState('upload');
  const [files, setFiles] = useState({ company1: null, company2: null });
  const [dateFormats, setDateFormats] = useState({ company1: 'MM/DD/YYYY', company2: 'MM/DD/YYYY' });
  const [isLoading, setIsLoading] = useState(false);
  const [matches, setMatches] = useState(null);
  const [isXeroAuthenticated, setIsXeroAuthenticated] = useState(false);

  useEffect(() => {
    // Check Xero authentication status
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

    checkXeroAuth();
  }, []);

  const handleMatch = async () => {
    if (!files.company1 || !files.company2) {
      alert('Please upload both files before matching');
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();

      // Handle both CSV and Xero data
      if (files.company1.type === 'csv') {
        formData.append('company1File', files.company1.file);
      } else if (files.company1.type === 'xero') {
        formData.append('company1Data', JSON.stringify(files.company1.data));
      }

      formData.append('company2File', files.company2.file);
      formData.append('dateFormat1', dateFormats.company1);
      formData.append('dateFormat2', dateFormats.company2);

      const apiUrl = process.env.REACT_APP_API_URL || 'https://ledger-match-backend.onrender.com';
      const response = await fetch(`${apiUrl}/api/match`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to match records');
      }

      const matchResults = await response.json();
      setMatches(matchResults);
      setCurrentScreen('results');
    } catch (error) {
      console.error('Error matching records:', error);
      alert('Error matching records. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {currentScreen === 'upload' ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-[#1B365D]">Record Matching</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-[#1B365D]">
                  Accounts Receivable Data
                </h2>
                <ARSourceSelector
                  onFileSelected={(file) => setFiles({ ...files, company1: file })}
                  onDateFormatChange={(format) => setDateFormats({ ...dateFormats, company1: format })}
                  selectedDateFormat={dateFormats.company1}
                  file={files.company1}
                  isXeroAuthenticated={isXeroAuthenticated}
                />
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-[#1B365D]">
                  Accounts Payable Data
                </h2>
                <div>
                  <FileUpload
                    onFileSelected={(file) => setFiles({ ...files, company2: { type: 'csv', file } })}
                    accept=".csv"
                    label="Upload Accounts Payable CSV"
                  />
                  {files.company2?.file && (
                    <p className="mt-2 text-sm text-accent-green">
                      ✓ {files.company2.file.name} uploaded
                    </p>
                  )}
                  <DateFormatSelect
                    selectedFormat={dateFormats.company2}
                    onChange={(format) => setDateFormats({ ...dateFormats, company2: format })}
                    label="Select Date Format"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleMatch}
                disabled={!files.company1 || !files.company2 || isLoading}
                className={`px-6 py-2 flex items-center justify-center rounded-lg transition-colors ${(!files.company1 || !files.company2 || isLoading) ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#00A4B4] hover:bg-[#008999] text-white'}`}
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

            <div className="bg-[#1B365D] bg-opacity-5 rounded-lg p-6">
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
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-[#1B365D]">Matching Results</h1>
              <button
                onClick={() => {
                  setCurrentScreen('upload');
                  setFiles({ company1: null, company2: null });
                }}
                className="px-4 py-2 bg-[#00A4B4] text-white rounded-lg hover:bg-[#008999] transition-colors flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
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
        <Route path="/*" element={<MainApp />} />
      </Routes>
    </Router>
  );
}

export default App;
