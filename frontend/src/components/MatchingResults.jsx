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

  const ExportButton = ({ data, filename }) => (
    <button
      onClick={() => exportToCSV(data, filename)}
      className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
    >
      Export CSV
    </button>
  );

  const TransactionDisplay = ({ transaction, title }) => (
    <div className="border rounded p-3">
      <h4 className="font-medium mb-2">{title}</h4>
      <div className="space-y-1 text-sm">
        <p>Transaction #: {transaction.transactionNumber}</p>
        <p>Type: {transaction.type}</p>
        <p>Amount: {formatCurrency(transaction.amount)}</p>
        <p>Date: {formatDate(transaction.date)}</p>
        <p>Status: {transaction.status}</p>
        <p>Reference: {transaction.reference}</p>
      </div>
    </div>
  );

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
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium mb-2">Total Transactions</h3>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{totalTransactions}</p>
              <p className="text-lg text-gray-600">
                {formatCurrency(
                  calculateTotalAmount(matchResults.perfectMatches) +
                  calculateTotalAmount(matchResults.mismatches) +
                  calculateUnmatchedAmount(matchResults.unmatchedItems.company1)
                )}
              </p>
            </div>
          </div>

          <div 
            onClick={() => scrollToSection('perfectMatches')}
            className="p-4 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100 transition-colors"
          >
            <h3 className="text-sm font-medium text-green-800 mb-2 flex items-center gap-2">
              Perfect Matches
              <span className="text-xs text-green-600">(click to view)</span>
            </h3>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-green-600">
                {matchResults.perfectMatches.length}
                <span className="text-sm ml-2">
                  ({formatPercentage(matchResults.perfectMatches.length, totalTransactions)})
                </span>
              </p>
              <p className="text-lg text-green-600">
                {formatCurrency(calculateTotalAmount(matchResults.perfectMatches))}
              </p>
            </div>
          </div>

          <div 
            onClick={() => scrollToSection('mismatches')}
            className="p-4 bg-yellow-50 rounded-lg cursor-pointer hover:bg-yellow-100 transition-colors"
          >
            <h3 className="text-sm font-medium text-yellow-800 mb-2 flex items-center gap-2">
              Mismatches
              <span className="text-xs text-yellow-600">(click to view)</span>
            </h3>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-yellow-600">
                {matchResults.mismatches.length}
                <span className="text-sm ml-2">
                  ({formatPercentage(matchResults.mismatches.length, totalTransactions)})
                </span>
              </p>
              <p className="text-lg text-yellow-600">
                {formatCurrency(calculateTotalAmount(matchResults.mismatches))}
              </p>
            </div>
          </div>

          <div 
            onClick={() => scrollToSection('unmatchedItems')}
            className="p-4 bg-red-50 rounded-lg cursor-pointer hover:bg-red-100 transition-colors"
          >
            <h3 className="text-sm font-medium text-red-800 mb-2 flex items-center gap-2">
              Unmatched
              <span className="text-xs text-red-600">(click to view)</span>
            </h3>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-red-600">
                {matchResults.unmatchedItems.company1.length + matchResults.unmatchedItems.company2.length}
                <span className="text-sm ml-2">
                  ({formatPercentage(
                    matchResults.unmatchedItems.company1.length + matchResults.unmatchedItems.company2.length, 
                    totalTransactions
                  )})
                </span>
              </p>
              <p className="text-lg text-red-600">
                {formatCurrency(
                  calculateUnmatchedAmount(matchResults.unmatchedItems.company1) +
                  calculateUnmatchedAmount(matchResults.unmatchedItems.company2)
                )}
              </p>
            </div>
          </div>
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
              <ExportButton data={matchResults.perfectMatches} filename="perfect-matches" />
            </div>
          </div>
          {expandedSections.perfectMatches && (
            <div className="max-h-96 overflow-y-auto p-4">
              <div className="space-y-4">
                {matchResults.perfectMatches.map((match, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-green-50 rounded-lg">
                    <TransactionDisplay transaction={match.source} title="Accounts Receivables Ledger" />
                    <TransactionDisplay transaction={match.matched} title="Accounts Payable Ledger" />
                  </div>
                ))}
              </div>
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
              <ExportButton data={filteredMismatches} filename="mismatches" />
            </div>
            <FilterDropdown value={mismatchFilter} onChange={setMismatchFilter} />
          </div>
          {expandedSections.mismatches && (
            <div className="max-h-96 overflow-y-auto p-4">
              <div className="space-y-4">
                {filteredMismatches.map((match, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-yellow-50 rounded-lg">
                    <TransactionDisplay transaction={match.source} title="Accounts Receivables Ledger" />
                    <TransactionDisplay transaction={match.matched} title="Accounts Payable Ledger" />
                    <div className="col-span-2 text-sm text-red-600">
                      <p className="font-medium">Differences found in:</p>
                      <ul className="list-disc list-inside">
                        {match.differences.amount && <li>Amount</li>}
                        {match.differences.date && <li>Date</li>}
                        {match.differences.status && <li>Status</li>}
                        {match.differences.type && <li>Type</li>}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
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
              <ExportButton 
                data={[...matchResults.unmatchedItems.company1, ...matchResults.unmatchedItems.company2]} 
                filename="unmatched-items" 
              />
            </div>
          </div>
          {expandedSections.unmatchedItems && (
            <div className="max-h-96 overflow-y-auto p-4">
              {matchResults.unmatchedItems.company1.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Only in Accounts Receivables Ledger ({matchResults.unmatchedItems.company1.length})</h3>
                  <div className="space-y-4">
                    {matchResults.unmatchedItems.company1.map((transaction, index) => (
                      <div key={index} className="p-4 bg-red-50 rounded-lg">
                        <TransactionDisplay transaction={transaction} title="Transaction Details" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {matchResults.unmatchedItems.company2.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Only in Accounts Payable Ledger ({matchResults.unmatchedItems.company2.length})</h3>
                  <div className="space-y-4">
                    {matchResults.unmatchedItems.company2.map((transaction, index) => (
                      <div key={index} className="p-4 bg-red-50 rounded-lg">
                        <TransactionDisplay transaction={transaction} title="Transaction Details" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchingResults;