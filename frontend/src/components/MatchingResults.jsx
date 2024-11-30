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

  return (
    <div className="space-y-6">
      {/* Totals Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold">Company 1 Total</h3>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(totals.company1Total)}</p>
        </div>
        <div className="p-4 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold">Company 2 Total</h3>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(totals.company2Total)}</p>
        </div>
        <div className="p-4 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold">Variance</h3>
          <p className={`text-2xl font-bold ${Number(totals.variance) === 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(totals.variance)}
          </p>
        </div>
      </div>

      {/* Perfect Matches */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <h2 className="p-4 bg-gray-50 border-b font-semibold">
          Perfect Matches ({perfectMatches?.length || 0})
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {perfectMatches?.map((match, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">{match.source.transactionNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{match.source.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(match.source.amount)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatDate(match.source.date)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{match.source.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mismatches */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <h2 className="p-4 bg-gray-50 border-b font-semibold">
          Mismatches ({mismatches?.length || 0})
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company 1</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company 2</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Difference</th>
              </tr>
            </thead>
            <tbody>
              {mismatches?.map((mismatch, index) => (
                <tr key={index} className="bg-white">
                  <td className="px-6 py-4">{mismatch.source.transactionNumber}</td>
                  <td className="px-6 py-4">{mismatch.source.type}</td>
                  <td className="px-6 py-4">{formatCurrency(mismatch.source.amount)}</td>
                  <td className="px-6 py-4">{formatCurrency(mismatch.matched.amount)}</td>
                  <td className="px-6 py-4 text-red-600">
                    {formatCurrency(mismatch.source.amount - mismatch.matched.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MatchingResults;