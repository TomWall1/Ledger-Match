import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';

dayjs.extend(customParseFormat);

/**
 * Match records between two datasets based on various criteria
 * @param {Array} company1Data - First company's transaction data
 * @param {Array} company2Data - Second company's transaction data
 * @param {string} dateFormat1 - Date format for first company's data
 * @param {string} dateFormat2 - Date format for second company's data
 * @param {Array} historicalData - Optional historical AR data to check paid status
 * @returns {Object} Matching results containing perfect matches, mismatches, unmatched items, and historical insights
 */
export const matchRecords = async (company1Data, company2Data, dateFormat1 = 'MM/DD/YYYY', dateFormat2 = 'MM/DD/YYYY', historicalData = []) => {
  try {
    console.log('Starting matching process with:', {
      company1Count: company1Data.length,
      company2Count: company2Data.length,
      historicalCount: historicalData.length,
      dateFormat1,
      dateFormat2
    });

    // Log some sample data for debugging
    console.log('Company1 sample data:', company1Data.slice(0, 2));
    console.log('Company2 sample data:', company2Data.slice(0, 2));
    if (historicalData.length > 0) {
      console.log('Historical sample data:', historicalData.slice(0, 2));
    }

    // Normalize data
    const normalizedCompany1 = normalizeData(company1Data, dateFormat1);
    const normalizedCompany2 = normalizeData(company2Data, dateFormat2);
    
    // Normalize historical data if provided
    const normalizedHistorical = historicalData.length > 0 ? 
      normalizeData(historicalData, dateFormat1) : [];

    // Log normalized data for debugging
    console.log('Normalized Company1 sample:', normalizedCompany1.slice(0, 2));
    console.log('Normalized Company2 sample:', normalizedCompany2.slice(0, 2));

    const perfectMatches = [];
    const mismatches = [];
    const unmatchedItems = {
      company1: [...normalizedCompany1],
      company2: [...normalizedCompany2]
    };
    
    // New array to track historical insights for unmatched AP items
    const historicalInsights = [];

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
    
    // After regular matching, check for historical insights for unmatched AP items
    if (normalizedHistorical.length > 0) {
      for (const apItem of unmatchedItems.company2) {
        // Look for matching transaction numbers or references in historical data
        const historicalMatches = findHistoricalMatches(apItem, normalizedHistorical);
        
        if (historicalMatches.length > 0) {
          // Sort matches by relevance (paid status prioritized, then by date)
          const sortedMatches = historicalMatches.sort((a, b) => {
            // Prioritize paid items
            if (a.is_paid && !b.is_paid) return -1;
            if (!a.is_paid && b.is_paid) return 1;
            
            // Then sort by date (most recent first)
            if (a.date && b.date) {
              return dayjs(b.date).diff(dayjs(a.date));
            }
            return 0;
          });
          
          // Take the best historical match
          const bestHistoricalMatch = sortedMatches[0];
          
          historicalInsights.push({
            apItem: apItem,
            historicalMatch: bestHistoricalMatch,
            insight: determineHistoricalInsight(apItem, bestHistoricalMatch)
          });
        }
      }
    }

    // Calculate variance - the absolute difference between totals
    const variance = calculateVariance(company1Total, company2Total);

    return {
      perfectMatches,
      mismatches,
      unmatchedItems,
      historicalInsights,
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

/**
 * Find matches for AP items in historical AR data
 * @param {Object} apItem - AP item to find matches for
 * @param {Array} historicalData - Historical AR data
 * @returns {Array} Matching historical items
 */
const findHistoricalMatches = (apItem, historicalData) => {
  return historicalData.filter(histItem => {
    // Match transaction number
    if (apItem.transactionNumber && histItem.transactionNumber && 
        apItem.transactionNumber === histItem.transactionNumber) {
      return true;
    }
    
    // Match reference
    if (apItem.reference && histItem.reference && 
        apItem.reference === histItem.reference) {
      return true;
    }
    
    return false;
  });
};

/**
 * Determine insight about historical match
 * @param {Object} apItem - AP item 
 * @param {Object} historicalItem - Matching historical AR item
 * @returns {Object} Insight about the historical match
 */
const determineHistoricalInsight = (apItem, historicalItem) => {
  const insight = {
    type: '',
    message: '',
    severity: 'info' // 'info', 'warning', or 'error'
  };
  
  if (historicalItem.is_paid) {
    insight.type = 'already_paid';
    insight.message = `Invoice ${apItem.transactionNumber} appears to have been paid on ${dayjs(historicalItem.payment_date).format('MMM D, YYYY')}`;
    insight.severity = 'warning';
  } else if (historicalItem.is_voided) {
    insight.type = 'voided';
    insight.message = `Invoice ${apItem.transactionNumber} was voided in the AR system`;
    insight.severity = 'error';
  } else if (historicalItem.status === 'DRAFT') {
    insight.type = 'draft';
    insight.message = `Invoice ${apItem.transactionNumber} exists as a draft in the AR system`;
    insight.severity = 'info';
  } else {
    insight.type = 'found_in_history';
    insight.message = `Invoice ${apItem.transactionNumber} found in AR history with status: ${historicalItem.status}`;
    insight.severity = 'info';
  }
  
  return insight;
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
      reference: record.reference?.toString().trim(),
      // Add historical data fields if they exist
      payment_date: record.payment_date ? parseDate(record.payment_date, dateFormat) : null,
      is_paid: record.is_paid || record.status === 'PAID',
      is_voided: record.is_voided || record.status === 'VOIDED'
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
  // Calculate the absolute difference between the two totals
  return Math.abs(total1 - Math.abs(total2));
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
  const amountsMatch = Math.abs(Math.abs(amount1) - Math.abs(amount2)) < 0.01;
  
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
  const amount1 = Math.abs(item1.amount || 0);
  const amount2 = Math.abs(item2.amount || 0);
  if (Math.abs(amount1 - amount2) < 0.01) score += 3;

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
