// CSV Export Functions for MatchingResults.jsx

// Format for CSV (without currency symbols for easier data manipulation)
export const formatCurrencyForCSV = (amount) => {
  if (amount === null || amount === undefined) return '';
  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount)) return '';
  return numericAmount.toFixed(2);
};

// Format date for CSV in a standardized format
export const formatDateForCSV = (date) => {
  if (!date) return '';
  try {
    const d = new Date(date);
    return d.toISOString().split('T')[0]; // YYYY-MM-DD format
  } catch (error) {
    console.error('Date formatting error for CSV:', error);
    return '';
  }
};

// Helper function to convert text to CSV-safe format
export const escapeCSV = (text) => {
  if (text === null || text === undefined) return '';
  const stringText = String(text);
  // If the text contains commas, quotes, or newlines, wrap it in quotes and escape internal quotes
  if (stringText.includes(',') || stringText.includes('"') || stringText.includes('\n')) {
    return '"' + stringText.replace(/"/g, '""') + '"';
  }
  return stringText;
};

// Function to generate CSV file and trigger download
export const generateCSV = (data, filename, headers) => {
  // Create header row
  let csvContent = headers.map(escapeCSV).join(',') + '\n';
  
  // Add data rows
  data.forEach(row => {
    const rowValues = Object.values(row).map(escapeCSV).join(',');
    csvContent += rowValues + '\n';
  });
  
  // Create a Blob and download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};