/**
 * Utility functions for exporting data to CSV
 */

/**
 * Convert data to CSV format
 * @param {Array} data - Array of objects to convert to CSV
 * @param {Array} headers - Array of header objects with 'key' and 'label' properties
 * @returns {string} CSV content as a string
 */
export const convertToCSV = (data, headers) => {
  if (!data || !data.length) return '';

  // Create the header row
  const headerRow = headers.map(header => `"${header.label}"`).join(',');
  
  // Create data rows
  const rows = data.map(item => {
    return headers.map(header => {
      // Extract the value using the header key
      const value = item[header.key];
      
      // Handle different value types
      if (value === null || value === undefined) {
        return '""';
      } else if (typeof value === 'string') {
        // Escape quotes in strings
        return `"${value.replace(/"/g, '""')}"`;
      } else if (typeof value === 'number') {
        return value;
      } else if (typeof value === 'boolean') {
        return value ? '"Yes"' : '"No"';
      } else if (value instanceof Date) {
        return `"${value.toLocaleDateString()}"`;
      } else {
        // For nested objects or arrays, stringify them
        return `"${String(value).replace(/"/g, '""')}"`;
      }
    }).join(',');
  }).join('\n');
  
  // Combine header and rows
  return `${headerRow}\n${rows}`;
};

/**
 * Download data as a CSV file
 * @param {string} csvContent - CSV content as a string
 * @param {string} fileName - Name of the file to download
 */
