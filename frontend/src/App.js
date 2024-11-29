import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { FileUpload } from './components/FileUpload.jsx';
import MatchingResults from './components/MatchingResults';
import DateFormatSelect from './components/DateFormatSelect';
import XeroAuth from './components/XeroAuth';
import { AuthUtils } from './utils/auth';

function PrivateRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const authStatus = await AuthUtils.verifyAuth();
      setIsAuthenticated(authStatus);
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/auth/xero" />;
}

function MainApp() {
  // Your existing state and handlers
  const [currentScreen, setCurrentScreen] = useState('upload');
  const [matches, setMatches] = useState([]);
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

  // Your existing handlers remain the same
  const handleFileUpload = (companyKey, file) => {
    setFiles(prev => ({
      ...prev,
      [companyKey]: file
    }));
    setError(null);
  };

  // ... rest of your existing handlers ...

  return (
    <div className="container mx-auto p-4">
      {/* Your existing JSX */}
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