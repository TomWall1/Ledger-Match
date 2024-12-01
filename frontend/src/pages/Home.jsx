import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Ledger Match</h1>
      <div className="space-y-4">
        <div className="p-4 border rounded">
          <h2 className="text-xl font-semibold mb-2">Accounts Receivable Data</h2>
          <div className="space-y-2">
            <Link
              to="/xero-connection"
              className="block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-center"
            >
              Connect to Xero
            </Link>
            <Link
              to="/upload"
              className="block bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 text-center"
            >
              Upload CSV
            </Link>
          </div>
        </div>
        
        <div className="p-4 border rounded">
          <h2 className="text-xl font-semibold mb-2">Accounts Payable Data</h2>
          <Link
            to="/upload"
            className="block bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 text-center"
          >
            Upload CSV
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
