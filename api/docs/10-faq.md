# Frequently Asked Questions (FAQ)

## General

### Is BudgetBee free?
Yes, BudgetBee is a free and open-source application. You can install it on your own server.

### Is my data safe?
Yes. All data is stored on your own server. OpenAI/DeepSeek API keys are stored encrypted. No one else has access to your data.

### Can I use BudgetBee offline?
No, BudgetBee is a web application that requires a connection to the server where it is installed.

## Accounts and Transactions

### Can I have multiple accounts in different currencies?
Yes. BudgetBee supports multiple accounts and currencies. The balance is calculated by converting everything to your main currency.

### How are transfers between accounts handled?
Create a transaction of type "Transfer". The system deducts from the source account and adds to the destination account automatically.

### Can I edit a transaction created by the AI?
Yes. Transactions created by the AI are the same as manually created ones. You can edit or delete them at any time.

## AI and Chat

### Do I need to pay to use the AI?
BudgetBee does not charge for the AI, but you need your own OpenAI or DeepSeek API key. OpenAI charges per use (very affordable, ~$0.15 per 1000 messages). DeepSeek is cheaper.

### Does the AI see all my data?
The AI only sees the data you ask about. When you ask "how much have I spent this month?", the AI queries your database and receives only totals and summaries — not individual transactions (unless you ask for specific ones).

### What data does the AI remember about me?
The AI remembers preferences like your language, favorite account, and spending patterns (e.g., "you usually shop at Walmart on Fridays"). This data is stored on your server and is not shared with third parties.

### Can I delete what the AI remembers about me?
Yes. Say "forget everything about me" in the chat or delete memories manually. The chat also has a "New Chat" button to start fresh.

## Categories

### Can I create my own categories?
Yes. Go to **Settings → Categories** and create the categories you need.

### How does category prediction work?
The AI analyzes the transaction name and compares it with your history to predict the most likely category. The model improves with each new transaction.

## Budgets

### Are budgets monthly?
Yes, budgets are currently calculated per calendar month.

### Can I create yearly budgets?
Not currently, but you can set a monthly budget and ask the AI for the yearly accumulated total.

## Import

### Which banks are compatible?
Any bank that allows exporting to CSV or Excel. See the Import section for more details.

### What if my bank doesn't export in a compatible format?
You can use tools like Google Sheets to convert the format, or enter transactions manually.

## Troubleshooting

### The AI chat is not responding
- Verify you have configured an API key in **Settings → AI Providers**.
- Make sure the API key is valid and has available credit.
- Check the server logs for more details.

### Import fails
- Make sure the file is in CSV, XLSX, XLS, or ODS format.
- Verify that columns are correctly mapped.
- Check that dates are in a recognizable format.

### How do I create API keys?
Go to **Settings → API Keys** on either the web or mobile app. Click **Create API Key**, give it a name, and copy the generated key (it will only be shown once). Use it in the `X-API-Key` header when calling external API endpoints.
