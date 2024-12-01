// frontend/src/utils/CSVExportHelper.js
export const convertToCSV = (data, headers) => {
    const csvRows = [];
    // Add headers
    csvRows.push(headers.join(','));
    
    // Add data rows
    data.forEach(item => {
      const values = headers.map(header => {
        const value = item[header.key] || '';
        // Wrap value in quotes if it contains comma or is numeric
        const stringValue = typeof value === 'number' ? value.toString() : value;
        return stringValue.includes(',') ? `"${stringValue}"` : stringValue;
      });
      csvRows.push(values.join(','));
    });
    
    return csvRows.join('\n');
  };
  
  export const downloadCSV = (csvContent, fileName) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('link');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  export const prepareExportData = (matchResults) => {
    const { perfectMatches, mismatches, unmatchedItems } = matchResults;
    
    // Prepare perfect matches
    const perfectMatchesData = perfectMatches.map(match => ({
      ...match.source,
      matchType: 'Perfect Match'
    }));
  
    // Prepare mismatches
    const mismatchesData = mismatches.map(mismatch => ({
      ...mismatch.source,
      matchedAmount: mismatch.matched.amount,
      difference: mismatch.source.amount - mismatch.matched.amount,
      matchType: 'Mismatch'
    }));
  
    // Prepare unmatched items
    const unmatchedReceivables = unmatchedItems.company1.map(item => ({
      ...item,
      matchType: 'Unmatched Receivable'
    }));
    
    const unmatchedPayables = unmatchedItems.company2.map(item => ({
      ...item,
      matchType: 'Unmatched Payable'
    }));
  
    return {
      perfectMatchesData,
      mismatchesData,
      unmatchedReceivables,
      unmatchedPayables,
      allData: [
        ...perfectMatchesData,
        ...mismatchesData,
        ...unmatchedReceivables,
        ...unmatchedPayables
      ]
    };
  };