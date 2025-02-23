import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-[#1B365D] mb-8">Ledger Match</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-[#1B365D]">Accounts Receivable Data</h2>
            <div className="space-y-3">
              <Link
                to="/auth/xero"
                className="block bg-[#13B5EA] text-white px-6 py-3 rounded-lg hover:bg-[#0EA2D4] transition-colors text-center font-medium"
              >
                Connect to Xero
              </Link>
              <Link
                to="/upload"
                className="block bg-[#00A4B4] text-white px-6 py-3 rounded-lg hover:bg-[#008999] transition-colors text-center font-medium"
              >
                Upload CSV
              </Link>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-[#1B365D]">Accounts Payable Data</h2>
            <Link
              to="/upload"
              className="block bg-[#00A4B4] text-white px-6 py-3 rounded-lg hover:bg-[#008999] transition-colors text-center font-medium"
            >
              Upload CSV
            </Link>
          </div>
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

        <div className="mt-8 bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <h2 className="text-lg font-semibold mb-3 text-[#1B365D]">
            Sample CSV Templates
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a 
              href="/sample_ar.csv" 
              download
              className="flex items-center px-4 py-2 border border-[#1B365D] text-[#1B365D] rounded-lg hover:bg-[#1B365D] hover:bg-opacity-5 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Download AR Template
            </a>
            <a 
              href="/sample_ap.csv" 
              download
              className="flex items-center px-4 py-2 border border-[#1B365D] text-[#1B365D] rounded-lg hover:bg-[#1B365D] hover:bg-opacity-5 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Download AP Template
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
