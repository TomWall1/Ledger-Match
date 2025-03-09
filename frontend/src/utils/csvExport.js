// Utility functions for CSV export

// Format for CSV (without currency symbols for easier data manipulation)
export const formatCurrencyForCSV = (amount) => {
  if (amount === null || amount === undefined) return '';
  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount)) return '';
  return numericAmount.toFixed(2);
};

// Format date for CSV in DD/MM/YYYY format
export const formatDateForCSV = (date) => {
  if (!date) return '';
  try {
    // If already in ISO format (YYYY-MM-DD), convert to DD/MM/YYYY
    if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}/)) {
      const [year, month, day] = date.split('T')[0].split('-');
      return `${day}/${month}/${year}`;
    }
    
    // Otherwise try to parse with the Date object
    const d = new Date(date);
    if (!isNaN(d.getTime())) {
      // Format as DD/MM/YYYY
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
    return '';
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
