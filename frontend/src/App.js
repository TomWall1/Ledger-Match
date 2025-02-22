import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function MainApp() {
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-600 text-white py-4 mb-8 shadow-lg">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold">LedgerLink</h1>
        </div>
      </nav>
      <div className="container mx-auto px-4">
        <h2>Welcome to LedgerLink</h2>
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