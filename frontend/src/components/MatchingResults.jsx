import React, { useRef } from 'react';
import { 
  ExportPerfectMatchesButton, 
  ExportMismatchesButton, 
  ExportUnmatchedItemsButton, 
  ExportHistoricalInsightsButton,
  ExportAllDataButton 
} from './CSVExportButtons';

const MatchingResults = ({ matchResults }) => {
  const perfectMatchesRef = useRef(null);
  const mismatchesRef = useRef(null);
  const unmatchedRef = useRef(null);
  const historicalInsightsRef = useRef(null);
  const dateMismatchesRef = useRef(null); // New ref for date mismatches section

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
      // Simple format - handle YYYY-MM-DD format (most common from backend)
      if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}/)) {
        const [year, month, day] = date.split('-');
        return `${month}/${day}/${year}`;
      }
      
      // For anything else, try the standard Date parsing
      const dateObj = new Date(date);
      if (!isNaN(dateObj.getTime())) {
        return dateObj.toLocaleDateString();
      }
      
      // If we get here, just return the original string
      return String(date);
    } catch (error) {
      // On error, at least return something meaningful
      console.error('Date formatting error:', error, 'Date value:', date);
      return String(date) || 'N/A';
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
  const safeHistoricalInsights = Array.isArray(safeMatchResults.historicalInsights) ? safeMatchResults.historicalInsights : [];
  const safeDateMismatches = Array.isArray(safeMatchResults.dateMismatches) ? safeMatchResults.dateMismatches : [];
  const safeTotals = safeMatchResults.totals || { company1Total: 0, company2Total: 0, variance: 0 };

  // Log sample data to debug date issues
  if (safeUnmatchedItems.company1 && safeUnmatchedItems.company1.length > 0) {
    console.log('Sample unmatched item:', safeUnmatchedItems.company1[0]);
  }

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

  // Helper function to get badge style based on severity
  const getInsightBadgeClass = (severity) => {
    switch (severity) {
      case 'error':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'info':
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  // Helper to check if an item has partial payment and return a badge if it does
  const getPartialPaymentBadge = (item) => {
    if (!item || !item.is_partially_paid) return null;
    
    const originalAmount = parseFloat(item.original_amount || 0);
    const amountPaid = parseFloat(item.amount_paid || 0);
    const remainingAmount = parseFloat(item.amount || 0);
    
    return (
      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        Partially Paid: {formatCurrency(amountPaid)} of {formatCurrency(originalAmount)}
      </span>
    );
  };

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
      {/* Totals Cards with Export All Data Button */}
      <div className="flex flex-col space-y-4">
        <div className="flex justify-end">
          <ExportAllDataButton 
            totals={safeTotals} 
            perfectMatches={safePerfectMatches} 
            mismatches={safeMismatches} 
            unmatchedItems={safeUnmatchedItems} 
            historicalInsights={safeHistoricalInsights}
            perfectMatchAmount={perfectMatchAmount}
            mismatchAmount={mismatchAmount}
            unmatchedAmount={unmatchedAmount}
          />
        </div>
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
      </div>

      {/* Match Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

        <div 
          className={`bg-white rounded-lg shadow-lg p-6 border-l-4 border ${safeDateMismatches.length > 0 ? 'border-purple-400 cursor-pointer hover:bg-gray-50' : 'border-gray-300'} transition-colors`}
          onClick={() => safeDateMismatches.length > 0 && scrollToSection(dateMismatchesRef)}
        >
          <h3 className="text-lg font-semibold text-[#1B365D]">Date Discrepancies</h3>
          <p className={`text-3xl font-bold ${safeDateMismatches.length > 0 ? 'text-purple-500' : 'text-gray-400'}`}>
            {safeDateMismatches.length}
          </p>
          <p className="text-sm text-[#647789] mt-2">
            {safeDateMismatches.length > 0 ? 'Date differences in matched transactions' : 'No date discrepancies found'}
          </p>
        </div>
      </div>

      {/* Perfect Matches Section */}
      <div ref={perfectMatchesRef} className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-[#1B365D]">Perfect Matches ({safePerfectMatches.length})</h2>
          {safePerfectMatches.length > 0 && (
            <ExportPerfectMatchesButton data={safePerfectMatches} />
          )}
        </div>
        <ResultTable
          data={safePerfectMatches.map(match => {
            // Check if there's partial payment info to show
            const partialPaymentBadge = match.company1?.is_partially_paid ? 
              getPartialPaymentBadge(match.company1) : 
              (match.company2?.is_partially_paid ? getPartialPaymentBadge(match.company2) : null);
              
            return {
              'Transaction #': (
                <div className="flex items-center">
                  <span>{match?.company1?.transactionNumber || match?.company2?.transactionNumber || 'N/A'}</span>
                  {partialPaymentBadge}
                </div>
              ),
              'Type': match?.company1?.type || match?.company2?.type || 'N/A',
              'Amount': formatCurrency(match?.company1?.amount || 0),
              'Date': formatDate(match?.company1?.date || match?.company2?.date),
              'Due Date': formatDate(match?.company1?.dueDate || match?.company2?.dueDate),
              'Status': match?.company1?.status || match?.company2?.status || 'N/A'
            };
          })}
          columns={['Transaction #', 'Type', 'Amount', 'Date', 'Due Date', 'Status']}
        />
      </div>

      {/* Mismatches Section */}
      <div ref={mismatchesRef} className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-[#1B365D]">Mismatches ({safeMismatches.length})</h2>
          {safeMismatches.length > 0 && (
            <ExportMismatchesButton data={safeMismatches} />
          )}
        </div>
        <ResultTable
          data={safeMismatches.map(mismatch => {
            // Extract the amounts with proper handling for null/undefined values
            const receivableAmount = Math.abs(parseFloat(mismatch?.company1?.amount || 0));
            const payableAmount = Math.abs(parseFloat(mismatch?.company2?.amount || 0));
            
            // Calculate absolute difference between absolute values of amounts
            const difference = Math.abs(receivableAmount - payableAmount);
            
            // Check for partial payment information
            const partialPaymentBadge = mismatch.company1?.is_partially_paid ? 
              getPartialPaymentBadge(mismatch.company1) : 
              (mismatch.company2?.is_partially_paid ? getPartialPaymentBadge(mismatch.company2) : null);
            
            let paymentInfo = null;
            if (mismatch.company1?.payment_date || mismatch.company2?.payment_date) {
              const paymentDate = mismatch.company1?.payment_date || mismatch.company2?.payment_date;
              paymentInfo = (
                <div>
                  <span>{formatCurrency(mismatch?.company2?.amount || 0)}</span>
                  <div className="text-xs text-green-600 mt-1">
                    {mismatch.company1?.is_partially_paid || mismatch.company2?.is_partially_paid ? 'Partial payment' : 'Payment'} 
                    on {formatDate(paymentDate)}
                  </div>
                </div>
              );
            } else {
              paymentInfo = formatCurrency(mismatch?.company2?.amount || 0);
            }
            
            return {
              'Transaction #': (
                <div className="flex items-center">
                  <span>{mismatch?.company1?.transactionNumber || mismatch?.company2?.transactionNumber || 'N/A'}</span>
                  {partialPaymentBadge}
                </div>
              ),
              'Type': mismatch?.company1?.type || mismatch?.company2?.type || 'N/A',
              'Receivable Amount': formatCurrency(mismatch?.company1?.amount || 0),
              'Payable Amount': paymentInfo,
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
          {((safeUnmatchedItems.company1?.length || 0) + (safeUnmatchedItems.company2?.length || 0)) > 0 && (
            <ExportUnmatchedItemsButton data={safeUnmatchedItems} />
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-4 text-[#1B365D]">Unmatched Receivables ({safeUnmatchedItems.company1?.length || 0})</h3>
            <ResultTable
              data={(safeUnmatchedItems.company1 || []).map(item => {
                const partialPaymentBadge = item.is_partially_paid ? getPartialPaymentBadge(item) : null;
                
                return {
                  'Transaction #': (
                    <div className="flex items-center">
                      <span>{item?.transactionNumber || 'N/A'}</span>
                      {partialPaymentBadge}
                    </div>
                  ),
                  'Amount': formatCurrency(item?.amount || 0),
                  'Date': formatDate(item?.date),
                  'Due Date': formatDate(item?.dueDate),
                  'Status': item?.status || 'N/A'
                };
              })}
              columns={['Transaction #', 'Amount', 'Date', 'Due Date', 'Status']}
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4 text-[#1B365D]">Unmatched Payables ({safeUnmatchedItems.company2?.length || 0})</h3>
            <ResultTable
              data={(safeUnmatchedItems.company2 || []).map(item => {
                const partialPaymentBadge = item.is_partially_paid ? getPartialPaymentBadge(item) : null;
                
                return {
                  'Transaction #': (
                    <div className="flex items-center">
                      <span>{item?.transactionNumber || 'N/A'}</span>
                      {partialPaymentBadge}
                    </div>
                  ),
                  'Amount': formatCurrency(item?.amount || 0),
                  'Date': formatDate(item?.date),
                  'Due Date': formatDate(item?.dueDate),
                  'Status': item?.status || 'N/A'
                };
              })}
              columns={['Transaction #', 'Amount', 'Date', 'Due Date', 'Status']}
            />
          </div>
        </div>
      </div>

      {/* Date Mismatches Section - New */}
      {safeDateMismatches.length > 0 && (
        <div ref={dateMismatchesRef} className="bg-white rounded-lg shadow-lg p-6 border border-gray-200 border-l-4 border-l-purple-400">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-[#1B365D]">
              Date Discrepancies in Matched Transactions ({safeDateMismatches.length})
            </h2>
          </div>
          <p className="mb-4 text-sm text-[#647789]">
            These transactions are matched based on transaction numbers and amounts, but have discrepancies in their dates.
          </p>
          <ResultTable
            data={safeDateMismatches.map(mismatch => {
              // Determine the type of date mismatch
              const mismatchType = mismatch.mismatchType === 'transaction_date' 
                ? 'Transaction Date' 
                : 'Due Date';
              
              return {
                'Transaction #': mismatch?.company1?.transactionNumber || mismatch?.company2?.transactionNumber || 'N/A',
                'Type': mismatch?.company1?.type || mismatch?.company2?.type || 'N/A',
                'Amount': formatCurrency(mismatch?.company1?.amount || 0),
                'Discrepancy Type': mismatchType,
                'AR Date': formatDate(mismatch.company1Date),
                'AP Date': formatDate(mismatch.company2Date),
                'Days Difference': mismatch.daysDifference || 'N/A'
              };
            })}
            columns={['Transaction #', 'Type', 'Amount', 'Discrepancy Type', 'AR Date', 'AP Date', 'Days Difference']}
          />
        </div>
      )}

      {/* Historical Insights Section */}
      {safeHistoricalInsights.length > 0 && (
        <div ref={historicalInsightsRef} className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-[#1B365D]">
              Historical Insights for AP Items ({safeHistoricalInsights.length})
            </h2>
            <ExportHistoricalInsightsButton data={safeHistoricalInsights} />
          </div>
          <div className="space-y-4">
            {safeHistoricalInsights.map((insight, index) => {
              const badgeClass = getInsightBadgeClass(insight.insight.severity);
              return (
                <div key={index} className="border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
                    <div className="space-y-2">
                      <h3 className="font-medium text-[#1B365D]">AP Item</h3>
                      <div className="text-sm">
                        <p><span className="font-medium">Transaction #:</span> {insight.apItem?.transactionNumber || 'N/A'}</p>
                        <p><span className="font-medium">Amount:</span> {formatCurrency(insight.apItem?.amount || 0)}</p>
                        <p><span className="font-medium">Date:</span> {formatDate(insight.apItem?.date)}</p>
                        <p><span className="font-medium">Status:</span> {insight.apItem?.status || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-medium text-[#1B365D]">AR Historical Match</h3>
                      <div className="text-sm">
                        <p><span className="font-medium">Transaction #:</span> {insight.historicalMatch?.transactionNumber || 'N/A'}</p>
                        <p><span className="font-medium">Original Amount:</span> {formatCurrency(insight.historicalMatch?.original_amount || 0)}</p>
                        {insight.historicalMatch?.is_partially_paid && (
                          <p>
                            <span className="font-medium">Paid Amount:</span> {formatCurrency(insight.historicalMatch?.amount_paid || 0)}
                            <span className="ml-2 text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800">
                              {((insight.historicalMatch.amount_paid / insight.historicalMatch.original_amount) * 100).toFixed(0)}% paid
                            </span>
                          </p>
                        )}
                        <p><span className="font-medium">Current Amount:</span> {formatCurrency(insight.historicalMatch?.amount || 0)}</p>
                        <p><span className="font-medium">Date:</span> {formatDate(insight.historicalMatch?.date)}</p>
                        <p><span className="font-medium">Status:</span> {insight.historicalMatch?.status || 'N/A'}</p>
                        {insight.historicalMatch?.payment_date && (
                          <p><span className="font-medium">Payment Date:</span> {formatDate(insight.historicalMatch?.payment_date)}</p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-medium text-[#1B365D]">Insight</h3>
                      <div className={`text-sm px-3 py-2 rounded-md border ${badgeClass}`}>
                        {insight.insight?.message || 'No additional insights available'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchingResults;