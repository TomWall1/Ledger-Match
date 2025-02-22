import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function MainApp() {
  const [files, setFiles] = useState({
    company1: null,
    company2: null
  });

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
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-[#1B365D] text-white py-4 shadow-lg">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
            LedgerLink
          </h1>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Template Download Button */}
          <div className="flex justify-end">
            <button
              onClick={handleTemplateDownload}
              className="px-4 py-2 text-sm bg-[#00A4B4] text-white rounded-lg hover:bg-[#008999] transition-colors flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              Download Template CSV
            </button>
          </div>

          {/* AR Upload Section */}
          <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
            <h2 className="text-lg font-semibold mb-4 text-[#1B365D]">Accounts Receivable Ledger</h2>
            <div className="flex flex-col space-y-4">
              <button
                onClick={() => document.getElementById('ar-upload').click()}
                className="flex items-center px-4 py-2 bg-[#1B365D] text-white rounded-lg hover:bg-opacity-90 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                Upload Accounts Receivable CSV
              </button>
              <input
                id="ar-upload"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files[0]) {
                    setFiles(prev => ({
                      ...prev,
                      company1: { type: 'csv', file: e.target.files[0] }
                    }));
                  }
                }}
              />
              {files.company1?.file && (
                <p className="text-sm text-[#7BDCB5]">
                  ✓ {files.company1.file.name} uploaded
                </p>
              )}
            </div>
          </div>

          {/* AP Upload Section */}
          <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
            <h2 className="text-lg font-semibold mb-4 text-[#1B365D]">Accounts Payable Ledger</h2>
            <div className="flex flex-col space-y-4">
              <button
                onClick={() => document.getElementById('ap-upload').click()}
                className="flex items-center px-4 py-2 bg-[#1B365D] text-white rounded-lg hover:bg-opacity-90 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                Upload Accounts Payable CSV
              </button>
              <input
                id="ap-upload"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files[0]) {
                    setFiles(prev => ({
                      ...prev,
                      company2: { type: 'csv', file: e.target.files[0] }
                    }));
                  }
                }}
              />
              {files.company2?.file && (
                <p className="text-sm text-[#7BDCB5]">
                  ✓ {files.company2.file.name} uploaded
                </p>
              )}
            </div>
          </div>

          {/* Data Requirements Section */}
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
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/*" element={<MainApp />} />
      </Routes>
    </Router>
  );
}

export default App;