// src/components/CSVExportHelper.js
export const exportToCSV = (data, filename) => {
  // Define headers based on your data structure
  const headers = [
    'Transaction Number',
    'Type',
    'Amount',
    'Date',
    'Status',
    'Reference',
    'Matched Transaction Number',
    'Matched Type',
    'Matched Amount',
    'Matched Date',
    'Matched Status',
    'Matched Reference',
    'Differences'
  ];

  // Format data rows
  const formatRow = (source, matched, differences = null) => {
    const row = [
      source.transactionNumber,
      source.type,
      source.amount,
      source.date,
      source.status,
      source.reference,
      matched ? matched.transactionNumber : '',
      matched ? matched.type : '',
      matched ? matched.amount : '',
      matched ? matched.date : '',
      matched ? matched.status : '',
      matched ? matched.reference : '',
      differences ? Object.entries(differences)
        .filter(([_, isDifferent]) => isDifferent)
        .map(([field]) => field)
        .join('; ') : ''
    ];
    // Escape any commas in the values
    return row.map(value => `"${value}"`).join(',');
  };

  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...data.map(item => {
      if (item.matched) {
        return formatRow(item.source, item.matched, item.differences);
      } else {
        return formatRow(item, null);
      }
    })
  ].join('\n');

  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};