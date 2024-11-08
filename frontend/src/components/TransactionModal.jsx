import React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogPortal, DialogOverlay } from '@radix-ui/react-dialog';

const TransactionModal = ({ isOpen, onClose, transaction, matchedTransaction }) => {
  if (!transaction) return null;

  // Helper function to format dates nicely
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Helper function to format amounts as currency
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Helper function to get match status
  const getMatchStatus = (value1, value2) => {
    return value1 === value2 ? 
      <span className="inline-block px-2 py-1 text-xs bg-green-500 text-white rounded">Exact Match</span> :
      <span className="inline-block px-2 py-1 text-xs bg-yellow-500 text-white rounded">Partial Match</span>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 bg-black/30" />
        <DialogContent className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] bg-white p-6 rounded-lg shadow-lg w-[90vw] max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogTitle className="text-xl font-bold mb-4">Transaction Details</DialogTitle>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Source Transaction */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">Source Transaction</h3>
              <div className="space-y-2">
                <p>Date: {formatDate(transaction.date)}</p>
                <p>Amount: {formatAmount(transaction.amount)}</p>
                <p>Type: {transaction.type}</p>
              </div>
            </div>

            {/* Matched Transaction */}
            {matchedTransaction && (
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">Matched Transaction</h3>
                <div className="space-y-2">
                  <p>
                    Date: {formatDate(matchedTransaction.date)}
                    {' '}
                    {getMatchStatus(transaction.date, matchedTransaction.date)}
                  </p>
                  <p>
                    Amount: {formatAmount(matchedTransaction.amount)}
                    {' '}
                    {getMatchStatus(transaction.amount, matchedTransaction.amount)}
                  </p>
                  <p>
                    Type: {matchedTransaction.type}
                    {' '}
                    {getMatchStatus(transaction.type, matchedTransaction.type)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Additional Fields Table */}
          <div className="mt-6">
            <h3 className="font-medium mb-2">All Fields</h3>
            <div className="border rounded-lg overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Field</th>
                    <th className="px-4 py-2 text-left">Source Value</th>
                    <th className="px-4 py-2 text-left">Matched Value</th>
                    <th className="px-4 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(transaction)
                    .filter(key => !['id', 'date', 'amount', 'type'].includes(key))
                    .map(key => (
                      <tr key={key} className="border-t">
                        <td className="px-4 py-2 capitalize">
                          {key.replace(/_/g, ' ')}
                        </td>
                        <td className="px-4 py-2">{transaction[key]}</td>
                        <td className="px-4 py-2">
                          {matchedTransaction ? matchedTransaction[key] : '-'}
                        </td>
                        <td className="px-4 py-2">
                          {matchedTransaction && getMatchStatus(
                            transaction[key],
                            matchedTransaction[key]
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="mt-6 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Close
          </button>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
};

export default TransactionModal;