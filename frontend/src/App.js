// ... (previous imports remain the same)

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
        const formData1 = new FormData();
        formData1.append('upload', files.company1.file); // Changed to 'upload'
        formData1.append('dateFormat', dateFormats.company1);
        
        console.log('Sending file:', files.company1.file.name);

        const response1 = await fetch('https://ledger-match-backend.onrender.com/process-csv', {
          method: 'POST',
          body: formData1
        });

        if (!response1.ok) {
          const errorData = await response1.text();
          console.error('Server error:', errorData);
          throw new Error(`Failed to process first CSV file: ${errorData}`);
        }

        company1Data = await response1.json();
      } else {
        company1Data = files.company1.data;
      }

      // Process company 2 data (AP)
      const formData2 = new FormData();
      formData2.append('upload', files.company2.file); // Changed to 'upload'
      formData2.append('dateFormat', dateFormats.company2);

      console.log('Sending file:', files.company2.file.name);

      const response2 = await fetch('https://ledger-match-backend.onrender.com/process-csv', {
        method: 'POST',
        body: formData2
      });

      if (!response2.ok) {
        const errorData = await response2.text();
        console.error('Server error:', errorData);
        throw new Error(`Failed to process second CSV file: ${errorData}`);
      }

      company2Data = await response2.json();

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
        const errorData = await matchResults.text();
        console.error('Server error:', errorData);
        throw new Error(`Failed to match data: ${errorData}`);
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