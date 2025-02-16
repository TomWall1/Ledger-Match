import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import MatchingResults from './components/MatchingResults';
import DateFormatSelect from './components/DateFormatSelect';
import XeroAuth from './components/XeroAuth';
import ARSourceSelector from './components/ARSourceSelector';
import { FileUpload } from './components/FileUpload';
import { AuthUtils } from './utils/auth';

function MainApp() {
  // Your existing MainApp code here
  return (
    <div>Your existing MainApp JSX</div>
  );
}

function PrivateRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  useEffect(() => {
    const checkAuth = async () => {
      console.log('Checking auth status with URL:', window.location.href);
      const authenticated = params.get('authenticated');
      console.log('Authenticated param:', authenticated);

      if (authenticated === 'true') {
        console.log('Setting auth from URL parameter');
        AuthUtils.setAuthState({ isAuthenticated: true });
        setIsAuthenticated(true);
        // Clear URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        console.log('Checking stored auth state');
        const authStatus = await AuthUtils.verifyAuth();
        console.log('Auth status from storage:', authStatus);
        setIsAuthenticated(authStatus);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [location.search]);

  if (isLoading) {
    console.log('Still loading auth status...');
    return <div>Loading...</div>;
  }

  console.log('Rendering PrivateRoute with auth:', isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/auth/xero" />;
}

export function App() {
  console.log('Rendering App component');
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