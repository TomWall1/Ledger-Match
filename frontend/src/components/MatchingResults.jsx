import React, { useState } from 'react';
import { exportToCSV } from './CSVExportHelper.js';

const MatchingResults = ({ matchResults }) => {
  const [mismatchFilter, setMismatchFilter] = useState('all');
  const [unmatchedFilter, setUnmatchedFilter] = useState('all');
  const [expandedSections, setExpandedSections] = useState({
    perfectMatches: true,
    mismatches: true,
    unmatchedItems: true
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (count, total) => {
    if (total === 0) return '0%';
    return `${((count / total) * 100).toFixed(1)}%`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateTotalAmount = transactions => {
    return transactions.reduce((sum, t) => sum + (t.source ? t.source.amount : t.amount), 0);
  };

  const calculateUnmatchedAmount = items => {
    return items.reduce((sum, t) => sum + t.amount, 0);
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setExpandedSections(prev => ({
        ...prev,
        [sectionId]: true
      }));
    }
  };

  const filteredMismatches = matchResults.mismatches.filter(match => {
    if (mismatchFilter === 'all') return true;
    return match.differences[mismatchFilter];
  });

  const totalTransactions = 
    matchResults.perfectMatches.length + 
    matchResults.mismatches.length + 
    matchResults.unmatchedItems.company1.length + 
    matchResults.unmatchedItems.company2.length;

  const FilterDropdown = ({ value, onChange }) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-2 py-1 border rounded text-sm"
    >
      <option value="all">All Differences</option>
      <option value="amount">Amount Differences</option>
      <option value="date">Date Differences</option>
      <option value="status">Status Differences</option>
      <option value="type">Type Differences</option>
    </select>
  );

  // Updated ExportButton component
  const ExportButton = ({ dataType, data }) => {
    const handleExport = () => {
      console.log('Export button clicked:', dataType);
      let exportData;
      
      switch (dataType) {
        case 'perfect-matches':
          exportData = data;
          break;
        case 'mismatches':
          exportData = data;
          break;
        case 'unmatched-items':
          exportData = [
            ...matchResults.unmatchedItems.company1.map(item => ({ ...item, isAR: true })),
            ...matchResults.unmatchedItems.company2.map(item => ({ ...item, isAR: false }))
          ];
          break;
        default:
          console.error('Unknown export type:', dataType);
          return;
      }
      
      try {
        exportToCSV(exportData, dataType);
      } catch (error) {
        console.error('Error during export:', error);
      }
    };

    return (
      <button
        onClick={handleExport}
        className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Export CSV
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {/* Totals Summary */}
      <div className="bg-white rounded-lg p-6 border">
        <h2 className="text-xl font-bold mb-4">Ledger Totals (Open Items)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium mb-2">Accounts Receivables Ledger Total</h3>
            <p className="text-2xl font-bold">{formatCurrency(parseFloat(matchResults.totals.company1Total))}</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium mb-2">Accounts Payable Ledger Total</h3>
            <p className="text-2xl font-bold">{formatCurrency(parseFloat(matchResults.totals.company2Total))}</p>
          </div>
          <div className={`p-4 rounded-lg ${parseFloat(matchResults.totals.variance) === 0 ? 'bg-green-50' : 'bg-red-50'}`}>
            <h3 className="text-sm font-medium mb-2">Variance</h3>
            <p className={`text-2xl font-bold ${parseFloat(matchResults.totals.variance) === 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(parseFloat(matchResults.totals.variance))}
            </p>
          </div>
        </div>
      </div>

      {/* Match Type Breakdown */}
      <div className="bg-white rounded-lg p-6 border mt-6">
        <h2 className="text-lg font-semibold mb-4">Match Type Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* ... your existing breakdown items ... */}
        </div>
      </div>

      {/* Results Sections */}
      <div className="space-y-4">
        {/* Perfect Matches */}
        <div id="perfectMatches" className="bg-white rounded-lg border">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setExpandedSections(prev => ({ ...prev, perfectMatches: !prev.perfectMatches }))}
                className="text-lg font-semibold flex items-center gap-2"
              >
                <span className={`transform transition-transform ${expandedSections.perfectMatches ? 'rotate-90' : ''}`}>▶</span>
                Perfect Matches ({matchResults.perfectMatches.length})
              </button>
              <ExportButton dataType="perfect-matches" data={matchResults.perfectMatches} />
            </div>
          </div>
          {expandedSections.perfectMatches && (
            <div className="max-h-96 overflow-y-auto p-4">
              {/* ... your perfect matches content ... */}
            </div>
          )}
        </div>

        {/* Mismatches */}
        <div id="mismatches" className="bg-white rounded-lg border">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setExpandedSections(prev => ({ ...prev, mismatches: !prev.mismatches }))}
                className="text-lg font-semibold flex items-center gap-2"
              >
                <span className={`transform transition-transform ${expandedSections.mismatches ? 'rotate-90' : ''}`}>▶</span>
                Mismatches ({filteredMismatches.length})
              </button>
              <ExportButton dataType="mismatches" data={filteredMismatches} />
            </div>
            <FilterDropdown value={mismatchFilter} onChange={setMismatchFilter} />
          </div>
          {expandedSections.mismatches && (
            <div className="max-h-96 overflow-y-auto p-4">
              {/* ... your mismatches content ... */}
            </div>
          )}
        </div>

        {/* Unmatched Items */}
        <div id="unmatchedItems" className="bg-white rounded-lg border">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setExpandedSections(prev => ({ ...prev, unmatchedItems: !prev.unmatchedItems }))}
                className="text-lg font-semibold flex items-center gap-2"
              >
                <span className={`transform transition-transform ${expandedSections.unmatchedItems ? 'rotate-90' : ''}`}>▶</span>
                Unmatched Items ({matchResults.unmatchedItems.company1.length + matchResults.unmatchedItems.company2.length})
              </button>
              <ExportButton dataType="unmatched-items" data={null} />
            </div>
          </div>
          {expandedSections.unmatchedItems && (
            <div className="max-h-96 overflow-y-auto p-4">
              {/* ... your unmatched items content ... */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchingResults;