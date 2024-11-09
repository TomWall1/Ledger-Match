// CSVExportHelper.js
export const exportToCSV = (data, type) => {
  if (!data || data.length === 0) return;

  let csvContent = '';
  let filename = '';

  switch (type) {
    case 'perfect':
      filename = 'perfect-matches.csv';
      csvContent = generatePerfectMatchesCSV(data);
      break;
    case 'mismatches':
      filename = 'mismatches.csv';
      csvContent = generateMismatchesCSV(data);
      break;
    case 'unmatched':
      filename = 'unmatched-items.csv';
      csvContent = generateUnmatchedItemsCSV(data);
      break;
    default:
      return;
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (navigator.msSaveBlob) {
    navigator.msSaveBlob(blob, filename);
  } else {
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      source.reference
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
      source.reference,
      matched.reference
    ].join(',');
  }).join('\n');

  return headers + rows;
};

const generateUnmatchedItemsCSV = (unmatchedData) => {
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

  // Process AR (Company1) unmatched items
  const arRows = unmatchedData.company1.map(item => [
    'Accounts Receivable',  // Add ledger identifier
    item.transactionNumber,
    item.type,
    item.amount,
    item.date,
    item.dueDate,
    item.status,
    item.reference
  ].join(','));

  // Process AP (Company2) unmatched items
  const apRows = unmatchedData.company2.map(item => [
    'Accounts Payable',  // Add ledger identifier
    item.transactionNumber,
    item.type,
    item.amount,
    item.date,
    item.dueDate,
    item.status,
    item.reference
  ].join(','));

  // Combine all rows
  const allRows = [...arRows, ...apRows].join('\n');

  return headers + allRows;
};