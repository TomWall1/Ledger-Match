import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';

dayjs.extend(customParseFormat);

/**
 * Match records between two datasets based on various criteria
 * @param {Array} company1Data - First company's transaction data
 * @param {Array} company2Data - Second company's transaction data
 * @param {string} dateFormat1 - Date format for first company's data
 * @param {string} dateFormat2 - Date format for second company's data
 * @returns {Object} Matching results containing perfect matches, mismatches, and unmatched items
 */
export const matchRecords = async (company1Data, company2Data, dateFormat1 = 'MM/DD/YYYY', dateFormat2 = 'MM/DD/YYYY') => {
  try {
    console.log('Starting matching process with:', {
      company1Count: company1Data.length,
      company2Count: company2Data.length,
      dateFormat1,
      dateFormat2
    });

    // Log some sample data for debugging
    console.log('Company1 sample data:', company1Data.slice(0, 2));
    console.log('Company2 sample data:', company2Data.slice(0, 2));

    // Normalize data
    const normalizedCompany1 = normalizeData(company1Data, dateFormat1);
    const normalizedCompany2 = normalizeData(company2Data, dateFormat2);

    // Log normalized data for debugging
    console.log('Normalized Company1 sample:', normalizedCompany1.slice(0, 2));
    console.log('Normalized Company2 sample:', normalizedCompany2.slice(0, 2));

    const perfectMatches = [];
    const mismatches = [];
    const unmatchedItems = {
      company1: [...normalizedCompany1],
      company2: [...normalizedCompany2]
    };

    // Calculate totals
    const company1Total = calculateTotal(normalizedCompany1);
    const company2Total = calculateTotal(normalizedCompany2);

    console.log('Company totals:', { company1Total, company2Total });

    // Find matches
    for (const item1 of normalizedCompany1) {
      const potentialMatches = findPotentialMatches(item1, normalizedCompany2);

      if (potentialMatches.length === 1) {
        const match = potentialMatches[0];
        if (isExactMatch(item1, match)) {
          perfectMatches.push({ company1: item1, company2: match });
          removeFromUnmatched(unmatchedItems, item1, match);
        } else {
          mismatches.push({ company1: item1, company2: match });
          removeFromUnmatched(unmatchedItems, item1, match);
        }
      } else if (potentialMatches.length > 1) {
        const bestMatch = findBestMatch(item1, potentialMatches);
        mismatches.push({ company1: item1, company2: bestMatch });
        removeFromUnmatched(unmatchedItems, item1, bestMatch);
      }
    }

    // Calculate variance
    const variance = calculateVariance(company1Total, company2Total);

    return {
      perfectMatches,
      mismatches,
      unmatchedItems,
      totals: {
        company1Total,
        company2Total,
        variance
      }
    };
  } catch (error) {
    console.error('Error in matchRecords:', error);
    throw new Error(`Matching error: ${error.message}`);
  }
};

// Safely convert a value to number, handling various formats
const parseAmount = (value) => {
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  
  // If already a number, return it
  if (typeof value === 'number') {
    return value;
  }
  
  // Convert string to number, handling different formats
  if (typeof value === 'string') {
    // Remove currency symbols, commas, and other non-numeric characters except for decimal point and minus sign
    const cleanValue = value.replace(/[^\d.-]/g, '');
    const numValue = parseFloat(cleanValue);
    return isNaN(numValue) ? 0 : numValue;
  }
  
  return 0;
};

const normalizeData = (data, dateFormat) => {
  return data.map(record => {
    // Debug logging to understand the input format
    console.log('Record before normalization:', {
      transactionNumber: record.transaction_number,
      amount: record.amount,
      type: record.transaction_type
    });
    
    // Normalize the data
    const normalized = {
      transactionNumber: record.transaction_number?.toString().trim(),
      type: record.transaction_type?.toString().trim(),
      amount: parseAmount(record.amount),
      date: parseDate(record.issue_date, dateFormat),
      dueDate: parseDate(record.due_date, dateFormat),
      status: record.status?.toString().trim(),
      reference: record.reference?.toString().trim()
    };
    
    // Debug logging to see the result
    console.log('Normalized record:', { 
      transactionNumber: normalized.transactionNumber,
      amount: normalized.amount,
      type: normalized.type
    });
    
    return normalized;
  });
};

const parseDate = (dateString, format) => {
  if (!dateString) return null;
  const parsed = dayjs(dateString, format);
  return parsed.isValid() ? parsed.toISOString() : null;
};

const calculateTotal = (data) => {
  return data.reduce((sum, record) => {
    const amount = record.amount || 0;
    return sum + amount;
  }, 0);
};

const calculateVariance = (total1, total2) => {
  return total1 + total2; // Since one should be negative
};

const findPotentialMatches = (item1, company2Data) => {
  return company2Data.filter(item2 => {
    // Basic case: exact transaction number match
    if (item1.transactionNumber && item2.transactionNumber && 
        item1.transactionNumber === item2.transactionNumber) {
      return true;
    }
    
    // Alternative: reference match if both have references
    if (item1.reference && item2.reference && 
        item1.reference === item2.reference) {
      return true;
    }
    
    return false;
  });
};

const isExactMatch = (item1, item2) => {
  // We must have transaction numbers or references that match
  const idMatch = (item1.transactionNumber && item2.transactionNumber && 
                  item1.transactionNumber === item2.transactionNumber) ||
                 (item1.reference && item2.reference && 
                  item1.reference === item2.reference);
  
  if (!idMatch) return false;
  
  // For financial data, one should be positive (receivable) and one negative (payable)
  // We'll check if they're similar in absolute value but opposite in sign
  const amount1 = item1.amount || 0;
  const amount2 = item2.amount || 0;
  
  // Check if the amounts are opposite (with some small tolerance for rounding)
  const amountsMatch = Math.abs(amount1 + amount2) < 0.01;
  
  return idMatch && amountsMatch;
};

const findBestMatch = (item1, potentialMatches) => {
  return potentialMatches.reduce((best, current) => {
    if (!best) return current;

    const currentMatchScore = calculateMatchScore(item1, current);
    const bestMatchScore = calculateMatchScore(item1, best);

    return currentMatchScore > bestMatchScore ? current : best;
  }, null);
};

const calculateMatchScore = (item1, item2) => {
  let score = 0;

  // Amount match (accounting for sign with tolerance)
  const amount1 = item1.amount || 0;
  const amount2 = item2.amount || 0;
  if (Math.abs(amount1 + amount2) < 0.01) score += 3;

  // Transaction number match
  if (item1.transactionNumber && item2.transactionNumber && 
      item1.transactionNumber === item2.transactionNumber) score += 2;

  // Reference match
  if (item1.reference && item2.reference && 
      item1.reference === item2.reference) score += 2;

  // Date proximity (if dates are valid)
  if (item1.date && item2.date) {
    const date1 = dayjs(item1.date);
    const date2 = dayjs(item2.date);
    const daysDiff = Math.abs(date1.diff(date2, 'day'));
    if (daysDiff === 0) score += 1;
    else if (daysDiff <= 5) score += 0.5;
  }

  return score;
};

const removeFromUnmatched = (unmatchedItems, item1, item2) => {
  unmatchedItems.company1 = unmatchedItems.company1.filter(item => 
    item.transactionNumber !== item1.transactionNumber
  );
  unmatchedItems.company2 = unmatchedItems.company2.filter(item => 
    item.transactionNumber !== item2.transactionNumber
  );
};
