import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import MatchingResults from './components/MatchingResults.jsx';
import DateFormatSelect from './components/DateFormatSelect.jsx';
import XeroAuth from './components/XeroAuth.js';
import XeroCallback from './components/XeroCallback.js';
import ARSourceSelector from './components/ARSourceSelector.js';
import { FileUpload } from './components/FileUpload.jsx';
import { AuthUtils } from './utils/auth.js';

// ... (previous code remains the same until handleProcessFiles)

const handleProcessFiles = async () => {
    if (!files.company1 || !files.company2) {
      setError('Please provide both sets of data before proceeding');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let company1Data, company2Data;

      // Process company 1 data (AR)
      if (files.company1.type === 'csv') {
        const formData1 = new FormData();
        console.log('Processing file 1:', files.company1.file);
        formData1.append('upload', files.company1.file, files.company1.file.name);
        formData1.append('dateFormat', dateFormats.company1);
        
        const response1 = await fetch('https://ledger-match-backend.onrender.com/process-csv', {
          method: 'POST',
          body: formData1
        });

        if (!response1.ok) {
          const errorData = await response1.text();
          console.error('Server error:', errorData);
          throw new Error(`Failed to process first CSV file: ${errorData}`);
        }

        company1Data = await response1.json();
      } else {
        company1Data = files.company1.data;
      }

      // Process company 2 data (AP)
      const formData2 = new FormData();
      console.log('Processing file 2:', files.company2.file);
      formData2.append('upload', files.company2.file, files.company2.file.name);
      formData2.append('dateFormat', dateFormats.company2);

      const response2 = await fetch('https://ledger-match-backend.onrender.com/process-csv', {
        method: 'POST',
        body: formData2
      });

      if (!response2.ok) {
        const errorData = await response2.text();
        console.error('Server error:', errorData);
        throw new Error(`Failed to process second CSV file: ${errorData}`);
      }

      company2Data = await response2.json();

      // Perform matching
      const matchResults = await fetch('https://ledger-match-backend.onrender.com/match-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          company1Data,
          company2Data
        })
      });

      if (!matchResults.ok) {
        const errorData = await matchResults.text();
        console.error('Server error:', errorData);
        throw new Error(`Failed to match data: ${errorData}`);
      }

      const results = await matchResults.json();
      setMatches(results);
      setCurrentScreen('results');
    } catch (error) {
      console.error('Error processing files:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };