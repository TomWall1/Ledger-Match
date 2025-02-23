import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { XeroProvider } from './context/XeroContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <XeroProvider>
      <App />
    </XeroProvider>
  </React.StrictMode>
);
