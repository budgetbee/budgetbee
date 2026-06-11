# BudgetBee - General Documentation

## What is BudgetBee?

BudgetBee is a personal finance application that lets you manage your income, expenses, budgets, and bank accounts from a single place.

## Key Features

- **Transaction tracking**: Enter expenses and income manually or via AI (extracting data from receipts, tickets, or bank statements).
- **Multiple accounts**: Manage bank accounts, cash, credit cards, etc.
- **Budgets**: Set category budgets and track your spending.
- **Customizable categories**: Organize transactions with parent categories and subcategories.
- **Data import**: Import transactions from CSV, Excel (XLSX, XLS, ODS) files.
- **AI assistant**: Built-in AI chat (OpenAI or DeepSeek) that can answer questions about your finances, create transactions, analyze receipt images, and more.
- **Category prediction**: AI auto-suggests categories for new transactions based on your history.
- **Real-time balance**: View your total balance across all accounts.
- **Multi-currency**: Support for multiple currencies with automatic conversion.
- **External API**: Securely share your data via API keys.

## User Roles

- **Admin**: Can manage all users, view all transactions, and configure the application.
- **Regular user**: Manages their own accounts, transactions, and budgets.

## Technology Stack

- **Backend**: Laravel (PHP) with MySQL/MariaDB
- **Frontend**: React (Vite + Tailwind CSS)
- **AI**: OpenAI GPT-4o-mini / DeepSeek Chat
- **ML**: Python (scikit-learn) for category prediction
- **Cache**: Redis for chat sessions
