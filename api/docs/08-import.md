# Data Import

## Supported Formats

BudgetBee supports importing transactions from the following formats:

| Format | Extension |
|--------|-----------|
| CSV | `.csv` |
| Excel | `.xlsx`, `.xls` |
| OpenDocument | `.ods` |

## How to Import

1. Go to the **Import** section in the sidebar.
2. Click **Select File** and choose your file.
3. The system will parse the file and show a preview.
4. **Map the columns**: indicate which column in the file corresponds to each BudgetBee field:
   - **Date**: Transaction date (format: YYYY-MM-DD or DD/MM/YYYY).
   - **Name**: Description or concept.
   - **Amount**: Amount (positive for income, negative for expenses, or use a separate type column).
   - **Type**: `expense`, `income`, or `transfer` (if no type column, the system infers it from the amount sign).
   - **Category**: Category name (must match an existing category).
   - **Account**: Account name (must match an existing account).
5. Review the data in the preview.
6. Click **Import** to confirm.

## CSV Tips

- Use comma (`,`) or semicolon (`;`) as delimiter.
- The first row must contain column names.
- Recommended date format: `YYYY-MM-DD`.
- Use period (`.`) as decimal separator.

## Importing from Banks

Most banks allow exporting transactions to CSV or Excel. Look for "Export", "Download transactions", or similar in your bank's website or app.

Verified compatible banks:
- BBVA
- Santander
- CaixaBank
- Sabadell
- Bankinter
- Revolut
- N26
- And many more (any bank that exports to CSV/Excel)
