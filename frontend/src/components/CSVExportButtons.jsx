import React from 'react';
import { generateCSV, formatCurrencyForCSV, formatDateForCSV } from '../utils/csvExport';

// Button component for CSV exports
const CSVExportButton = ({ onClick, text }) => (
  <button 
    onClick={onClick}
    className="px-4 py-2 bg-[#1B365D] text-white rounded-md text-sm font-medium hover:bg-[#2d5490] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1B365D]"
  >
    {text}
  </button>
);

// Export functions for different data types
export const ExportPerfectMatchesButton = ({ data }) => {
  const exportPerfectMatchesCSV = () => {
    const csvData = data.map(match => {
      return {
        'Transaction_Number': match?.company1?.transactionNumber || match?.company2?.transactionNumber || '',
        'Type': match?.company1?.type || match?.company2?.type || '',
        'Amount': formatCurrencyForCSV(match?.company1?.amount || 0),
        'Date': formatDateForCSV(match?.company1?.date || match?.company2?.date),
        'Due_Date': formatDateForCSV(match?.company1?.dueDate || match?.company2?.dueDate),
        'Status': match?.company1?.status || match?.company2?.status || '',
        'Is_Partially_Paid': match?.company1?.is_partially_paid || match?.company2?.is_partially_paid ? 'Yes' : 'No',
        'Original_Amount': formatCurrencyForCSV(match?.company1?.original_amount || match?.company2?.original_amount || 0),
        'Amount_Paid': formatCurrencyForCSV(match?.company1?.amount_paid || match?.company2?.amount_paid || 0)
      };
    });

    const headers = ['Transaction_Number', 'Type', 'Amount', 'Date', 'Due_Date', 'Status', 'Is_Partially_Paid', 'Original_Amount', 'Amount_Paid'];
    generateCSV(csvData, 'perfect_matches.csv', headers);
  };

  return <CSVExportButton onClick={exportPerfectMatchesCSV} text="Export to CSV" />;
};

export const ExportMismatchesButton = ({ data }) => {
  const exportMismatchesCSV = () => {
    const csvData = data.map(mismatch => {
      return {
        'Transaction_Number': mismatch?.company1?.transactionNumber || mismatch?.company2?.transactionNumber || '',
        'Type': mismatch?.company1?.type || mismatch?.company2?.type || '',
        'Receivable_Amount': formatCurrencyForCSV(mismatch?.company1?.amount || 0),
        'Payable_Amount': formatCurrencyForCSV(mismatch?.company2?.amount || 0),
        'Difference': formatCurrencyForCSV(Math.abs(parseFloat(mismatch?.company1?.amount || 0) - parseFloat(mismatch?.company2?.amount || 0))),
        'Date': formatDateForCSV(mismatch?.company1?.date || mismatch?.company2?.date),
        'Status': mismatch?.company1?.status || mismatch?.company2?.status || '',
        'Is_Partially_Paid': mismatch?.company1?.is_partially_paid || mismatch?.company2?.is_partially_paid ? 'Yes' : 'No',
        'Payment_Date': formatDateForCSV(mismatch?.company1?.payment_date || mismatch?.company2?.payment_date)
      };
    });

    const headers = ['Transaction_Number', 'Type', 'Receivable_Amount', 'Payable_Amount', 'Difference', 'Date', 'Status', 'Is_Partially_Paid', 'Payment_Date'];
    generateCSV(csvData, 'mismatches.csv', headers);
  };

  return <CSVExportButton onClick={exportMismatchesCSV} text="Export to CSV" />;
};

export const ExportUnmatchedItemsButton = ({ data }) => {
  const exportUnmatchedItemsCSV = () => {
    // Unmatched receivables data
    const receivablesData = (data.company1 || []).map(item => {
      return {
        'Type': 'Receivable',
        'Transaction_Number': item?.transactionNumber || '',
        'Amount': formatCurrencyForCSV(item?.amount || 0),
        'Date': formatDateForCSV(item?.date),
        'Due_Date': formatDateForCSV(item?.dueDate),
        'Status': item?.status || '',
        'Is_Partially_Paid': item?.is_partially_paid ? 'Yes' : 'No',
        'Original_Amount': formatCurrencyForCSV(item?.original_amount || 0),
        'Amount_Paid': formatCurrencyForCSV(item?.amount_paid || 0)
      };
    });

    // Unmatched payables data
    const payablesData = (data.company2 || []).map(item => {
      return {
        'Type': 'Payable',
        'Transaction_Number': item?.transactionNumber || '',
        'Amount': formatCurrencyForCSV(item?.amount || 0),
        'Date': formatDateForCSV(item?.date),
        'Due_Date': formatDateForCSV(item?.dueDate),
        'Status': item?.status || '',
        'Is_Partially_Paid': item?.is_partially_paid ? 'Yes' : 'No',
        'Original_Amount': formatCurrencyForCSV(item?.original_amount || 0),
        'Amount_Paid': formatCurrencyForCSV(item?.amount_paid || 0)
      };
    });

    // Combine both unmatched types
    const combinedData = [...receivablesData, ...payablesData];
    
    const headers = ['Type', 'Transaction_Number', 'Amount', 'Date', 'Due_Date', 'Status', 'Is_Partially_Paid', 'Original_Amount', 'Amount_Paid'];
    generateCSV(combinedData, 'unmatched_items.csv', headers);
  };

  return <CSVExportButton onClick={exportUnmatchedItemsCSV} text="Export to CSV" />;
};

