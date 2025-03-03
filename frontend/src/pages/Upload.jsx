import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FileUpload } from '../components/FileUpload';
import DateFormatSelect from '../components/DateFormatSelect';
import XeroCustomerSelect from '../components/XeroCustomerSelect';
import { useXero } from '../context/XeroContext';
import Header from '../components/Header';

const Upload = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading, checkAuth } = useXero();
  const [files, setFiles] = useState({ ar: null, ap: null });
  const [dateFormats, setDateFormats] = useState({ ar: 'MM/DD/YYYY', ap: 'MM/DD/YYYY' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sourceType, setSourceType] = useState('csv');
  const [localAuthState, setLocalAuthState] = useState(false);
  const [useHistoricalData, setUseHistoricalData] = useState(false);
  const authCheckPerformed = useRef(false);

  useEffect(() => {
    // Check auth status only once on component mount or when location state changes
    if (!authCheckPerformed.current) {
      const refreshAuthStatus = async () => {
        // Check local storage for auth state first to prevent unnecessary API calls
        const storedAuth = localStorage.getItem('xeroAuth') === 'true';
        
        if (storedAuth) {
          setLocalAuthState(true);
          // If coming from Xero auth flow or explicitly requested, switch to Xero mode
          if (location.state?.xeroEnabled) {
            setSourceType('xero');
          }
          authCheckPerformed.current = true;
          return;
        }
        
        // Only call API if localStorage doesn't have the state
        if (!storedAuth && !isAuthenticated) {
          const serverAuth = await checkAuth();
          setLocalAuthState(serverAuth);
          
          // If authenticated and coming from Xero callback, switch to Xero source type
          if (serverAuth && location.state?.xeroEnabled) {
            setSourceType('xero');
          }
        } else {
          setLocalAuthState(storedAuth || isAuthenticated);
          if ((storedAuth || isAuthenticated) && location.state?.xeroEnabled) {
            setSourceType('xero');
          }
        }
        
        authCheckPerformed.current = true;
      };
      
      refreshAuthStatus();
    }
  }, [isAuthenticated, location.state, checkAuth]);

  const handleXeroSelect = (data) => {
    setFiles(prev => ({
      ...prev,
      ar: {
        type: 'xero',
        data: data.invoices,
        name: `Xero: ${data.customerName}`
      }
    }));
    // Automatically enable historical data when using Xero
    setUseHistoricalData(true);
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
      formData.append('useHistoricalData', useHistoricalData);

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

  const handleConnectXero = () => {
    navigate('/auth/xero');
  };

  // If still loading Xero auth state, show loading indicator
  if (loading && !authCheckPerformed.current) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B365D] mx-auto mb-4"></div>
          <p className="text-[#1B365D]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto p-6">
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
            
            {localAuthState && (
              <div className="mb-4">
                <div className="flex space-x-4">
                  <button
                    onClick={() => setSourceType('csv')}
                    className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors
                      ${sourceType === 'csv' 
                        ? 'bg-[#1B365D] text-white' 
                        : 'bg-white text-[#1B365D] border border-[#1B365D] hover:bg-[#1B365D] hover:bg-opacity-5'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Upload CSV
                  </button>
                  <button
                    onClick={() => setSourceType('xero')}
                    className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors
                      ${sourceType === 'xero' 
                        ? 'bg-[#13B5EA] text-white' 
                        : 'bg-white text-[#13B5EA] border border-[#13B5EA] hover:bg-[#13B5EA] hover:bg-opacity-5'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    From Xero
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {sourceType === 'csv' || !localAuthState ? (
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
              ) : localAuthState && sourceType === 'xero' ? (
                <div className="space-y-4">
                  <XeroCustomerSelect onCustomerSelect={handleXeroSelect} />
                  {files.ar?.type === 'xero' && (
                    <p className="text-sm text-green-600">
                      ✓ {files.ar.name}
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center mb-6 p-4 bg-[#13B5EA] bg-opacity-5 rounded-lg">
                  <p className="text-[#13B5EA] mb-4">
                    {localAuthState 
                      ? "Select data from your connected Xero account"
                      : "Connect to Xero to import your accounts receivable data"}
                  </p>
                  <button
                    onClick={handleConnectXero}
                    className="bg-[#13B5EA] text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
                  >
                    {localAuthState ? "From Xero" : "Connect to Xero"}
                  </button>
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

        {/* Historical Data Option */}
        <div className="mt-6 bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="useHistoricalData"
              checked={useHistoricalData}
              onChange={(e) => setUseHistoricalData(e.target.checked)}
              className="h-5 w-5 text-[#00A4B4] rounded focus:ring-[#00A4B4]"
            />
            <label htmlFor="useHistoricalData" className="text-[#1B365D] font-medium">
              Check for historical invoice status in AR ledger
            </label>
          </div>
          <p className="mt-2 text-sm text-[#647789] ml-8">
            When enabled, the system will check if unmatched AP items exist in the historical AR ledger (e.g., already paid or voided invoices).
            {!localAuthState && <span className="block mt-1 italic">Connect to Xero for best results with historical data.</span>}
          </p>
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