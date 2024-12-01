import React from 'react';

const MatchingResults = ({ matchResults }) => {
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

  if (!matchResults) {
    return <div>No results to display</div>;
  }

  const { totals, perfectMatches, mismatches, unmatchedItems } = matchResults;

  const ResultTable = ({ title, data, columns, maxHeight = '400px' }) => (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
      </div>
      <div className="overflow-auto" style={{ maxHeight }}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              {columns.map((column, index) => (
                <th key={index} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                {Object.keys(item).map((key, cellIndex) => (
                  <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {key.includes('amount') ? formatCurrency(item[key]) :
                     key.includes('date') ? formatDate(item[key]) :
                     item[key]}
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
      {/* Summary Cards */}
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
        <div className="bg-green-50 rounded-lg shadow p-6 border border-green-200">
          <h3 className="text-lg font-semibold text-green-800">Perfect Matches</h3>
          <p className="text-3xl font-bold text-green-600">{perfectMatches.length}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow p-6 border border-yellow-200">
          <h3 className="text-lg font-semibold text-yellow-800">Mismatches</h3>
          <p className="text-3xl font-bold text-yellow-600">{mismatches.length}</p>
        </div>
        <div className="bg-red-50 rounded-lg shadow p-6 border border-red-200">
          <h3 className="text-lg font-semibold text-red-800">Unmatched Items</h3>
          <p className="text-3xl font-bold text-red-600">
            {(unmatchedItems.company1?.length || 0) + (unmatchedItems.company2?.length || 0)}
          </p>
        </div>
      </div>

      {/* Perfect Matches */}
      <ResultTable
        title={`Perfect Matches (${perfectMatches.length})`}
        data={perfectMatches.map(match => ({
          transactionNumber: match.source.transactionNumber,
          type: match.source.type,
          amount: match.source.amount,
          date: match.source.date,
          status: match.source.status
        }))}
        columns={['Transaction #', 'Type', 'Amount', 'Date', 'Status']}
      />

      {/* Mismatches */}
      <ResultTable
        title={`Mismatches (${mismatches.length})`}
        data={mismatches.map(mismatch => ({
          transactionNumber: mismatch.source.transactionNumber,
          type: mismatch.source.type,
          receivableAmount: mismatch.source.amount,
          payableAmount: mismatch.matched.amount,
          difference: mismatch.source.amount - mismatch.matched.amount
        }))}
        columns={['Transaction #', 'Type', 'Receivable Amount', 'Payable Amount', 'Difference']}
      />

      {/* Unmatched Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ResultTable
          title={`Unmatched Receivables (${unmatchedItems.company1?.length || 0})`}
          data={(unmatchedItems.company1 || []).map(item => ({
            transactionNumber: item.transactionNumber,
            amount: item.amount,
            date: item.date,
            status: item.status
          }))}
          columns={['Transaction #', 'Amount', 'Date', 'Status']}
          maxHeight="300px"
        />
        
        <ResultTable
          title={`Unmatched Payables (${unmatchedItems.company2?.length || 0})`}
          data={(unmatchedItems.company2 || []).map(item => ({
            transactionNumber: item.transactionNumber,
            amount: item.amount,
            date: item.date,
            status: item.status
          }))}
          columns={['Transaction #', 'Amount', 'Date', 'Status']}
          maxHeight="300px"
        />
      </div>
    </div>
  );
};

export default MatchingResults;