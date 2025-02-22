                'Due Date': formatDate(item.dueDate),
                'Status': item.status
              }))}
              columns={['Transaction #', 'Amount', 'Date', 'Due Date', 'Status']}
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Unmatched Payables ({unmatchedItems.company2?.length || 0})</h3>
            <ResultTable
              data={(unmatchedItems.company2 || []).map(item => ({
                'Transaction #': item.transactionNumber,
                'Amount': formatCurrency(item.amount),
                'Date': formatDate(item.date),
                'Due Date': formatDate(item.dueDate),
                'Status': item.status
              }))}
              columns={['Transaction #', 'Amount', 'Date', 'Due Date', 'Status']}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchingResults;