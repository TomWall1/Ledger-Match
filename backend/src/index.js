import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { router as processRoutes } from './routes/processRoutes.js';
import testRoutes from './routes/test.js';
import xeroRoutes from './routes/xeroAuth.js';

dotenv.config();

const app = express();

// Centralized CORS configuration - explicitly list all allowed headers
const corsOptions = {
  // Allow both production and development origins
  origin: ['https://ledger-match.vercel.app', 'http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin', 
    'X-Requested-With', 
    'Content-Type', 
    'Accept', 
    'Authorization',
    'Access-Control-Allow-Headers',
    'Access-Control-Request-Headers',
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Methods'
  ],
  exposedHeaders: ['Content-Type'],
  credentials: true,
  maxAge: 86400 // Cache preflight requests for 24 hours
};

// Enable CORS with configured options
app.use(cors(corsOptions));

// Handle OPTIONS preflight requests
app.options('*', cors(corsOptions));

// Add additional headers for all responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://ledger-match.vercel.app');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log all requests
app.use((req, res, next) => {
  console.log('Request received:', {
    method: req.method,
    path: req.path,
    query: req.query,
    body: Object.keys(req.body).length > 0 ? '(body present)' : '(no body)'
  });
  next();
});

// Mount routes
app.use('/test', testRoutes);
app.use('/auth', xeroRoutes);
app.use('/', processRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'API is running',
    routes: {
      test: '/test/upload',
      auth: '/auth/xero',
      match: '/api/match'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', {
    message: err.message,
    stack: err.stack
  });
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Routes set up:', {
    test: '/test/upload',
    auth: '/auth/xero',
    match: '/api/match'
  });
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