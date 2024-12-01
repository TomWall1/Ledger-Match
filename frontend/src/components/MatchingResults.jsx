import React, { useRef } from 'react';
import { convertToCSV, downloadCSV, prepareExportData } from '../utils/CSVExportHelper';

const MatchingResults = ({ matchResults }) => {
  // Refs for scrolling
  const perfectMatchesRef = useRef(null);
  const mismatchesRef = useRef(null);
  const unmatchedRef = useRef(null);

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return 'N/A';
    return parseFloat(amount).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD'
    });
  };

  const formatPercentage = (amount, total) => {
    if (!amount || !total) return '0%';
    return ((amount / total) * 100).toFixed(2) + '%';
  };

  const scrollToSection = (ref) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleExport = (type) => {
    const exportData = prepareExportData(matchResults);
    let data, headers, fileName;

    switch(type) {
      case 'perfect':
        data = exportData.perfectMatchesData;
        headers = [
          { key: 'transactionNumber', label: 'Transaction #' },
          { key: 'type', label: 'Type' },
          { key: 'amount', label: 'Amount' },
          { key: 'date', label: 'Date' },
          { key: 'status', label: 'Status' },
          { key: 'matchType', label: 'Match Type' }
        ];
        fileName = 'perfect-matches.csv';
        break;
      case 'mismatches':
        data = exportData.mismatchesData;
        headers = [
          { key: 'transactionNumber', label: 'Transaction #' },
          { key: 'type', label: 'Type' },
          { key: 'amount', label: 'Receivable Amount' },
          { key: 'matchedAmount', label: 'Payable Amount' },
          { key: 'difference', label: 'Difference' },
          { key: 'matchType', label: 'Match Type' }
        ];
        fileName = 'mismatches.csv';
        break;
      case 'unmatched':
        data = [...exportData.unmatchedReceivables, ...exportData.unmatchedPayables];
        headers = [
          { key: 'transactionNumber', label: 'Transaction #' },
          { key: 'amount', label: 'Amount' },
          { key: 'date', label: 'Date' },
          { key: 'status', label: 'Status' },
          { key: 'matchType', label: 'Match Type' }
        ];
        fileName = 'unmatched-items.csv';
        break;
      case 'all':
        data = exportData.allData;
        headers = [
          { key: 'transactionNumber', label: 'Transaction #' },
          { key: 'type', label: 'Type' },
          { key: 'amount', label: 'Amount' },
          { key: 'date', label: 'Date' },
          { key: 'status', label: 'Status' },
          { key: 'matchType', label: 'Match Type' }
        ];
        fileName = 'all-transactions.csv';
        break;
      default:
        return;
    }

    const csvContent = convertToCSV(data, headers.map(h => h.label));
    downloadCSV(csvContent, fileName);
  };

  const { totals, perfectMatches, mismatches, unmatchedItems } = matchResults;
  const totalReceivables = parseFloat(totals.company1Total);

  const SummaryCard = ({ title, count, amount, total, bgColor, textColor, borderColor, onClick }) => (
    <div 
      className={`${bgColor} rounded-lg shadow p-6 border ${borderColor} cursor-pointer transform hover:scale-105 transition-transform duration-200`}
      onClick={onClick}
    >
      <h3 className={`text-lg font-semibold ${textColor} mb-2`}>{title}</h3>
      <p className={`text-3xl font-bold ${textColor}`}>{count}</p>
      <p className={`text-sm ${textColor} mt-2`}>
        {formatCurrency(amount)} ({formatPercentage(amount, total)})
      </p>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Export All Button */}
      <div className="flex justify-end">
        <button
          onClick={() => handleExport('all')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Export All Data
        </button>
      </div>

      {/* Summary Cards */}
      {/* ... (Previous summary cards code remains the same) ... */}

      {/* Match Summary with enhanced information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard
          title="Perfect Matches"
          count={perfectMatches.length}
          amount={perfectMatches.reduce((sum, match) => sum + match.source.amount, 0)}
          total={totalReceivables}
          bgColor="bg-green-50"
          textColor="text-green-800"
          borderColor="border-green-200"
          onClick={() => scrollToSection(perfectMatchesRef)}
        />
        <SummaryCard
          title="Mismatches"
          count={mismatches.length}
          amount={mismatches.reduce((sum, match) => sum + match.source.amount, 0)}
          total={totalReceivables}
          bgColor="bg-yellow-50"
          textColor="text-yellow-800"
          borderColor="border-yellow-200"
          onClick={() => scrollToSection(mismatchesRef)}
        />
        <SummaryCard
          title="Unmatched Items"
          count={(unmatchedItems.company1?.length || 0) + (unmatchedItems.company2?.length || 0)}
          amount={[...(unmatchedItems.company1 || []), ...(unmatchedItems.company2 || [])].reduce((sum, item) => sum + item.amount, 0)}
          total={totalReceivables}
          bgColor="bg-red-50"
          textColor="text-red-800"
          borderColor="border-red-200"
          onClick={() => scrollToSection(unmatchedRef)}
        />
      </div>

      {/* Perfect Matches Section */}
      <div ref={perfectMatchesRef}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Perfect Matches ({perfectMatches.length})</h2>
          <button
            onClick={() => handleExport('perfect')}
            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            Export
          </button>
        </div>
        {/* ... (Perfect matches table remains the same) ... */}
      </div>

      {/* Mismatches Section */}
      <div ref={mismatchesRef}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Mismatches ({mismatches.length})</h2>
          <button
            onClick={() => handleExport('mismatches')}
            className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
          >
            Export
          </button>
        </div>
        {/* ... (Mismatches table remains the same) ... */}
      </div>

      {/* Unmatched Items Section */}
      <div ref={unmatchedRef}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Unmatched Items</h2>
          <button
            onClick={() => handleExport('unmatched')}
            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Export
          </button>
        </div>
        {/* ... (Unmatched items tables remain the same) ... */}
      </div>
    </div>
  );
};

export default MatchingResults;