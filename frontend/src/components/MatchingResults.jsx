, 'Difference', 'Date', 'Status']}
        />
      </div>

      {/* Unmatched Items Section */}
      <div ref={unmatchedRef} className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-primary-navy">Unmatched Items</h2>
          <button
            onClick={() => handleExport('unmatched')}
            className="px-4 py-2 bg-red-400 text-white rounded-lg hover:bg-red-500 transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            Export CSV
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-4 text-primary-navy">Unmatched Receivables ({safeUnmatchedItems.company1?.length || 0})</h3>
            <ResultTable
              data={(safeUnmatchedItems.company1 || []).map(item => ({
                'Transaction #': item?.transactionNumber || 'N/A',
                'Amount': formatCurrency(item?.amount || 0),
                'Date': formatDate(item?.date),
                'Due Date': formatDate(item?.dueDate),
                'Status': item?.status || 'N/A'
              }))}
              columns={['Transaction #', 'Amount', 'Date', 'Due Date', 'Status']}
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4 text-primary-navy">Unmatched Payables ({safeUnmatchedItems.company2?.length || 0})</h3>
            <ResultTable
              data={(safeUnmatchedItems.company2 || []).map(item => ({
                'Transaction #': item?.transactionNumber || 'N/A',
                'Amount': formatCurrency(item?.amount || 0),
                'Date': formatDate(item?.date),
                'Due Date': formatDate(item?.dueDate),
                'Status': item?.status || 'N/A'
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