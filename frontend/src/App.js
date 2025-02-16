import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import MatchingResults from './components/MatchingResults';
import DateFormatSelect from './components/DateFormatSelect';
import XeroAuth from './components/XeroAuth';
import ARSourceSelector from './components/ARSourceSelector';
import { FileUpload } from './components/FileUpload';
import { AuthUtils } from './utils/auth';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function PrivateRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const query = useQuery();
  
  useEffect(() => {
    const checkAuth = async () => {
      const success = query.get('success');
      if (success === 'true') {
        AuthUtils.setAuthState({ isAuthenticated: true });
        setIsAuthenticated(true);
      } else {
        const authStatus = await AuthUtils.verifyAuth();
        setIsAuthenticated(authStatus);
      }
      setIsLoading(false);
    };
    checkAuth();
  }, [query]);

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

  // Check for query parameters
  const query = useQuery();
  const queryError = query.get('error');
  
  useEffect(() => {
    if (queryError) {
      setError(decodeURIComponent(queryError));
      // Remove query parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [queryError]);

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

  // Rest of the component code...

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
            <div className="border rounded-lg p-6 bg-white">
              <h2 className="text-lg font-semibold mb-4">Accounts Receivable Ledger</h2>
              <ARSourceSelector 
                onFileSelected={(data) => handleFileUpload('company1', data)}
                onDateFormatChange={(format) => handleDateFormatChange('company1', format)}
                selectedDateFormat={dateFormats.company1}
                file={files.company1}
              />
            </div>

            <div className="border rounded-lg p-6 bg-white">
              <h2 className="text-lg font-semibold mb-4">Accounts Payable Ledger</h2>
              <FileUpload 
                onFileSelected={(file) => handleFileUpload('company2', { type: 'csv', file })} 
                accept=".csv"
                label="Upload Accounts Payable CSV"
              />
              {files.company2?.type === 'csv' && files.company2.file && (
                <p className="mt-2 text-sm text-green-600">
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
                className={`px-6 py-3 rounded-lg font-medium text-white
                  ${files.company1 && files.company2 && !isLoading
                    ? 'bg-blue-500 hover:bg-blue-600' 
                    : 'bg-gray-300 cursor-not-allowed'}`}
              >
                {isLoading ? 'Processing...' : 'Process Files'}
              </button>
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