import React from 'react';
import { Link } from 'react-router-dom';

const NavHeader = () => {
  return (
    <header className="bg-[#1B365D] text-white py-4 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2">
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" className="text-white">
                <path fill="currentColor" d="M18 3a3 3 0 00-3 3v12a3 3 0 003 3 3 3 0 003-3 3 3 0 00-3-3H6a3 3 0 00-3 3 3 3 0 003 3 3 3 0 003-3V6a3 3 0 00-3-3 3 3 0 00-3 3 3 3 0 003 3h12a3 3 0 003-3 3 3 0 00-3-3z"/>
              </svg>
            </div>
            <span className="font-bold text-xl tracking-tight">LedgerLink</span>
          </Link>
          <div className="flex space-x-4">
            <Link to="/upload" className="hover:text-[#00A4B4] transition-colors">
              Upload
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default NavHeader;