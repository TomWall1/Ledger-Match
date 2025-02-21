import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import xeroRoutes from './src/routes/xeroAuth.js';
import processRoutes from './src/routes/processRoutes.js';
import testRoutes from './src/routes/test.js';

dotenv.config();

const app = express();

// Centralized CORS configuration
const corsOptions = {
  origin: 'https://ledger-match.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept'],
  exposedHeaders: ['Content-Type'],
  credentials: true,
  maxAge: 86400 // Cache preflight requests for 24 hours
};

// Enable CORS with configured options
app.use(cors(corsOptions));

// Handle OPTIONS preflight requests
app.options('*', cors(corsOptions));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log all requests
app.use((req, res, next) => {
  console.log('Request received:', {
    method: req.method,
    path: req.path,
    headers: req.headers,
    query: req.query,
    body: req.body
  });
  next();
});

// Mount test routes first
app.use('/test', testRoutes);

// Mount other routes
app.use('/auth', xeroRoutes);
app.use('/process', processRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'API is running',
    endpoints: {
      test: '/test/upload',
      auth: '/auth',
      process: '/process'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', {
    error: err,
    message: err.message,
    code: err.code,
    field: err.field,
    storageErrors: err.storageErrors,
    stack: err.stack
  });
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    path: req.path,
    timestamp: new Date().toISOString(),
    details: JSON.stringify(err, Object.getOwnPropertyNames(err))
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Environment:', {
    node_env: process.env.NODE_ENV,
    clientId: process.env.XERO_CLIENT_ID ? '✓ Set' : '✗ Missing',
    clientSecret: process.env.XERO_CLIENT_SECRET ? '✓ Set' : '✗ Missing',
    redirectUri: process.env.XERO_REDIRECT_URI,
    frontend: process.env.FRONTEND_URL
  });
});

// Add unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});