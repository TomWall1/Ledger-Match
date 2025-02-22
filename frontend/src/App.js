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