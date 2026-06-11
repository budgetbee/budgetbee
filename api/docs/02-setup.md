# Initial Setup

## Getting Started

1. Log into BudgetBee with your username and password.
2. If you are the first user, you will be prompted to create an admin account.
3. Once inside, configure your preferences in **Settings → Main Settings**.

## Setting Up the AI Provider

BudgetBee supports two AI providers: **OpenAI** and **DeepSeek**. To use the AI chat, you need to configure at least one:

### OpenAI

1. Go to **Settings → AI Providers**.
2. Click **Add Provider** or select OpenAI.
3. Enter your OpenAI API key (starts with `sk-`).
4. The key is stored encrypted in the database.

**How to get an OpenAI API key:**
1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create an account or sign in.
3. Click "Create new secret key".
4. Copy the key and paste it into BudgetBee.

> OpenAI supports image analysis (receipts, tickets) with GPT-4o-mini.

### DeepSeek

1. Go to **Settings → AI Providers**.
2. Select DeepSeek.
3. Enter your DeepSeek API key.

**How to get a DeepSeek API key:**
1. Go to [https://platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys)
2. Create an account or sign in.
3. Generate a new API key.

> DeepSeek does not support image analysis. If you need to analyze receipts or tickets, configure OpenAI.

### Provider Priority

If you have both providers configured, BudgetBee will use **OpenAI** by default (because it supports vision/images). If OpenAI fails or is not configured, it will fall back to DeepSeek.

## Setting Up Your Main Currency

1. Go to **Settings → Main Settings**.
2. In the **Currency** section, select your main currency (EUR, USD, MXN, etc.).
3. You can also create custom currencies if yours is not listed.
