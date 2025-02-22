_date (select format above)</li>
                  <li>due_date (select format above)</li>
                  <li>status</li>
                  <li>reference</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-primary-navy">Matching Results</h1>
              <button
                onClick={() => {
                  setCurrentScreen('upload');
                  setFiles({ company1: null, company2: null });
                }}
                className="px-4 py-2 bg-primary-teal text-white rounded-lg hover:bg-teal-600 transition-colors flex items-center"
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
        <Route path="/test" element={<TestUpload />} />
        <Route path="/*" element={<MainApp />} />
      </Routes>
    </Router>
  );
}

export default App;