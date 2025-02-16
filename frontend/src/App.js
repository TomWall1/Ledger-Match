import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import MatchingResults from './components/MatchingResults';
import DateFormatSelect from './components/DateFormatSelect';
import XeroAuth from './components/XeroAuth';
import ARSourceSelector from './components/ARSourceSelector';
import { FileUpload } from './components/FileUpload';
import { AuthUtils } from './utils/auth';

function useQuery() {
  const location = useLocation();
  console.log('Current location:', location);
  return new URLSearchParams(location.search);
}

function PrivateRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const query = useQuery();
  const location = useLocation();
  
  useEffect(() => {
    const checkAuth = async () => {
      console.log('Checking auth status...');
      console.log('Current URL:', window.location.href);
      console.log('Query params:', Object.fromEntries(query.entries()));
      
      const success = query.get('success');
      console.log('Success param:', success);
      
      if (success === 'true') {
        console.log('Setting auth state from success param');
        AuthUtils.setAuthState({ isAuthenticated: true });
        setIsAuthenticated(true);
        // Remove query parameters
        window.history.replaceState({}, document.title, location.pathname);
      } else {
        console.log('Checking stored auth state');
        const authStatus = await AuthUtils.verifyAuth();
        console.log('Auth status:', authStatus);
        setIsAuthenticated(authStatus);
      }
      setIsLoading(false);
    };
    checkAuth();
  }, [query, location.pathname]);

  if (isLoading) {
    console.log('Still loading auth status...');
    return <div>Loading...</div>;
  }

  console.log('Auth check complete. Is authenticated:', isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/auth/xero" />;
}

// ... rest of your App.js code ...

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