import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import MatchingResults from './components/MatchingResults.jsx';
import DateFormatSelect from './components/DateFormatSelect.jsx';
import XeroAuth from './components/XeroAuth.js';
import XeroCallback from './components/XeroCallback.js';
import ARSourceSelector from './components/ARSourceSelector.js';
import { FileUpload } from './components/FileUpload.jsx';
import { AuthUtils } from './utils/auth.js';

// ... (Previous code remains the same until handleProcessFiles)

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
        // Add the file with the expected field name 'csvFile'
        formData1.append('csvFile', files.company1.file);
        formData1.append('dateFormat', dateFormats.company1);

        console.log('Sending AR file:', {
          name: files.company1.file.name,
          size: files.company1.file.size,
          type: files.company1.file.type
        });

        const response1 = await fetch('https://ledger-match-backend.onrender.com/process-csv', {
          method: 'POST',
          body: formData1
        });

        if (!response1.ok) {
          let errorData;
          try {
            errorData = await response1.json();
          } catch (e) {
            errorData = await response1.text();
          }
          console.error('Server error:', errorData);
          throw new Error(`Failed to process first CSV file: ${JSON.stringify(errorData)}`);
        }

        company1Data = await response1.json();
      } else {
        company1Data = files.company1.data;
      }

      // Process company 2 data (AP)
      const formData2 = new FormData();
      formData2.append('csvFile', files.company2.file);
      formData2.append('dateFormat', dateFormats.company2);

      console.log('Sending AP file:', {
        name: files.company2.file.name,
        size: files.company2.file.size,
        type: files.company2.file.type
      });

      const response2 = await fetch('https://ledger-match-backend.onrender.com/process-csv', {
        method: 'POST',
        body: formData2
      });

      if (!response2.ok) {
        let errorData;
        try {
          errorData = await response2.json();
        } catch (e) {
          errorData = await response2.text();
        }
        console.error('Server error:', errorData);
        throw new Error(`Failed to process second CSV file: ${JSON.stringify(errorData)}`);
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
        let errorData;
        try {
          errorData = await matchResults.json();
        } catch (e) {
          errorData = await matchResults.text();
        }
        console.error('Server error:', errorData);
        throw new Error(`Failed to match data: ${JSON.stringify(errorData)}`);
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