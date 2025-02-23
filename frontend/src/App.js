                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                    Match Records
                  </>
                )}
              </button>
            </div>

            <div className="bg-[#1B365D] bg-opacity-5 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-3 text-[#1B365D]">
                Data Requirements
              </h2>
              <div>
                <h3 className="font-medium text-[#1B365D] mb-2">Required Fields:</h3>
                <ul className="list-disc list-inside space-y-1 text-[#647789]">
                  <li>transaction_number</li>
                  <li>transaction_type</li>
                  <li>amount (decimal number)</li>
                  <li>issue_date</li>
                  <li>due_date</li>
                  <li>status</li>
                  <li>reference</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-[#1B365D]">Matching Results</h1>
              <button
                onClick={() => {
                  setCurrentScreen('upload');
                  setFiles({ company1: null, company2: null });
                }}
                className="px-4 py-2 bg-[#00A4B4] text-white rounded-lg hover:bg-[#008999] transition-colors flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back to Import
              </button>
            </div>
            <MatchingResults matchResults={matches} />
          </>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/auth/xero" element={<XeroAuth />} />
        <Route path="/auth/xero/callback" element={<XeroCallback />} />
        <Route path="/*" element={<MainApp />} />
      </Routes>
    </Router>
  );
}

export default App;