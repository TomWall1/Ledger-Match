// Utility functions for date and number comparison
const parseDate = (dateString) => new Date(dateString);
const parseAmount = (amount) => parseFloat(amount);

export class TransactionMatcher {
    constructor(config = {}) {
        // Default configuration
        this.config = {
            dateTolerance: 0, // days
            amountTolerance: 0.01, // currency units
            matchByReference: false,
            strictTransactionTypes: true,
            ...config
        };
    }

    // Compare two dates within tolerance
    datesMatch(date1, date2) {
        const d1 = parseDate(date1);
        const d2 = parseDate(date2);
        const diffTime = Math.abs(d2 - d1);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= this.config.dateTolerance;
    }

    // Compare two amounts within tolerance
    amountsMatch(amount1, amount2) {
        const a1 = parseAmount(amount1);
        const a2 = parseAmount(amount2);
        return Math.abs(a1 - a2) <= this.config.amountTolerance;
    }

    // Check if transactions match based on all criteria
    transactionsMatch(transaction1, transaction2) {
        // Always check transaction numbers first
        if (transaction1.transaction_number === transaction2.transaction_number) {
            return {
                matched: true,
                matchType: 'exact',
                confidence: 1.0
            };
        }

        // Check transaction types if strict matching is enabled
        if (this.config.strictTransactionTypes && 
            transaction1.transaction_type !== transaction2.transaction_type) {
            return {
                matched: false,
                matchType: 'none',
                confidence: 0
            };
        }

        // Initialize match score
        let matchScore = 0;

        // Check amounts
        if (this.amountsMatch(transaction1.amount, transaction2.amount)) {
            matchScore += 0.4;
        }

        // Check dates
        if (this.datesMatch(transaction1.issue_date, transaction2.issue_date)) {
            matchScore += 0.3;
        }

        // Check references if enabled
        if (this.config.matchByReference && 
            transaction1.reference && 
            transaction2.reference && 
            transaction1.reference.toLowerCase() === transaction2.reference.toLowerCase()) {
            matchScore += 0.3;
        }

        return {
            matched: matchScore >= 0.7,
            matchType: matchScore >= 0.7 ? 'partial' : 'none',
            confidence: matchScore
        };
    }

    // Main matching function
    matchTransactions(company1Transactions, company2Transactions) {
        const results = {
            matches: [],
            mismatches: {
                amount: [],
                date: [],
                other: []
            },
            unmatched: {
                company1: [],
                company2: []
            },
            summary: {
                totalTransactions: company1Transactions.length + company2Transactions.length,
                matchedCount: 0,
                mismatchCount: 0,
                unmatchedCount: 0
            }
        };

        // Track matched transactions to avoid duplicates
        const matchedCompany2Indices = new Set();

        // Try to match each transaction from company 1
        company1Transactions.forEach((trans1, index1) => {
            let bestMatch = null;
            let bestMatchIndex = -1;
            let bestMatchScore = 0;

            // Compare with each transaction from company 2
            company2Transactions.forEach((trans2, index2) => {
                if (matchedCompany2Indices.has(index2)) return;

                const matchResult = this.transactionsMatch(trans1, trans2);
                if (matchResult.matched && matchResult.confidence > bestMatchScore) {
                    bestMatch = { transaction: trans2, matchResult };
                    bestMatchIndex = index2;
                    bestMatchScore = matchResult.confidence;
                }
            });

            if (bestMatch) {
                // Record the match
                matchedCompany2Indices.add(bestMatchIndex);
                results.matches.push({
                    company1Transaction: trans1,
                    company2Transaction: bestMatch.transaction,
                    matchType: bestMatch.matchResult.matchType,
                    confidence: bestMatch.matchResult.confidence
                });
                results.summary.matchedCount++;
            } else {
                // Record the unmatched transaction
                results.unmatched.company1.push(trans1);
                results.summary.unmatchedCount++;
            }
        });

        // Find unmatched company 2 transactions
        company2Transactions.forEach((trans2, index2) => {
            if (!matchedCompany2Indices.has(index2)) {
                results.unmatched.company2.push(trans2);
                results.summary.unmatchedCount++;
            }
        });

        // Analyze mismatches
        results.matches.forEach(match => {
            if (match.matchType === 'partial') {
                if (!this.amountsMatch(match.company1Transaction.amount, match.company2Transaction.amount)) {
                    results.mismatches.amount.push(match);
                }
                if (!this.datesMatch(match.company1Transaction.issue_date, match.company2Transaction.issue_date)) {
                    results.mismatches.date.push(match);
                }
                results.summary.mismatchCount++;
            }
        });

        return results;
    }
}