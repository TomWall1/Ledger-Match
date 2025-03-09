import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import MatchingResults from '../components/MatchingResults';
import NavHeader from '../components/NavHeader';
import { 
  convertToCSV, 
  downloadCSV, 
  preparePerfectMatchesForExport,
  prepareMismatchesForExport,
  prepareUnmatchedItemsForExport,
  prepareHistoricalInsightsForExport
} from '../utils/exportUtils';

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const results = location.state?.results;

  if (!results) {
    navigate('/upload');
    return null;
  }

  // Function to handle exporting all results to CSV
  const handleExportAll = () => {
    // Get the current date for the filename
    const date = new Date().toISOString().split('T')[0];
    
    // Prepare all data
    const allData = {
      perfectMatches: preparePerfectMatchesForExport(results.perfectMatches),
      mismatches: prepareMismatchesForExport(results.mismatches),
      unmatchedReceivables: prepareUnmatchedItemsForExport(results.unmatchedItems).company1,
      unmatchedPayables: prepareUnmatchedItemsForExport(results.unmatchedItems).company2,
      historicalInsights: prepareHistoricalInsightsForExport(results.historicalInsights)
    };
    
    // Define headers for the perfect matches
    const perfectMatchesHeaders = [
      { key: 'transactionNumber', label: 'Transaction #' },
      { key: 'type', label: 'Type' },
      { key: 'amount', label: 'Amount' },
      { key: 'date', label: 'Date' },
      { key: 'dueDate', label: 'Due Date' },
      { key: 'status', label: 'Status' },
      { key: 'partiallyPaid', label: 'Partially Paid' },
      { key: 'amountPaid', label: 'Amount Paid' },
      { key: 'originalAmount', label: 'Original Amount' }
    ];
    
    // Define headers for mismatches
    const mismatchesHeaders = [
      { key: 'transactionNumber', label: 'Transaction #' },
      { key: 'type', label: 'Type' },
      { key: 'receivableAmount', label: 'Receivable Amount' },
      { key: 'payableAmount', label: 'Payable Amount' },
      { key: 'difference', label: 'Difference' },
      { key: 'date', label: 'Date' },
      { key: 'status', label: 'Status' },
      { key: 'partiallyPaid', label: 'Partially Paid' },
      { key: 'paymentDate', label: 'Payment Date' }
    ];
    
    // Define headers for unmatched items (both AR and AP)
    const unmatchedHeaders = [
      { key: 'transactionNumber', label: 'Transaction #' },
      { key: 'type', label: 'Type' },
      { key: 'amount', label: 'Amount' },
      { key: 'date', label: 'Date' },
      { key: 'dueDate', label: 'Due Date' },
      { key: 'status', label: 'Status' },
      { key: 'partiallyPaid', label: 'Partially Paid' },
      { key: 'amountPaid', label: 'Amount Paid' },
      { key: 'originalAmount', label: 'Original Amount' }
    ];
    
    // Define headers for historical insights
    const historicalInsightsHeaders = [
      { key: 'apTransactionNumber', label: 'AP Transaction #' },
      { key: 'apAmount', label: 'AP Amount' },
      { key: 'apDate', label: 'AP Date' },
      { key: 'apStatus', label: 'AP Status' },
      { key: 'arTransactionNumber', label: 'AR Transaction #' },
      { key: 'arOriginalAmount', label: 'AR Original Amount' },
      { key: 'arCurrentAmount', label: 'AR Current Amount' },
      { key: 'arAmountPaid', label: 'AR Amount Paid' },
      { key: 'arDate', label: 'AR Date' },
      { key: 'arStatus', label: 'AR Status' },
      { key: 'arPaymentDate', label: 'AR Payment Date' },
      { key: 'insightType', label: 'Insight Type' },
      { key: 'insightMessage', label: 'Insight Message' },
      { key: 'insightSeverity', label: 'Insight Severity' }
    ];
    
    // Convert each dataset to CSV
    const perfectMatchesCSV = convertToCSV(allData.perfectMatches, perfectMatchesHeaders);
    const mismatchesCSV = convertToCSV(allData.mismatches, mismatchesHeaders);
    const unmatchedReceivablesCSV = convertToCSV(allData.unmatchedReceivables, unmatchedHeaders);
    const unmatchedPayablesCSV = convertToCSV(allData.unmatchedPayables, unmatchedHeaders);
    const historicalInsightsCSV = allData.historicalInsights.length ? 
      convertToCSV(allData.historicalInsights, historicalInsightsHeaders) : '';
    
    // Create a zip file with all CSVs
    // Since we can't easily create a zip file without additional libraries,
    // we'll download individual files with a common prefix
    const filePrefix = `ledger-match-${date}`;
    
    // Download each file
    if (allData.perfectMatches.length) {
      downloadCSV(perfectMatchesCSV, `${filePrefix}-perfect-matches.csv`);
    }
    
    if (allData.mismatches.length) {
      downloadCSV(mismatchesCSV, `${filePrefix}-mismatches.csv`);
    }
    
    if (allData.unmatchedReceivables.length) {
      downloadCSV(unmatchedReceivablesCSV, `${filePrefix}-unmatched-receivables.csv`);
    }
    
    if (allData.unmatchedPayables.length) {
      downloadCSV(unmatchedPayablesCSV, `${filePrefix}-unmatched-payables.csv`);
    }
    
    if (allData.historicalInsights.length) {
      downloadCSV(historicalInsightsCSV, `${filePrefix}-historical-insights.csv`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavHeader />
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-[#1B365D]">Matching Results</h1>
          <div className="flex space-x-4">
            <button
              onClick={handleExportAll}
              className="flex items-center px-4 py-2 bg-[#1B365D] text-white rounded-lg hover:bg-opacity-90 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Export All CSV
            </button>
            <Link
              to="/upload"
              className="flex items-center px-4 py-2 bg-[#00A4B4] text-white rounded-lg hover:bg-[#008999] transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              Upload New Files
            </Link>
            <Link
              to="/"
              className="flex items-center text-[#1B365D] hover:text-[#00A4B4] transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Home
            </Link>
          </div>
        </div>

        <MatchingResults matchResults={results} handleExportAll={handleExportAll} />
      </div>
    </div>
  );
};

export default Results;