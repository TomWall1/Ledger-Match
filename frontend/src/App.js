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
      const authenticated = query.get('authenticated');
      if (authenticated === 'true') {
        AuthUtils.setAuthState({ isAuthenticated: true });
        setIsAuthenticated(true);
        // Clear URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        const authStatus = await AuthUtils.verifyAuth();
        setIsAuthenticated(authStatus);
      }
      setIsLoading(false);
    };
    checkAuth();
  }, [query]);

  if (isLoading) return <div>Loading...</div>;
  return isAuthenticated ? children : <Navigate to="/auth/xero" />;
}

// Rest of your App.js code stays the same

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