import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import MatchingResults from './components/MatchingResults';
import DateFormatSelect from './components/DateFormatSelect';
import XeroAuth from './components/XeroAuth';
import ARSourceSelector from './components/ARSourceSelector';
import { FileUpload } from './components/FileUpload';
import { AuthUtils } from './utils/auth';

function XeroSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  useEffect(() => {
    const authenticated = params.get('authenticated');
    const token = params.get('token');

    if (authenticated === 'true' && token) {
      console.log('Setting auth state from success route');
      AuthUtils.setAuthState({
        isAuthenticated: true,
        token
      });
      navigate('/', { replace: true });
    } else {
      navigate('/auth/xero', { replace: true });
    }
  }, [navigate, params]);

  return <div>Completing authentication...</div>;
}

function XeroError() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  useEffect(() => {
    const error = params.get('error');
    if (error) {
      console.log('Handling auth error:', error);
      AuthUtils.clearAuthState();
      navigate('/auth/xero', { 
        replace: true,
        state: { error: decodeURIComponent(error) }
      });
    } else {
      navigate('/auth/xero', { replace: true });
    }
  }, [navigate, params]);

  return <div>Error processing authentication...</div>;
}

function PrivateRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const checkAuth = async () => {
      const authStatus = await AuthUtils.verifyAuth();
      console.log('Auth status:', authStatus);
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

// ... rest of your MainApp code ...

export function App() {
  return (
    <Router>
      <Routes>
        <Route path="/auth/xero" element={<XeroAuth />} />
        <Route path="/xero-success" element={<XeroSuccess />} />
        <Route path="/xero-error" element={<XeroError />} />
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