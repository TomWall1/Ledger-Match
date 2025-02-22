import React, { useRef } from 'react';
import { convertToCSV, downloadCSV, prepareExportData } from '../utils/CSVExportHelper';

const MatchingResults = ({ matchResults }) => {
  const perfectMatchesRef = useRef(null);
  const mismatchesRef = useRef(null);
  const unmatchedRef = useRef(null);

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return 'N/A';
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) return 'N/A';
    return numericAmount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD'
    });
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString();
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'N/A';
    }
  };

  const formatPercentage = (amount, total) => {
    if (!amount || !total) return '0%';
    const numAmount = parseFloat(amount);
    const numTotal = parseFloat(total);
    if (isNaN(numAmount) || isNaN(numTotal) || numTotal === 0) return '0%';
    return ((numAmount / numTotal) * 100).toFixed(2) + '%';
  };

  const scrollToSection = (ref) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Ensure arrays and objects exist
  const safeMatchResults = matchResults || {};
  const safePerfectMatches = Array.isArray(safeMatchResults.perfectMatches) ? safeMatchResults.perfectMatches : [];
  const safeMismatches = Array.isArray(safeMatchResults.mismatches) ? safeMatchResults.mismatches : [];
  const safeUnmatchedItems = safeMatchResults.unmatchedItems || { company1: [], company2: [] };
  const safeTotals = safeMatchResults.totals || { company1Total: 0, company2Total: 0, variance: 0 };

  // Safe amount calculations
  const calculateAmount = (item) => {
    if (!item) return 0;
    const amount = parseFloat(item.amount);
    return isNaN(amount) ? 0 : amount;
  };

  // Calculate total amounts for each category with safe accessors
  const perfectMatchAmount = safePerfectMatches.reduce((sum, match) => {
    const amount = match && match.company1 ? calculateAmount(match.company1) : 0;
    return sum + amount;
  }, 0);

  const mismatchAmount = safeMismatches.reduce((sum, match) => {
    const amount = match && match.company1 ? calculateAmount(match.company1) : 0;
    return sum + amount;
  }, 0);

  const unmatchedAmount = [
    ...(safeUnmatchedItems.company1 || []),
    ...(safeUnmatchedItems.company2 || [])
  ].reduce((sum, item) => sum + calculateAmount(item), 0);

  // Safe total receivables calculation
  const totalReceivables = parseFloat(safeTotals.company1Total || 0);

  if (!matchResults) {
    return <div>No results to display</div>;
  }

  const ResultTable = ({ title, data, columns }) => (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="overflow-x-auto" style={{ maxHeight: '400px' }}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              {columns.map((col, index) => (
                <th key={index} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50">
                {Object.values(row).map((value, cellIndex) => (
                  <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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

      {/* Totals Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-2">Accounts Receivable Total</h3>
          <p className="text-3xl font-bold text-blue-600">{formatCurrency(safeTotals.company1Total)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-2">Accounts Payable Total</h3>
          <p className="text-3xl font-bold text-blue-600">{formatCurrency(safeTotals.company2Total)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-2">Variance</h3>
          <p className={`text-3xl font-bold ${Number(safeTotals.variance) === 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(safeTotals.variance)}
          </p>
        </div>
      </div>

      {/* Match Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          className="bg-green-50 rounded-lg shadow p-6 border border-green-200 cursor-pointer hover:bg-green-100 transition-colors"
          onClick={() => scrollToSection(perfectMatchesRef)}
        >
          <h3 className="text-lg font-semibold text-green-800">Perfect Matches</h3>
          <p className="text-3xl font-bold text-green-600">{safePerfectMatches.length}</p>
          <p className="text-sm text-green-600 mt-2">
            {formatCurrency(perfectMatchAmount)}
            <br />
            ({formatPercentage(perfectMatchAmount, totalReceivables)})
          </p>
        </div>

        <div 
          className="bg-yellow-50 rounded-lg shadow p-6 border border-yellow-200 cursor-pointer hover:bg-yellow-100 transition-colors"
          onClick={() => scrollToSection(mismatchesRef)}
        >
          <h3 className="text-lg font-semibold text-yellow-800">Mismatches</h3>
          <p className="text-3xl font-bold text-yellow-600">{safeMismatches.length}</p>
          <p className="text-sm text-yellow-600 mt-2">
            {formatCurrency(mismatchAmount)}
            <br />
            ({formatPercentage(mismatchAmount, totalReceivables)})
          </p>
        </div>

        <div 
          className="bg-red-50 rounded-lg shadow p-6 border border-red-200 cursor-pointer hover:bg-red-100 transition-colors"
          onClick={() => scrollToSection(unmatchedRef)}
        >
          <h3 className="text-lg font-semibold text-red-800">Unmatched Items</h3>
          <p className="text-3xl font-bold text-red-600">
            {(safeUnmatchedItems.company1?.length || 0) + (safeUnmatchedItems.company2?.length || 0)}
          </p>
          <p className="text-sm text-red-600 mt-2">
            {formatCurrency(unmatchedAmount)}
            <br />
            ({formatPercentage(unmatchedAmount, totalReceivables)})
          </p>
        </div>
      </div>

      {/* Perfect Matches Section */}
      <div ref={perfectMatchesRef}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Perfect Matches ({safePerfectMatches.length})</h2>
          <button
            onClick={() => handleExport('perfect')}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            Export CSV
          </button>
        </div>
        <ResultTable
          data={safePerfectMatches.map(match => ({
            'Transaction #': match?.company1?.transactionNumber || match?.company2?.transactionNumber || 'N/A',
            'Type': match?.company1?.type || match?.company2?.type || 'N/A',
            'Amount': formatCurrency(match?.company1?.amount || 0),
            'Date': formatDate(match?.company1?.date || match?.company2?.date),
            'Due Date': formatDate(match?.company1?.dueDate || match?.company2?.dueDate),
            'Status': match?.company1?.status || match?.company2?.status || 'N/A'
          }))}
          columns={['Transaction #', 'Type', 'Amount', 'Date', 'Due Date', 'Status']}
        />
      </div>

      {/* Mismatches Section */}
      <div ref={mismatchesRef}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Mismatches ({safeMismatches.length})</h2>
          <button
            onClick={() => handleExport('mismatches')}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
          >
            Export CSV
          </button>
        </div>
        <ResultTable
          data={safeMismatches.map(mismatch => ({
            'Transaction #': mismatch?.company1?.transactionNumber || mismatch?.company2?.transactionNumber || 'N/A',
            'Type': mismatch?.company1?.type || mismatch?.company2?.type || 'N/A',
            'Receivable Amount': formatCurrency(mismatch?.company1?.amount || 0),
            'Payable Amount': formatCurrency(mismatch?.company2?.amount || 0),
            'Difference': formatCurrency((mismatch?.company1?.amount || 0) + (mismatch?.company2?.amount || 0)),
            'Date': formatDate(mismatch?.company1?.date || mismatch?.company2?.date),
            'Status': mismatch?.company1?.status || mismatch?.company2?.status || 'N/A'
          }))}
          columns={['Transaction #', 'Type', 'Receivable Amount', 'Payable Amount', 'Difference', 'Date', 'Status']}
        />
      </div>

      {/* Unmatched Items Section */}
      <div ref={unmatchedRef}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Unmatched Items</h2>
          <button
            onClick={() => handleExport('unmatched')}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Export CSV
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Unmatched Receivables ({safeUnmatchedItems.company1?.length || 0})</h3>
            <ResultTable
              data={(safeUnmatchedItems.company1 || []).map(item => ({
                'Transaction #': item?.transactionNumber || 'N/A',
                'Amount': formatCurrency(item?.amount || 0),
                'Date': formatDate(item?.date),
                'Due Date': formatDate(item?.dueDate),
                'Status': item?.status || 'N/A'
              }))}
              columns={['Transaction #', 'Amount', 'Date', 'Due Date', 'Status']}
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Unmatched Payables ({safeUnmatchedItems.company2?.length || 0})</h3>
            <ResultTable
              data={(safeUnmatchedItems.company2 || []).map(item => ({
                'Transaction #': item?.transactionNumber || 'N/A',
                'Amount': formatCurrency(item?.amount || 0),
                'Date': formatDate(item?.date),
                'Due Date': formatDate(item?.dueDate),
                'Status': item?.status || 'N/A'
              }))}
              columns={['Transaction #', 'Amount', 'Date', 'Due Date', 'Status']}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchingResults;