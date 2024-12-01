export const convertToCSV = (data, headers) => {
    if (!data || data.length === 0) return '';
    
    const csvRows = [];
    
    // Add headers
    csvRows.push(headers.map(header => header.label).join(','));
    
    // Add data rows
    data.forEach(item => {
      const values = headers.map(header => {
        const value = item[header.key];
        // Handle nulls and undefined
        if (value === null || value === undefined) return '';
        // Format dates
        if (header.key.includes('date') && value) {
          return new Date(value).toLocaleDateString();
        }
        // Format numbers/currency
        if (typeof value === 'number') {
          return value.toString();
        }
        // Wrap strings with commas in quotes
        const stringValue = String(value);
        return stringValue.includes(',') ? `"${stringValue}"` : stringValue;
      });
      csvRows.push(values.join(','));
    });
    
    return csvRows.join('\n');
  };
  
  export const downloadCSV = (csvContent, fileName) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  export const prepareExportData = (matchResults) => {
    const { perfectMatches, mismatches, unmatchedItems } = matchResults;
    
    // Prepare perfect matches
    const perfectMatchesData = perfectMatches.map(match => ({
      transactionNumber: match.source.transactionNumber,
      type: match.source.type,
      amount: match.source.amount,
      date: match.source.date,
      dueDate: match.source.dueDate,
      status: match.source.status,
      reference: match.source.reference,
      matchType: 'Perfect Match'
    }));
  
    // Prepare mismatches
    const mismatchesData = mismatches.map(mismatch => ({
      transactionNumber: mismatch.source.transactionNumber,
      type: mismatch.source.type,
      receivableAmount: mismatch.source.amount,
      payableAmount: mismatch.matched.amount,
      difference: mismatch.source.amount - mismatch.matched.amount,
      date: mismatch.source.date,
      dueDate: mismatch.source.dueDate,
      status: mismatch.source.status,
      reference: mismatch.source.reference,
      matchType: 'Mismatch'
    }));
  
    // Prepare unmatched items
    const unmatchedReceivables = (unmatchedItems.company1 || []).map(item => ({
      transactionNumber: item.transactionNumber,
      type: item.type,
      amount: item.amount,
      date: item.date,
      dueDate: item.dueDate,
      status: item.status,
      reference: item.reference,
      matchType: 'Unmatched Receivable'
    }));
  
    const unmatchedPayables = (unmatchedItems.company2 || []).map(item => ({
      transactionNumber: item.transactionNumber,
      type: item.type,
      amount: item.amount,
      date: item.date,
      dueDate: item.dueDate,
      status: item.status,
      reference: item.reference,
      matchType: 'Unmatched Payable'
    }));
  
    // Combine all data for full export option
    const allData = [
      ...perfectMatchesData,
      ...mismatchesData,
      ...unmatchedReceivables,
      ...unmatchedPayables
    ];
  
    return {
      perfectMatchesData,
      mismatchesData,
      unmatchedReceivables,
      unmatchedPayables,
      allData
    };
  };