export const downloadCSV = (csvContent, fileName) => {
  // Create a blob with the CSV content
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Create a temporary link element to trigger the download
  const link = document.createElement('a');
  
  // Create a URL for the blob
  const url = URL.createObjectURL(blob);
  
  // Set the link properties
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.display = 'none';
  
  // Add the link to the document
  document.body.appendChild(link);
  
  // Click the link to trigger the download
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Prepare data from perfect matches for CSV export
 * @param {Array} matches - Array of perfect match objects
 * @returns {Array} Flattened array of objects for CSV export
 */
export const preparePerfectMatchesForExport = (matches) => {
  if (!matches || !matches.length) return [];
  
  return matches.map(match => ({
    transactionNumber: match.company1?.transactionNumber || match.company2?.transactionNumber || '',
    type: match.company1?.type || match.company2?.type || '',
    amount: match.company1?.amount || 0,
    date: match.company1?.date ? new Date(match.company1.date).toISOString().split('T')[0] : 
          (match.company2?.date ? new Date(match.company2.date).toISOString().split('T')[0] : ''),
    dueDate: match.company1?.dueDate ? new Date(match.company1.dueDate).toISOString().split('T')[0] : 
             (match.company2?.dueDate ? new Date(match.company2.dueDate).toISOString().split('T')[0] : ''),
    status: match.company1?.status || match.company2?.status || '',
    partiallyPaid: match.company1?.is_partially_paid || match.company2?.is_partially_paid || false,
    amountPaid: (match.company1?.is_partially_paid || match.company2?.is_partially_paid) ? 
                 (match.company1?.amount_paid || match.company2?.amount_paid || 0) : 0,
    originalAmount: (match.company1?.is_partially_paid || match.company2?.is_partially_paid) ? 
                   (match.company1?.original_amount || match.company2?.original_amount || 0) : 
                   (match.company1?.amount || match.company2?.amount || 0)
  }));
};

/**
 * Prepare data from mismatches for CSV export
 * @param {Array} mismatches - Array of mismatch objects
 * @returns {Array} Flattened array of objects for CSV export
 */
export const prepareMismatchesForExport = (mismatches) => {
  if (!mismatches || !mismatches.length) return [];
  
  return mismatches.map(mismatch => {
    const receivableAmount = Math.abs(parseFloat(mismatch?.company1?.amount || 0));
    const payableAmount = Math.abs(parseFloat(mismatch?.company2?.amount || 0));
    const difference = Math.abs(receivableAmount - payableAmount);
    
    return {
      transactionNumber: mismatch.company1?.transactionNumber || mismatch.company2?.transactionNumber || '',
      type: mismatch.company1?.type || mismatch.company2?.type || '',
      receivableAmount: mismatch.company1?.amount || 0,
      payableAmount: mismatch.company2?.amount || 0,
      difference: difference,
      date: mismatch.company1?.date ? new Date(mismatch.company1.date).toISOString().split('T')[0] : 
            (mismatch.company2?.date ? new Date(mismatch.company2.date).toISOString().split('T')[0] : ''),
      status: mismatch.company1?.status || mismatch.company2?.status || '',
      partiallyPaid: mismatch.company1?.is_partially_paid || mismatch.company2?.is_partially_paid || false,
      paymentDate: (mismatch.company1?.payment_date || mismatch.company2?.payment_date) ? 
                    (new Date(mismatch.company1?.payment_date || mismatch.company2?.payment_date).toISOString().split('T')[0]) : ''
    };
  });
};

/**
 * Prepare unmatched items for CSV export
 * @param {Object} unmatchedItems - Object containing unmatchedItems.company1 and unmatchedItems.company2 arrays
 * @returns {Object} Object with company1 and company2 arrays prepared for export
 */
export const prepareUnmatchedItemsForExport = (unmatchedItems) => {
  const company1Data = (unmatchedItems?.company1 || []).map(item => ({
    transactionNumber: item.transactionNumber || '',
    type: item.type || '',
    amount: item.amount || 0,
    date: item.date ? new Date(item.date).toISOString().split('T')[0] : '',
    dueDate: item.dueDate ? new Date(item.dueDate).toISOString().split('T')[0] : '',
    status: item.status || '',
    partiallyPaid: item.is_partially_paid || false,
    amountPaid: item.amount_paid || 0,
    originalAmount: item.original_amount || item.amount || 0
  }));
  
  const company2Data = (unmatchedItems?.company2 || []).map(item => ({
    transactionNumber: item.transactionNumber || '',
    type: item.type || '',
    amount: item.amount || 0,
    date: item.date ? new Date(item.date).toISOString().split('T')[0] : '',
    dueDate: item.dueDate ? new Date(item.dueDate).toISOString().split('T')[0] : '',
    status: item.status || '',
    partiallyPaid: item.is_partially_paid || false,
    amountPaid: item.amount_paid || 0,
    originalAmount: item.original_amount || item.amount || 0
  }));
  
  return { company1: company1Data, company2: company2Data };
};

/**
 * Prepare historical insights for CSV export
 * @param {Array} insights - Array of historical insight objects
 * @returns {Array} Flattened array of objects for CSV export
 */
export const prepareHistoricalInsightsForExport = (insights) => {
  if (!insights || !insights.length) return [];
  
  return insights.map(insight => ({
    apTransactionNumber: insight.apItem?.transactionNumber || '',
    apAmount: insight.apItem?.amount || 0,
    apDate: insight.apItem?.date ? new Date(insight.apItem.date).toISOString().split('T')[0] : '',
    apStatus: insight.apItem?.status || '',
    arTransactionNumber: insight.historicalMatch?.transactionNumber || '',
    arOriginalAmount: insight.historicalMatch?.original_amount || 0,
    arCurrentAmount: insight.historicalMatch?.amount || 0,
    arAmountPaid: insight.historicalMatch?.amount_paid || 0,
    arDate: insight.historicalMatch?.date ? new Date(insight.historicalMatch.date).toISOString().split('T')[0] : '',
    arStatus: insight.historicalMatch?.status || '',
    arPaymentDate: insight.historicalMatch?.payment_date ? 
                new Date(insight.historicalMatch.payment_date).toISOString().split('T')[0] : '',
    insightType: insight.insight?.type || '',
    insightMessage: insight.insight?.message || '',
    insightSeverity: insight.insight?.severity || ''
  }));
};
