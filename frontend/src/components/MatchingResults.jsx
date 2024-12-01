import React, { useRef } from 'react';
import { convertToCSV, downloadCSV, prepareExportData } from '../utils/CSVExportHelper';

const MatchingResults = ({ matchResults }) => {
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

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
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
          { key: 'dueDate', label: 'Due Date' },
          { key: 'status', label: 'Status' },
          { key: 'reference', label: 'Reference' },
          { key: 'matchType', label: 'Match Type' }
        ];
        fileName = 'perfect-matches.csv';
        break;

      case 'mismatches':
        data = exportData.mismatchesData;
        headers = [
          { key: 'transactionNumber', label: 'Transaction #' },
          { key: 'type', label: 'Type' },
          { key: 'receivableAmount', label: 'Receivable Amount' },
          { key: 'payableAmount', label: 'Payable Amount' },
          { key: 'difference', label: 'Difference' },
          { key: 'date', label: 'Date' },
          { key: 'dueDate', label: 'Due Date' },
          { key: 'status', label: 'Status' },
          { key: 'reference', label: 'Reference' },
          { key: 'matchType', label: 'Match Type' }
        ];
        fileName = 'mismatches.csv';
        break;

      case 'unmatched':
        data = [...exportData.unmatchedReceivables, ...exportData.unmatchedPayables];
        headers = [
          { key: 'transactionNumber', label: 'Transaction #' },
          { key: 'type', label: 'Type' },
          { key: 'amount', label: 'Amount' },
          { key: 'date', label: 'Date' },
          { key: 'dueDate', label: 'Due Date' },
          { key: 'status', label: 'Status' },
          { key: 'reference', label: 'Reference' },
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
          { key: 'dueDate', label: 'Due Date' },
          { key: 'status', label: 'Status' },
          { key: 'reference', label: 'Reference' },
          { key: 'matchType', label: 'Match Type' }
        ];
        fileName = 'all-transactions.csv';
        break;

      default:
        return;
    }

    const csvContent = convertToCSV(data, headers);
    downloadCSV(csvContent, fileName);
  };

  if (!matchResults) {
    return <div>No results to display</div>;
  }

  const { totals, perfectMatches, mismatches, unmatchedItems } = matchResults;
  const totalReceivables = parseFloat(totals.company1Total);

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
          <p className="text-3xl font-bold text-blue-600">{formatCurrency(totals.company1Total)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-2">Accounts Payable Total</h3>
          <p className="text-3xl font-bold text-blue-600">{formatCurrency(totals.company2Total)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-2">Variance</h3>
          <p className={`text-3xl font-bold ${Number(totals.variance) === 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(totals.variance)}
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
          <p className="text-3xl font-bold text-green-600">{perfectMatches.length}</p>
          <p className="text-sm text-green-600 mt-2">
            {formatCurrency(perfectMatches.reduce((sum, match) => sum + match.source.amount, 0))}
            <br />
            ({formatPercentage(perfectMatches.reduce((sum, match) => sum + match.source.amount, 0), totalReceivables)})
          </p>
        </div>

        <div 
          className="bg-yellow-50 rounded-lg shadow p-6 border border-yellow-200 cursor-pointer hover:bg-yellow-100 transition-colors"
          onClick={() => scrollToSection(mismatchesRef)}
        >
          <h3 className="text-lg font-semibold text-yellow-800">Mismatches</h3>
          <p className="text-3xl font-bold text-yellow-600">{mismatches.length}</p>
          <p className="text-sm text-yellow-600 mt-2">
            {formatCurrency(mismatches.reduce((sum, match) => sum + match.source.amount, 0))}
            <br />
            ({formatPercentage(mismatches.reduce((sum, match) => sum + match.source.amount, 0), totalReceivables)})
          </p>
        </div>

        <div 
          className="bg-red-50 rounded-lg shadow p-6 border border-red-200 cursor-pointer hover:bg-red-100 transition-colors"
          onClick={() => scrollToSection(unmatchedRef)}
        >
          <h3 className="text-lg font-semibold text-red-800">Unmatched Items</h3>
          <p className="text-3xl font-bold text-red-600">
            {(unmatchedItems.company1?.length || 0) + (unmatchedItems.company2?.length || 0)}
          </p>
          <p className="text-sm text-red-600 mt-2">
            {formatCurrency(
              [...(unmatchedItems.company1 || []), ...(unmatchedItems.company2 || [])].reduce((sum, item) => sum + item.amount, 0)
            )}
            <br />
            ({formatPercentage(
              [...(unmatchedItems.company1 || []), ...(unmatchedItems.company2 || [])].reduce((sum, item) => sum + item.amount, 0),
              totalReceivables
            )})
          </p>
        </div>
      </div>

      {/* Perfect Matches Section */}
      <div ref={perfectMatchesRef}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Perfect Matches ({perfectMatches.length})</h2>
          <button
            onClick={() => handleExport('perfect')}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            Export CSV
          </button>
        </div>
        <ResultTable
          data={perfectMatches.map(match => ({
            'Transaction #': match.source.transactionNumber,
            'Type': match.source.type,
            'Amount': formatCurrency(match.source.amount),
            'Date': formatDate(match.source.date),
            'Due Date': formatDate(match.source.dueDate),
            'Status': match.source.status
          }))}
          columns={['Transaction #', 'Type', 'Amount', 'Date', 'Due Date', 'Status']}
        />
      </div>

      {/* Mismatches Section */}
      <div ref={mismatchesRef}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Mismatches ({mismatches.length})</h2>
          <button
            onClick={() => handleExport('mismatches')}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
          >
            Export CSV
          </button>
        </div>
        <ResultTable
          data={mismatches.map(mismatch => ({
            'Transaction #': mismatch.source.transactionNumber,
            'Type': mismatch.source.type,
            'Receivable Amount': formatCurrency(mismatch.source.amount),
            'Payable Amount': formatCurrency(mismatch.matched.amount),
            'Difference': formatCurrency(mismatch.source.amount - mismatch.matched.amount),
            'Date': formatDate(mismatch.source.date),
            'Status': mismatch.source.status
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
            <h3 className="text-lg font-semibold mb-4">Unmatched Receivables ({unmatchedItems.company1?.length || 0})</h3>
            <ResultTable
              data={(unmatchedItems.company1 || []).map(item => ({
                'Transaction #': item.transactionNumber,
                'Amount': formatCurrency(item.amount),
                'Date': formatDate(item.date),
                'Due Date': formatDate(item.dueDate),
                'Status': item.status
              }))}
              columns={['Transaction #', 'Amount', 'Date', 'Due Date', 'Status']}
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Unmatched Payables ({unmatchedItems.company2?.length || 0})</h3>
            <ResultTable
              data={(unmatchedItems.company2 || []).map(item => ({
                'Transaction #': item.transactionNumber,
                'Amount': formatCurrency(item.amount),
                'Date': formatDate(item.date),
                'Due Date': formatDate(item.dueDate),
                'Status': item.status
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