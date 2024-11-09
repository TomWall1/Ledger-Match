const express = require('express');
const cors = require('cors');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');

const app = express();

// Enable CORS with specific options
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://ledger-match.vercel.app',
    'https://ledger-match-git-main-tomwall1.vercel.app',
    'https://ledger-match-9knq3j55o-toms-projects-c3abf80c.vercel.app'
  ],
  methods: ['POST', 'GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept'],
  credentials: false
}));

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Your existing helper functions and routes remain the same...
[Previous helper functions remain unchanged]

// Modified server startup
const PORT = process.env.PORT || 3000;  // Changed from 5000 to 3000
const HOST = '0.0.0.0';  // Added this line

// Modified server startup with error handling
const server = app.listen(PORT, HOST, (error) => {
  if (error) {
    console.error('Error starting server:', error);
    return;
  }
  console.log(`Server running on http://${HOST}:${PORT}`);
  console.log('Ready to process CSV files');
});

// Add error handler for the server
server.on('error', (error) => {
  console.error('Server error:', error);
});

// Add graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  server.close(() => {
    console.log('Server shut down complete');
    process.exit(0);
  });
});