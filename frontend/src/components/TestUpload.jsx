import React, { useState } from 'react';

export function TestUpload() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData(e.target);
      
      console.log('Submitting form data:', {
        hasFile: formData.has('file'),
        fileName: formData.get('file')?.name,
        dateFormat: formData.get('dateFormat')
      });

      const response = await fetch('https://ledger-match-backend.onrender.com/test/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
      setError(null);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message);
      setResult(null);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Test File Upload</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-2">CSV File:</label>
          <input type="file" name="file" accept=".csv" className="block" />
        </div>
        
        <div>
          <label className="block mb-2">Date Format:</label>
          <input type="text" name="dateFormat" defaultValue="DD/MM/YYYY" className="border p-2" />
        </div>
        
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Upload Test File
        </button>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      {result && (
        <div className="mt-4 p-4 bg-green-100 text-green-700 rounded">
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
