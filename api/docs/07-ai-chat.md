# AI Chat

## How Does the AI Chat Work?

BudgetBee's AI chat lets you interact with your finances using natural language. The AI has access to your real data (transactions, accounts, budgets, categories) and can:

- Answer questions about your finances.
- Create transactions for you.
- Analyze images of receipts and tickets.
- Search for specific transactions.
- Give you financial advice based on your data.

## Prerequisites

Before using the chat, you must configure an AI provider (OpenAI or DeepSeek). See the [initial setup guide](#setting-up-the-ai-provider).

## What Can You Ask?

### Balance and Account Queries
- "What's my total balance?"
- "What accounts do I have?"
- "How much is in my savings account?"

### Expense Queries
- "How much have I spent this month?"
- "What did I spend the most on?"
- "How much did I spend on groceries last month?"
- "Show me my last 10 expenses"

### Income Queries
- "How much have I earned this year?"
- "What was my biggest income?"

### Budget Queries
- "How are my budgets doing?"
- "Do I have anything left in my entertainment budget?"

### Searches
- "Search for Amazon transactions"
- "How many times have I shopped at Walmart this month?"

### Creating Transactions
- "Add a $30 expense for gas today"
- "I paid $45 at Olive Garden"

### Receipt Analysis (requires OpenAI)
- Send a photo of a receipt and the AI will extract: date, items, amounts, and categories.

## How Does the AI Handle History?

- The AI remembers the current conversation as long as you don't close the chat or click "New Chat".
- The AI also has **persistent memory**: it remembers your preferred language, favorite account, spending habits, etc.
- Chat history expires after 24 hours of inactivity.
- To manually clear history, click the **New Chat** button (🗑️).

## Supported Providers

| Provider | Capabilities | Model |
|----------|-------------|-------|
| **OpenAI** | Chat, image analysis (receipts/tickets) | GPT-4o-mini |
| **DeepSeek** | Chat (no image analysis) | DeepSeek Chat |

## Limitations

- Images can only be analyzed with OpenAI.
- Answers are based on your real data; if you have no data, the AI will tell you.
- The AI cannot modify or delete existing transactions, only create new ones.
- Maximum 2000 characters per message.
- Maximum 10 MB per attached file.
