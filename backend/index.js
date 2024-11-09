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
    'https://ledger-match-9knq3j55o-toms-projects-c3abf80c.vercel.app'  // Your specific Vercel URL
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

// Rest of your code remains exactly the same...
[Previous helper functions and routes remain unchanged]

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Ready to process CSV files');
});