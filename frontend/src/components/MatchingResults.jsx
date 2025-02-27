import React, { useRef } from 'react';

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

  // Calculate difference between two amounts
  const calculateDifference = (amount1, amount2) => {
    const value1 = parseFloat(amount1) || 0;
    const value2 = parseFloat(amount2) || 0;
    // Calculate the absolute difference between the amounts
    return Math.abs(value1 - Math.abs(value2));
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

  const ResultTable = ({ title, data, columns }) => (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
      <div className="overflow-x-auto" style={{ maxHeight: '400px' }}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-[#1B365D] bg-opacity-5 sticky top-0">
            <tr>
              {columns.map((col, index) => (
                <th key={index} className="px-6 py-3 text-left text-xs font-medium text-[#1B365D] uppercase tracking-wider">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                {Object.values(row).map((value, cellIndex) => (
                  <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-[#647789]">
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

  if (!matchResults) {
    return <div>No results to display</div>;
  }

  return (
    <div className="space-y-8">
      {/* Totals Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-2 text-[#1B365D]">Accounts Receivable Total</h3>
          <p className="text-3xl font-bold text-[#00A4B4]">{formatCurrency(safeTotals.company1Total)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-2 text-[#1B365D]">Accounts Payable Total</h3>
          <p className="text-3xl font-bold text-[#00A4B4]">{formatCurrency(safeTotals.company2Total)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-2 text-[#1B365D]">Variance</h3>
          <p className={`text-3xl font-bold ${Math.abs(parseFloat(safeTotals.variance)) < 0.01 ? 'text-[#7BDCB5]' : 'text-red-500'}`}>
            {formatCurrency(safeTotals.variance)}
          </p>
        </div>
      </div>

      {/* Match Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          className="bg-white rounded-lg shadow-lg p-6 border-l-4 border border-[#7BDCB5] cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => scrollToSection(perfectMatchesRef)}
        >
          <h3 className="text-lg font-semibold text-[#1B365D]">Perfect Matches</h3>
          <p className="text-3xl font-bold text-[#7BDCB5]">{safePerfectMatches.length}</p>
          <p className="text-sm text-[#647789] mt-2">
            {formatCurrency(perfectMatchAmount)}
            <br />
            ({formatPercentage(perfectMatchAmount, totalReceivables)})
          </p>
        </div>

        <div 
          className="bg-white rounded-lg shadow-lg p-6 border-l-4 border border-yellow-400 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => scrollToSection(mismatchesRef)}
        >
          <h3 className="text-lg font-semibold text-[#1B365D]">Mismatches</h3>
          <p className="text-3xl font-bold text-yellow-500">{safeMismatches.length}</p>
          <p className="text-sm text-[#647789] mt-2">
            {formatCurrency(mismatchAmount)}
            <br />
            ({formatPercentage(mismatchAmount, totalReceivables)})
          </p>
        </div>

        <div 
          className="bg-white rounded-lg shadow-lg p-6 border-l-4 border border-red-400 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => scrollToSection(unmatchedRef)}
        >
          <h3 className="text-lg font-semibold text-[#1B365D]">Unmatched Items</h3>
          <p className="text-3xl font-bold text-red-500">
            {(safeUnmatchedItems.company1?.length || 0) + (safeUnmatchedItems.company2?.length || 0)}
          </p>
          <p className="text-sm text-[#647789] mt-2">
            {formatCurrency(unmatchedAmount)}
            <br />
            ({formatPercentage(unmatchedAmount, totalReceivables)})
          </p>
        </div>
      </div>

      {/* Perfect Matches Section */}
      <div ref={perfectMatchesRef} className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-[#1B365D]">Perfect Matches ({safePerfectMatches.length})</h2>
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
      <div ref={mismatchesRef} className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-[#1B365D]">Mismatches ({safeMismatches.length})</h2>
        </div>
        <ResultTable
          data={safeMismatches.map(mismatch => {
            const receivableAmount = mismatch?.company1?.amount || 0;
            const payableAmount = mismatch?.company2?.amount || 0;
            // Calculate difference as the absolute difference between the amounts
            const difference = Math.abs(Math.abs(receivableAmount) - Math.abs(payableAmount));
            
            return {
              'Transaction #': mismatch?.company1?.transactionNumber || mismatch?.company2?.transactionNumber || 'N/A',
              'Type': mismatch?.company1?.type || mismatch?.company2?.type || 'N/A',
              'Receivable Amount': formatCurrency(receivableAmount),
              'Payable Amount': formatCurrency(payableAmount),
              'Difference': formatCurrency(difference),
              'Date': formatDate(mismatch?.company1?.date || mismatch?.company2?.date),
              'Status': mismatch?.company1?.status || mismatch?.company2?.status || 'N/A'
            };
          })}
          columns={['Transaction #', 'Type', 'Receivable Amount', 'Payable Amount', 'Difference', 'Date', 'Status']}
        />
      </div>

      {/* Unmatched Items Section */}
      <div ref={unmatchedRef} className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-[#1B365D]">Unmatched Items</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-4 text-[#1B365D]">Unmatched Receivables ({safeUnmatchedItems.company1?.length || 0})</h3>
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
            <h3 className="text-lg font-semibold mb-4 text-[#1B365D]">Unmatched Payables ({safeUnmatchedItems.company2?.length || 0})</h3>
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