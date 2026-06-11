# Managing Categories

## Category Structure

BudgetBee organizes categories in two levels:

- **Parent Category**: Groups related categories together.
- **Category**: The specific category for the transaction.

## Creating a Category

1. Go to **Settings → Categories**.
2. Click **Add Category**.
3. Select the **Parent Category** or create a new one.
4. Enter the category name.
5. Click **Save**.

## Automatic Category Prediction

BudgetBee uses a Machine Learning model (Naive Bayes) trained on your past transactions to automatically suggest categories.

- When you create a new record, the system suggests the most likely category.
- The model retrains automatically with each new transaction.
- You can accept the suggestion or choose a different category manually.

## How the AI Uses Categories

When you ask the AI to create transactions (via chat), the AI uses the categories available in your account. It always assigns the most appropriate category based on the transaction description.

If you want to see your available categories, ask the chat: "What categories do I have?"
