// In the processFile function:
  const processFile = async (file, dateFormat) => {
    const formData = new FormData();
    formData.append('file', file);
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
      const responseData = await response.json();
      console.error('Server error:', responseData);
      throw new Error(`Failed to process CSV file: ${JSON.stringify(responseData)}`);
    }

    return response.json();
  };

  const handleProcessFiles = async () => {
    if (!files.company1 || !files.company2) {
      setError('Please provide both sets of data before proceeding');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let company1Data, company2Data;

      // Process company 1 data (AR)
      if (files.company1.type === 'csv') {
        company1Data = await processFile(files.company1.file, dateFormats.company1);
      } else {
        company1Data = files.company1.data;
      }

      // Process company 2 data (AP)
      company2Data = await processFile(files.company2.file, dateFormats.company2);

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
        const errorData = await matchResults.json();
        console.error('Match error:', errorData);
        throw new Error(`Failed to match data: ${JSON.stringify(errorData)}`);
      }

      const results = await matchResults.json();
      setMatches(results);
      setCurrentScreen('results');
    } catch (error) {
      console.error('Error processing files:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };