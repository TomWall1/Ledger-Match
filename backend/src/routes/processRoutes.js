import express from 'express';
import multer from 'multer';

const router = express.Router();

// Configure multer
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Process CSV file
router.post('/process-csv', (req, res) => {
  console.log('Process CSV route accessed');
  console.log('Headers:', req.headers);

  upload.single('file')(req, res, async (err) => {
    try {
      console.log('Multer callback');
      console.log('Body:', req.body);
      console.log('File:', req.file);
      console.log('Error:', err);

      if (err) {
        console.error('Upload error:', err);
        return res.status(400).json({ 
          error: err.message,
          code: err.code,
          field: err.field
        });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const dateFormat = req.body.dateFormat || 'YYYY-MM-DD';
      
      // Process the file content
      const fileContent = req.file.buffer.toString('utf8');
      const lines = fileContent.trim().split('\n').map(line => line.trim());

      if (lines.length < 2) {
        return res.status(400).json({ error: 'CSV must contain headers and at least one data row' });
      }

      const headers = lines[0].split(',').map(h => h.trim());
      console.log('CSV Headers:', headers);

      const results = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const values = line.split(',').map(v => v.trim());

        // Create row data object
        const rowData = {};
        headers.forEach((header, index) => {
          rowData[header] = values[index] || '';
        });

        try {
          results.push({
            transactionNumber: String(rowData.transaction_number || '').trim(),
            type: String(rowData.transaction_type || '').trim(),
            amount: cleanAmount(rowData.amount),
            date: parseDateString(rowData.issue_date, dateFormat),
            dueDate: parseDateString(rowData.due_date, dateFormat),
            status: String(rowData.status || '').trim(),
            reference: rowData.reference ? String(rowData.reference).trim() : ''
          });
        } catch (error) {
          return res.status(400).json({
            error: `Error in row ${i + 1}: ${error.message}`,
            row: rowData
          });
        }
      }

      console.log(`Successfully processed ${results.length} rows`);
      return res.json(results);

    } catch (error) {
      console.error('Processing error:', error);
      return res.status(500).json({
        error: error.message || 'Internal server error'
      });
    }
  });
});

// Helper function to clean amount values
const cleanAmount = (amountStr) => {
  if (!amountStr) return 0;
  try {
    const cleaned = amountStr.toString()
      .replace(/[$£€¥]/g, '')
      .replace(/,/g, '')
      .replace(/\s/g, '')
      .trim();
    const amount = parseFloat(cleaned);
    if (isNaN(amount)) {
      throw new Error(`Invalid amount value: ${amountStr}`);
    }
    return amount;
  } catch (error) {
    throw new Error(`Error processing amount value: ${amountStr}`);
  }
};

// Helper function to parse date strings
const parseDateString = (dateStr, format) => {
  if (!dateStr) {
    throw new Error('Date value is required');
  }

  try {
    let day, month, year;
    dateStr = dateStr.trim();
    const parts = dateStr.split(/[\/\-]/).map(part => part.trim());

    switch (format) {
      case 'DD/MM/YYYY':
        [day, month, year] = parts;
        break;
      default:
        [year, month, day] = parts;
    }

    // Ensure values are numbers
    day = parseInt(day, 10);
    month = parseInt(month, 10);
    year = parseInt(year, 10);

    if (isNaN(day) || isNaN(month) || isNaN(year)) {
      throw new Error(`Invalid date components: ${dateStr}`);
    }

    // Validate date
    const date = new Date(year, month - 1, day);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date: ${dateStr}`);
    }

    // Return standardized format
    return date.toISOString().split('T')[0];
  } catch (error) {
    throw new Error(`Error parsing date ${dateStr}: ${error.message}`);
  }
};

export default router;