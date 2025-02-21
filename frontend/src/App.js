const processFile = async (file, dateFormat) => {
    // Create form data
    const formData = new FormData();
    formData.append('csvFile', file);
    formData.append('dateFormat', dateFormat);

    console.log('Sending file:', {
      name: file.name,
      size: file.size,
      type: file.type,
      dateFormat: dateFormat
    });

    const response = await fetch('https://ledger-match-backend.onrender.com/process-csv', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = await response.text();
      }
      console.error('Server error:', errorData);
      throw new Error(`Failed to process CSV file: ${JSON.stringify(errorData)}`);
    }

    return await response.json();
  };