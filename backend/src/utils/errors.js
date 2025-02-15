// Custom error classes
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.status = 400;
  }
}

class XeroError extends Error {
  constructor(message, originalError = null) {
    super(message);
    this.name = 'XeroError';
    this.status = 500;
    this.originalError = originalError;
  }
}

class DataProcessingError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = 'DataProcessingError';
    this.status = 500;
    this.details = details;
  }
}

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error details:', {
    name: err.name,
    message: err.message,
    stack: err.stack,
    details: err.details || err.originalError,
    path: req.path,
    method: req.method,
    query: req.query,
    body: req.body
  });

  // Clean up any uploaded files if there's an error
  if (req.files) {
    Object.values(req.files).forEach(fileArray => {
      fileArray.forEach(file => {
        try {
          fs.unlinkSync(file.path);
        } catch (e) {
          console.error('Error cleaning up file:', e);
        }
      });
    });
  }

  // Send appropriate error response
  res.status(err.status || 500).json({
    error: err.name || 'Error',
    message: err.message || 'An unexpected error occurred',
    details: process.env.NODE_ENV === 'development' ? {
      stack: err.stack,
      details: err.details || err.originalError
    } : undefined
  });
};

// Request validation middleware
const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      const { error } = schema.validate(req.body);
      if (error) {
        throw new ValidationError(error.details.map(x => x.message).join(', '));
      }
      next();
    } catch (err) {
      next(err);
    }
  };
};

// Data validation functions
const validateFile = (file) => {
  if (!file) {
    throw new ValidationError('No file provided');
  }

  if (!file.originalname.toLowerCase().endsWith('.csv')) {
    throw new ValidationError('Only CSV files are allowed');
  }

  // Add more file validations as needed
};

const validateDateFormat = (format) => {
  const validFormats = ['YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY', 'DD-MM-YYYY', 'MM-DD-YYYY'];
  if (!validFormats.includes(format)) {
    throw new ValidationError(`Invalid date format. Supported formats are: ${validFormats.join(', ')}`);
  }
};

const validateTransactionData = (data) => {
  if (!Array.isArray(data)) {
    throw new ValidationError('Invalid data format. Expected an array of transactions.');
  }

  const requiredFields = ['transactionNumber', 'type', 'amount', 'date', 'status'];
  data.forEach((transaction, index) => {
    requiredFields.forEach(field => {
      if (!transaction[field]) {
        throw new ValidationError(`Missing required field '${field}' in transaction at index ${index}`);
      }
    });

    // Validate specific fields
    if (typeof transaction.amount !== 'number') {
      throw new ValidationError(`Invalid amount in transaction ${transaction.transactionNumber}`);
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(transaction.date)) {
      throw new ValidationError(`Invalid date format in transaction ${transaction.transactionNumber}`);
    }
  });
};

export {
  ValidationError,
  XeroError,
  DataProcessingError,
  errorHandler,
  validateRequest,
  validateFile,
  validateDateFormat,
  validateTransactionData
};
