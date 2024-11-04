# Ledger-Match

A system that helps companies compare and reconcile their accounts receivable and payable ledgers, identifying discrepancies and mismatches automatically.

## Features

- Upload AR/AP ledger data via CSV
- Configure matching rules and tolerances
- Automatically identify:
  - Missing invoices and credit notes
  - Mismatched invoice dates
  - Mismatched due dates
  - Payment allocation discrepancies
- Export reconciliation results

## Requirements

- Node.js v16 or higher
- PostgreSQL database
- Modern web browser

## Installation

1. Clone the repository:
```bash
git clone https://github.com/[your-username]/reconciliation-system.git
cd reconciliation-system
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

3. Install backend dependencies:
```bash
cd ../backend
npm install
```

4. Set up environment variables:
- Copy `.env.example` to `.env`
- Update the values in `.env` with your configuration

5. Start the development servers:

Frontend:
```bash
cd frontend
npm start
```

Backend:
```bash
cd backend
npm run dev
```

## CSV Format

The system expects CSV files in the following format:

```csv
transaction_number,transaction_type,amount,issue_date,due_date,status,reference
INV001,INVOICE,1000.00,2024-01-01,2024-01-31,open,PO12345
```

## Configuration Options

- Date tolerance: Set acceptable date differences
- Amount tolerance: Set acceptable amount differences
- Transaction type rules: Configure matching rules per transaction type

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

[Your chosen license]

## Support

[Contact information or where to get help]