export const ExportHistoricalInsightsButton = ({ data }) => {
  const exportHistoricalInsightsCSV = () => {
    if (data.length === 0) return;
    
    const csvData = data.map(insight => {
      return {
        'AP_Transaction_Number': insight.apItem?.transactionNumber || '',
        'AP_Amount': formatCurrencyForCSV(insight.apItem?.amount || 0),
        'AP_Date': formatDateForCSV(insight.apItem?.date),
        'AP_Status': insight.apItem?.status || '',
        'AR_Transaction_Number': insight.historicalMatch?.transactionNumber || '',
        'AR_Original_Amount': formatCurrencyForCSV(insight.historicalMatch?.original_amount || 0),
        'AR_Paid_Amount': formatCurrencyForCSV(insight.historicalMatch?.amount_paid || 0),
        'AR_Current_Amount': formatCurrencyForCSV(insight.historicalMatch?.amount || 0),
        'AR_Date': formatDateForCSV(insight.historicalMatch?.date),
        'AR_Status': insight.historicalMatch?.status || '',
        'AR_Payment_Date': formatDateForCSV(insight.historicalMatch?.payment_date),
        'Insight_Severity': insight.insight?.severity || '',
        'Insight_Message': insight.insight?.message || ''
      };
    });

    const headers = [
      'AP_Transaction_Number', 'AP_Amount', 'AP_Date', 'AP_Status',
      'AR_Transaction_Number', 'AR_Original_Amount', 'AR_Paid_Amount', 'AR_Current_Amount',
      'AR_Date', 'AR_Status', 'AR_Payment_Date', 'Insight_Severity', 'Insight_Message'
    ];
    
    generateCSV(csvData, 'historical_insights.csv', headers);
  };

  return <CSVExportButton onClick={exportHistoricalInsightsCSV} text="Export to CSV" />;
};

export const ExportAllDataButton = ({ 
  totals, 
  perfectMatches, 
  mismatches, 
  unmatchedItems, 
  historicalInsights,
  perfectMatchAmount,
  mismatchAmount,
  unmatchedAmount 
}) => {
  const exportAllDataCSV = () => {
    // Export a summary CSV
    const summaryData = [
      {
        'Category': 'Accounts Receivable Total',
        'Value': formatCurrencyForCSV(totals.company1Total)
      },
      {
        'Category': 'Accounts Payable Total',
        'Value': formatCurrencyForCSV(totals.company2Total)
      },
      {
        'Category': 'Variance',
        'Value': formatCurrencyForCSV(totals.variance)
      },
      {
        'Category': 'Perfect Matches Count',
        'Value': perfectMatches.length
      },
      {
        'Category': 'Perfect Matches Amount',
        'Value': formatCurrencyForCSV(perfectMatchAmount)
      },
      {
        'Category': 'Mismatches Count',
        'Value': mismatches.length
      },
      {
        'Category': 'Mismatches Amount',
        'Value': formatCurrencyForCSV(mismatchAmount)
      },
      {
        'Category': 'Unmatched Items Count',
        'Value': (unmatchedItems.company1?.length || 0) + (unmatchedItems.company2?.length || 0)
      },
      {
        'Category': 'Unmatched Items Amount',
        'Value': formatCurrencyForCSV(unmatchedAmount)
      },
      {
        'Category': 'Historical Insights Count',
        'Value': historicalInsights.length
      }
    ];
    
    generateCSV(summaryData, 'reconciliation_summary.csv', ['Category', 'Value']);
    
    // Export individual sections using the corresponding export functions
    const perfectMatchExport = new ExportPerfectMatchesButton({ data: perfectMatches });
    perfectMatchExport.props.onClick();
    
    const mismatchExport = new ExportMismatchesButton({ data: mismatches });
    mismatchExport.props.onClick();
    
    const unmatchedExport = new ExportUnmatchedItemsButton({ data: unmatchedItems });
    unmatchedExport.props.onClick();
    
    if (historicalInsights.length > 0) {
      const insightsExport = new ExportHistoricalInsightsButton({ data: historicalInsights });
      insightsExport.props.onClick();
    }
  };

  return <CSVExportButton onClick={exportAllDataCSV} text="Export All Data (CSV)" />;
};

export default CSVExportButton;
