import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';

const Home = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-[#1B365D] mt-8 mb-4">LedgerLink</h1>
          <p className="text-xl text-[#647789]">Match and reconcile your financial records</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-[#1B365D]">Accounts Receivable Data</h2>
            <div className="space-y-3">
              <Link
                to="/auth/xero"
                className="block bg-[#13B5EA] text-white px-6 py-3 rounded-lg hover:bg-opacity-90 transition-colors text-center font-medium"
              >
                <div className="flex items-center justify-center">
                  <img 
                    src="/xero-logo.svg" 
                    alt="Xero logo" 
                    className="w-5 h-5 mr-2"
                  />
                  Connect to Xero
                </div>
              </Link>
              <Link
                to="/upload"
                className="block bg-[#00A4B4] text-white px-6 py-3 rounded-lg hover:bg-opacity-90 transition-colors text-center font-medium"
              >
                <div className="flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  Upload CSV
                </div>
              </Link>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-[#1B365D]">Accounts Payable Data</h2>
            <Link
              to="/upload"
              className="block bg-[#00A4B4] text-white px-6 py-3 rounded-lg hover:bg-opacity-90 transition-colors text-center font-medium"
            >
              <div className="flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                Upload CSV
              </div>
            </Link>
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
              className="flex items-center justify-center px-4 py-2 border border-[#1B365D] text-[#1B365D] rounded-lg hover:bg-[#1B365D] hover:bg-opacity-5 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Download AR Template
            </a>
            <a 
              href="/sample_ap.csv" 
              download
              className="flex items-center justify-center px-4 py-2 border border-[#1B365D] text-[#1B365D] rounded-lg hover:bg-[#1B365D] hover:bg-opacity-5 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Download AP Template
            </a>
          </div>
        </div>

        <div className="mt-8 bg-[#1B365D] bg-opacity-5 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-3 text-[#1B365D]">
            CSV Data Format Requirements
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-[#1B365D] mb-2">Required Columns:</h3>
              <ul className="list-disc list-inside space-y-2 text-[#647789]">
                <li><span className="font-medium">transaction_number</span> - Unique identifier for each transaction</li>
                <li><span className="font-medium">transaction_type</span> - Type of transaction (e.g., INVOICE, BILL, CREDIT_NOTE)</li>
                <li><span className="font-medium">amount</span> - Decimal number (positive for AR, negative for AP)</li>
                <li><span className="font-medium">issue_date</span> - Date the transaction was issued</li>
                <li><span className="font-medium">due_date</span> - Date the transaction is due</li>
                <li><span className="font-medium">status</span> - Current status of the transaction (e.g., OPEN, PAID, VOIDED)</li>
                <li><span className="font-medium">reference</span> - Additional reference identifier (optional but useful for matching)</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-[#1B365D] mb-2">Specific Format Guidelines:</h3>
              <ul className="list-disc list-inside space-y-2 text-[#647789]">
                <li><span className="font-medium">AR Amounts</span> - Should be positive values (e.g., 1500.00)</li>
                <li><span className="font-medium">AP Amounts</span> - Should be negative values (e.g., -1500.00)</li>
                <li><span className="font-medium">Transaction Types</span> - Use appropriate types:
                  <ul className="list-disc ml-6 mt-1">
                    <li>For AR: "INVOICE", "CREDIT_NOTE", etc.</li>
                    <li>For AP: "BILL", "CREDIT_NOTE", etc.</li>
                  </ul>
                </li>
                <li><span className="font-medium">Dates</span> - Use consistent date format (YYYY-MM-DD recommended)</li>
                <li><span className="font-medium">Status</span> - Common values: "OPEN", "PAID", "VOIDED", "DRAFT"</li>
              </ul>
            </div>
            
            <div className="text-sm text-[#647789] italic">
              Tip: Download and use the sample templates above for the correct format. Matching is based primarily on transaction numbers and references.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
