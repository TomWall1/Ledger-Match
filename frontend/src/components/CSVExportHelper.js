// CSVExportHelper.js
export const exportToCSV = (data, filename) => {
  console.log('Exporting CSV:', { data, filename }); // Debug log
  
  let csvContent = '';
  
  // Handle different data types
  switch (filename) {
    case 'perfect-matches':
      csvContent = generatePerfectMatchesCSV(data);
      filename = 'perfect-matches.csv';
      break;
    case 'mismatches':
      csvContent = generateMismatchesCSV(data);
      filename = 'mismatches.csv';
      break;
    case 'unmatched-items':
      csvContent = generateUnmatchedItemsCSV(data);
      filename = 'unmatched-items.csv';
      break;
    default:
      console.error('Unknown file type:', filename);
      return;
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (navigator.msSaveBlob) {
    navigator.msSaveBlob(blob, filename);
  } else {
    const url = window.URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
};

const generatePerfectMatchesCSV = (matches) => {
  const headers = [
    'Transaction Number',
    'Type',
    'Amount',
    'Date',
    'Due Date',
    'Status',
    'Reference'
  ].join(',') + '\n';

  const rows = matches.map(match => {
    const { source } = match;
    return [
      source.transactionNumber,
      source.type,
      source.amount,
      source.date,
      source.dueDate,
      source.status,
      source.reference || ''
    ].join(',');
  }).join('\n');

  return headers + rows;
};

const generateMismatchesCSV = (mismatches) => {
  const headers = [
    'Transaction Number',
    'AR Type',
    'AP Type',
    'AR Amount',
    'AP Amount',
    'AR Date',
    'AP Date',
    'AR Due Date',
    'AP Due Date',
    'AR Status',
    'AP Status',
    'AR Reference',
    'AP Reference'
  ].join(',') + '\n';

  const rows = mismatches.map(mismatch => {
    const { source, matched } = mismatch;
    return [
      source.transactionNumber,
      source.type,
      matched.type,
      source.amount,
      matched.amount,
      source.date,
      matched.date,
      source.dueDate,
      matched.dueDate,
      source.status,
      matched.status,
      source.reference || '',
      matched.reference || ''
    ].join(',');
  }).join('\n');

  return headers + rows;
};

const generateUnmatchedItemsCSV = (items) => {
  const headers = [
    'Ledger Type',
    'Transaction Number',
    'Type',
    'Amount',
    'Date',
    'Due Date',
    'Status',
    'Reference'
  ].join(',') + '\n';

  // Process AR and AP items
  const rows = items.map(item => [
    item.isAR ? 'Accounts Receivable' : 'Accounts Payable', // Determine ledger type based on source
    item.transactionNumber,
    item.type,
    item.amount,
    item.date,
    item.dueDate,
    item.status,
    item.reference || ''
  ].join(','));

  return headers + rows.join('\n');
};