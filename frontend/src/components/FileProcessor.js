// Function to process files
export const processFiles = async (files, dateFormats) => {
  // Process company 1 data (AR)
  let company1Data;
  if (files.company1.type === 'csv') {
    const formData1 = new FormData();
    formData1.append('file', files.company1.file);
    formData1.append('dateFormat', dateFormats.company1);
    
    const response1 = await fetch('https://ledger-match-backend.onrender.com/process-csv', {
      method: 'POST',
      body: formData1
    });

    if (!response1.ok) {
      throw new Error('Failed to process first CSV file');
    }
    company1Data = await response1.json();
  } else {
    company1Data = files.company1.data;
  }

  // Process company 2 data (AP)
  const formData2 = new FormData();
  formData2.append('file', files.company2.file);
  formData2.append('dateFormat', dateFormats.company2);

  const response2 = await fetch('https://ledger-match-backend.onrender.com/process-csv', {
    method: 'POST',
    body: formData2
  });

  if (!response2.ok) {
    throw new Error('Failed to process second CSV file');
  }
  const company2Data = await response2.json();

  // Perform matching
  const matchResults = await fetch('https://ledger-match-backend.onrender.com/match-data', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      company1Data,
      company2Data
    })
  });

  if (!matchResults.ok) {
    throw new Error('Failed to match data');
  }

  return await matchResults.json();
};