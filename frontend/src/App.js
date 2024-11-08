import React, { useState } from 'react';
import { FileUpload } from './components/FileUpload.jsx';
import MatchingResults from './components/MatchingResults';
import DateFormatSelect from './components/DateFormatSelect';

export function App() {
  const [currentScreen, setCurrentScreen] = useState('upload');
  const [matches, setMatches] = useState([]);
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
  };

  const handleDateFormatChange = (companyKey, format) => {
    setDateFormats(prev => ({
      ...prev,
      [companyKey]: format
    }));
  };

  const handleProcessFiles = () => {
    if (!files.company1 || !files.company2) {
      alert('Please upload both files before proceeding');
      return;
    }

    console.log('Starting file processing...');
    
    const formData = new FormData();
    formData.append('file1', files.company1);
    formData.append('file2', files.company2);
    formData.append('dateFormat1', dateFormats.company1);
    formData.append('dateFormat2', dateFormats.company2);

    console.log('Files attached:', {
      file1: files.company1.name,
      file2: files.company2.name
    });

    console.log('Date formats:', {
      format1: dateFormats.company1,
      format2: dateFormats.company2
    });

    fetch('http://localhost:5000/match', {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(5000) // 5 second timeout
    })
    .then(response => {
      if (!response.ok) {
        console.error('Server response:', {
          status: response.status,
          statusText: response.statusText
        });
        throw new Error(`Server error: ${response.status}`);
      }
      return response.json();
    })
    .then(matchResults => {
      console.log('Raw match results:', matchResults);
      console.log('Data structure received:', {
        hasTotals: !!matchResults.totals,
        totalsData: matchResults.totals,
        perfectMatchCount: matchResults.perfectMatches?.length || 0,
        mismatchCount: matchResults.mismatches?.length || 0,
        unmatchedCompany1Count: matchResults.unmatchedItems?.company1?.length || 0,
        unmatchedCompany2Count: matchResults.unmatchedItems?.company2?.length || 0
      });

      const processedResults = {
        totals: matchResults.totals || { company1Total: 0, company2Total: 0, variance: 0 },
        perfectMatches: matchResults.perfectMatches || [],
        mismatches: matchResults.mismatches || [],
        unmatchedItems: matchResults.unmatchedItems || { company1: [], company2: [] }
      };

      console.log('Processed results detailed:', {
        totals: processedResults.totals,
        perfectMatches: {
          count: processedResults.perfectMatches.length,
          sample: processedResults.perfectMatches[0] || 'none'
        },
        mismatches: {
          count: processedResults.mismatches.length,
          sample: processedResults.mismatches[0] || 'none'
        },
        unmatchedItems: {
          company1Count: processedResults.unmatchedItems.company1.length,
          company2Count: processedResults.unmatchedItems.company2.length,
          company1Sample: processedResults.unmatchedItems.company1[0] || 'none',
          company2Sample: processedResults.unmatchedItems.company2[0] || 'none'
        }
      });
      
      setMatches(processedResults);
      setCurrentScreen('results');
    })
    .catch(error => {
      console.error('Detailed error:', {
        message: error.message,
        stack: error.stack,
        type: error.name,
        isFetch: error instanceof TypeError && error.message === 'Failed to fetch',
        isTimeout: error.name === 'TimeoutError'
      });
      
      if (error.name === 'TimeoutError') {
        alert('Server took too long to respond. Please try again.');
      } else if (error instanceof TypeError && error.message === 'Failed to fetch') {
        alert('Unable to connect to the server. Please check if the backend server is running on port 5000.');
      } else {
        alert(`Error processing files: ${error.message}`);
      }
    });
  };

  return (
    <div className="container mx-auto p-4">
      {currentScreen === 'upload' ? (
        <>
          <h1 className="text-2xl font-bold mb-6">Ledger Matching Tool</h1>
          
          <div className="space-y-8">
            {/* Company 1 Upload */}
            <div className="border rounded-lg p-6 bg-white">
              <h2 className="text-lg font-semibold mb-4">Company 1 Transactions</h2>
              <FileUpload 
                onFileSelected={(file) => handleFileUpload('company1', file)} 
                accept=".csv"
                label="Upload Company 1 CSV"
              />
              <DateFormatSelect
                selectedFormat={dateFormats.company1}
                onChange={(format) => handleDateFormatChange('company1', format)}
                label="Select Date Format for Company 1"
              />
              {files.company1 && (
                <p className="mt-2 text-sm text-green-600">
                  ✓ {files.company1.name} uploaded
                </p>
              )}
            </div>

            {/* Company 2 Upload */}
            <div className="border rounded-lg p-6 bg-white">
              <h2 className="text-lg font-semibold mb-4">Company 2 Transactions</h2>
              <FileUpload 
                onFileSelected={(file) => handleFileUpload('company2', file)} 
                accept=".csv"
                label="Upload Company 2 CSV"
              />
              <DateFormatSelect
                selectedFormat={dateFormats.company2}
                onChange={(format) => handleDateFormatChange('company2', format)}
                label="Select Date Format for Company 2"
              />
              {files.company2 && (
                <p className="mt-2 text-sm text-green-600">
                  ✓ {files.company2.name} uploaded
                </p>
              )}
            </div>

            {/* Process Button */}
            <div className="flex justify-center">
              <button
                onClick={handleProcessFiles}
                disabled={!files.company1 || !files.company2}
                className={`px-6 py-3 rounded-lg font-medium text-white
                  ${files.company1 && files.company2 
                    ? 'bg-blue-500 hover:bg-blue-600' 
                    : 'bg-gray-300 cursor-not-allowed'}`}
              >
                Process Files
              </button>
            </div>

            {/* File Requirements */}
            <div className="mt-12">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2 text-blue-800">File Requirements</h2>
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
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Import
            </button>
          </div>
          <MatchingResults matchResults={matches} />
        </>
      )}
    </div>
  );
}