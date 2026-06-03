<?php

namespace App\Services\Ai;

use App\Models\Account;
use App\Models\AiProviderKey;
use App\Models\Budget;
use App\Models\Category;
use App\Models\Record;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiChatService
{
    private User $user;
    private ?string $provider;
    private ?string $apiKey;

    private const HISTORY_CACHE_PREFIX = 'ai_chat_history_';
    private const MAX_HISTORY_MESSAGES = 30; // Keep last N messages to stay within token limits

    public function __construct(User $user)
    {
        $this->user = $user;
        $this->resolveProvider();
    }

    /**
     * Find the user's configured AI provider and API key.
     * Priority: OpenAI first, then DeepSeek.
     */
    private function resolveProvider(): void
    {
        $key = AiProviderKey::where('user_id', $this->user->id)
            ->orderByRaw("FIELD(provider, 'openai', 'deepseek')")
            ->first();

        if ($key) {
            $this->provider = $key->provider;
            $this->apiKey = $key->api_key;
        } else {
            $this->provider = null;
            $this->apiKey = null;
        }
    }

    /**
     * Check if the user has configured any AI provider.
     */
    public function isConfigured(): bool
    {
        return $this->apiKey !== null;
    }

    /**
     * Get the provider name for display.
     */
    public function getProviderName(): string
    {
        return match ($this->provider) {
            'openai' => 'OpenAI',
            'deepseek' => 'DeepSeek',
            default => 'Unknown',
        };
    }

    /**
     * Main entry point: process a chat message and return the AI response.
     * Maintains conversation history so follow-up questions work naturally.
     */
    public function chat(string $message, array $files = []): string
    {
        if (!$this->isConfigured()) {
            return "I'm not configured yet. Please add an OpenAI or DeepSeek API key in Settings → Main Settings to enable AI features.";
        }

        // Detect images and determine if vision is needed
        $imageFiles = $this->filterImageFiles($files);
        $hasImages = !empty($imageFiles);

        // Image analysis requires OpenAI (GPT-4o-mini with vision)
        if ($hasImages && $this->provider !== 'openai') {
            return "📷 **Image analysis** is only available with **OpenAI**. Please configure an OpenAI API key in Settings → Main Settings to analyze images. DeepSeek does not currently support vision capabilities.";
        }

        // If no message and no images, prompt the user
        if (empty(trim($message)) && !$hasImages) {
            return "How can I help you? You can ask me about your finances, budgets, or send me an image of your bank transactions to extract them.";
        }

        // Load existing conversation history
        $history = $this->getHistory();

        // Build the full message list: system + history + new user message
        $messages = $this->buildMessagesWithHistory($message, $history, $imageFiles);

        // Track tool calls to detect and prevent infinite loops
        $calledTools = [];
        $lastToolResults = [];

        // Call AI with tool definitions (max 5 round-trips)
        $maxIterations = 5;

        for ($i = 0; $i < $maxIterations; $i++) {
            $response = $this->callProvider($messages);

            if (!$response) {
                Log::warning('AI chat: provider returned null response', [
                    'user_id' => $this->user->id,
                    'provider' => $this->provider,
                    'iteration' => $i,
                ]);
                return "Sorry, I couldn't reach the AI service. Please try again later.";
            }

            $choice = $response['choices'][0] ?? null;
            if (!$choice) {
                Log::warning('AI chat: no choice in response', [
                    'user_id' => $this->user->id,
                    'response' => $response,
                ]);
                return "Sorry, I received an unexpected response from the AI service.";
            }

            $finishReason = $choice['finish_reason'] ?? 'stop';

            Log::debug('AI chat iteration', [
                'user_id' => $this->user->id,
                'iteration' => $i,
                'finish_reason' => $finishReason,
            ]);

            // If the AI wants to call a tool
            if ($finishReason === 'tool_calls' && !empty($choice['message']['tool_calls'])) {
                $messages[] = $choice['message'];

                foreach ($choice['message']['tool_calls'] as $toolCall) {
                    $toolName = $toolCall['function']['name'];
                    $toolArgs = json_decode($toolCall['function']['arguments'], true) ?? [];

                    Log::info('AI tool call', [
                        'user_id' => $this->user->id,
                        'tool' => $toolName,
                        'args' => $toolArgs,
                        'iteration' => $i,
                    ]);

                    // Detect repeated identical tool calls (prevents loops)
                    $toolFingerprint = $toolName . ':' . json_encode($toolArgs);
                    $calledTools[] = $toolFingerprint;

                    $toolResult = $this->executeTool($toolName, $toolArgs);
                    $lastToolResults[$toolName] = $toolResult;

                    $messages[] = [
                        'role' => 'tool',
                        'tool_call_id' => $toolCall['id'],
                        'content' => json_encode($toolResult),
                    ];
                }

                continue; // Back to the AI with tool results
            }

            // Normal text response — save to history
            $assistantReply = $choice['message']['content'] ?? "I'm not sure how to answer that.";

            // Append the exchange to history and persist
            $history[] = ['role' => 'user', 'content' => $message];
            $history[] = ['role' => 'assistant', 'content' => $assistantReply];
            $this->saveHistory($history);

            return $assistantReply;
        }

        // Loop exhausted — log what happened and try to give a useful fallback
        Log::warning('AI chat: max tool-call iterations reached', [
            'user_id' => $this->user->id,
            'tools_called' => $calledTools,
            'provider' => $this->provider,
        ]);

        // Try one final call without tools to force a text response
        $messagesWithoutTools = $messages;
        $messagesWithoutTools[] = [
            'role' => 'user',
            'content' => 'Please provide a direct answer based on the data above. Do NOT call any more tools.',
        ];
        $finalResponse = $this->callProvider($messagesWithoutTools, false);
        if ($finalResponse && !empty($finalResponse['choices'][0]['message']['content'])) {
            $assistantReply = $finalResponse['choices'][0]['message']['content'];
            $history[] = ['role' => 'user', 'content' => $message];
            $history[] = ['role' => 'assistant', 'content' => $assistantReply];
            $this->saveHistory($history);
            return $assistantReply;
        }

        return "I'm having trouble processing your request. Could you try rephrasing it?";
    }

    /**
     * Clear the conversation history for this user.
     */
    public function clearHistory(): void
    {
        Cache::forget(self::HISTORY_CACHE_PREFIX . $this->user->id);
    }

    /**
     * Get the conversation history from cache.
     */
    private function getHistory(): array
    {
        return Cache::get(self::HISTORY_CACHE_PREFIX . $this->user->id, []);
    }

    /**
     * Save the conversation history to cache (keeps last N messages).
     */
    private function saveHistory(array $history): void
    {
        // Trim to max messages to avoid unbounded growth
        if (count($history) > self::MAX_HISTORY_MESSAGES) {
            $history = array_slice($history, -self::MAX_HISTORY_MESSAGES);
        }

        // Cache for 24 hours (conversation expires after a day of inactivity)
        Cache::put(self::HISTORY_CACHE_PREFIX . $this->user->id, $history, now()->addDay());
    }

    /**
     * Build the messages array including conversation history and optional images.
     */
    private function buildMessagesWithHistory(string $userMessage, array $history, array $imageFiles = []): array
    {
        $systemPrompt = $this->getSystemPrompt();

        $messages = [
            ['role' => 'system', 'content' => $systemPrompt],
        ];

        // Include recent conversation history for context
        foreach ($history as $msg) {
            $messages[] = $msg;
        }

        // Build the new user message content
        if (!empty($imageFiles)) {
            // Vision format: content is an array of text + image parts
            $content = [];
            if (!empty(trim($userMessage))) {
                $content[] = ['type' => 'text', 'text' => $userMessage];
            } else {
                $content[] = ['type' => 'text', 'text' => 'Please analyze this image and extract any financial transactions you can see.'];
            }
            foreach ($imageFiles as $image) {
                $content[] = [
                    'type' => 'image_url',
                    'image_url' => [
                        'url' => $image['base64'],
                        'detail' => 'low',
                    ],
                ];
            }
            $messages[] = ['role' => 'user', 'content' => $content];
        } else {
            // Plain text message
            $messages[] = ['role' => 'user', 'content' => $userMessage];
        }

        return $messages;
    }

    /**
     * Filter uploaded files to only include images, converting them to base64.
     */
    private function filterImageFiles(array $files): array
    {
        $images = [];
        foreach ($files as $file) {
            $mime = $file['mime'] ?? '';
            if (in_array($mime, ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'])) {
                $path = $file['path'] ?? null;
                if ($path && file_exists($path)) {
                    $base64 = 'data:' . $mime . ';base64,' . base64_encode(file_get_contents($path));
                    $images[] = [
                        'name' => $file['name'],
                        'base64' => $base64,
                    ];
                }
            }
        }
        return $images;
    }

    /**
     * Get the system prompt with context about the user and available tools.
     */
    private function getSystemPrompt(): string
    {
        $currency = $this->user->currency_symbol ?? '$';
        $today = Carbon::now()->format('Y-m-d');
        $currentMonth = Carbon::now()->format('F Y');

        return <<<PROMPT
You are BudgetBee AI, a friendly and helpful financial assistant integrated into the BudgetBee personal finance app.
Your role is to help the user understand their finances by answering questions about their accounts, expenses, income, budgets, and transactions.

Current date: {$today}
Current month: {$currentMonth}
User's currency: {$currency}

You have access to tools that let you query the user's real financial data in the database.
Always use these tools to provide accurate, data-driven answers. Do NOT make up numbers — only report what the tools return.
If a query returns no data, tell the user honestly.
Be concise but friendly. Format currency amounts with the user's currency symbol.

**IMPORTANT: Always format your responses using Markdown.** Use the following formatting rules:
- Use **bold** for key numbers, totals, and important figures.
- Use `code` formatting for dates and technical values.
- Use bullet lists (starting with -) for listing items like accounts, categories, or transactions.
- Use numbered lists for step-by-step guidance.
- Use ### headings for section titles when presenting structured data.
- Use tables (| column | column |) for comparing data across categories or time periods.
- Use > blockquotes for important notes or warnings.
- Keep it clean and readable — don't overuse formatting.

Example of a good response:
```
Here's your spending breakdown for this month:

| Category | Amount |
|----------|--------|
| Supermarkets | **\$342.50** |
| Transport | **\$128.00** |
| Entertainment | **\$85.30** |
| **Total** | **\$555.80** |

> Your biggest expense category this month is *Supermarkets* at 62% of total spending.
```

**DATA EXTRACTION: When the user sends you financial data (image, spreadsheet, or pasted text):**

The user may send data in different formats:
- **Images** (screenshots, photos of bank statements) → analyze visually
- **Spreadsheet data** (appears as a markdown table in the message starting with `**File: *.xlsx**`) → process the table directly
- **Pasted text** → process as-is

Follow the same extraction flow regardless of format:

**Step 1 — Extract ALL transactions:**
Carefully read every visible transaction. Pay special attention to the AMOUNT column:
- **NEGATIVE amounts or payments** (e.g., -531.19, or amounts in a "debit/expenses" column) = **expenses**
- **POSITIVE amounts or deposits** (e.g., +5000, or descriptions like "SALARY", "PAYROLL", "DEPOSIT", "INCOMING TRANSFER") = **income**
- Bank statements typically show expenses with a minus sign and income without one.

**Step 2 — MANDATORY: Call context tools BEFORE presenting anything:**
- **You MUST call `get_accounts`** as your very first action after seeing the image. This is NOT optional.
- **You MUST call `get_categories`** to see the user's actual category names.
- Do NOT present extracted data until you have called both tools and received results.

**Step 3 — Categorize intelligently:**
Match each transaction to the closest existing category from `get_categories`. Common patterns:
- "SALARY", "PAYROLL", "DEPOSIT" → Income
- "SUPERMARKET", "GROCERY", "WALMART", "TESCO", "LIDL", "ALDI" → Supermarkets / Groceries
- "NETFLIX", "SPOTIFY", "DISNEY", "HBO", "PRIME", "SUBSCRIPTION" → Subscriptions
- "UBER", "LYFT", "TRANSPORT", "GAS", "FUEL" → Transport
- "RESTAURANT", "CAFE", "COFFEE", "DELIVERY", "DOORDASH" → Restaurants / Dining
- "INSURANCE", "GEICO" → Insurance
- "LOAN", "MORTGAGE" → Loan payment
- "FEE", "COMMISSION", "SERVICE CHARGE" → Bank fees
- "RENT", "LEASE" → Housing
- "ELECTRIC", "WATER", "UTILITY" → Utilities
- "PHARMACY", "DOCTOR", "MEDICAL" → Healthcare
- Use the ACTUAL category names from `get_categories`. If unsure, use "Other".

**Step 4 — Present the data with ALL columns:**
Table format: Date | Description | Amount | Type | Category

**Step 5 — CRITICAL: Ask the user which account to use:**
- After presenting the table, **you MUST ask the user which account to use**. Example:
  "Which account should I create these records in? Available accounts: **Checking ($1,200)**, **Savings ($5,000)**."
- Do NOT assume a default account. Wait for the user to tell you.

**Step 6 — Only create when BOTH account AND confirmation are received:**
- The user must tell you the account name AND say yes/confirm/create/proceed.
- **NEVER call `create_records_batch` until the user has specified an account.**
- When confirmed, call `create_records_batch` with: date, name, amount (ALWAYS positive), type ("income" or "expense"), category_name, account_name.
PROMPT;
    }

    /**
     * Get the tool definitions for the AI provider (MCP-style).
     */
    private function getTools(): array
    {
        return [
            [
                'type' => 'function',
                'function' => [
                    'name' => 'get_balance',
                    'description' => 'Get the user\'s current total balance across all accounts.',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => (object) [],
                    ],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'get_accounts',
                    'description' => 'Get all accounts with their balances, types, and currencies.',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => (object) [],
                    ],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'get_expenses_by_category',
                    'description' => 'Get total expenses grouped by category for a given date range. Use this when the user asks how much they spent on something (e.g., "how much did I spend on groceries this month?").',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'from_date' => [
                                'type' => 'string',
                                'description' => 'Start date in Y-m-d format. Defaults to first day of current month if not provided.',
                            ],
                            'to_date' => [
                                'type' => 'string',
                                'description' => 'End date in Y-m-d format. Defaults to today if not provided.',
                            ],
                            'category_name' => [
                                'type' => 'string',
                                'description' => 'Optional: filter by category or parent category name (partial match supported, e.g., "supermarket" or "groceries").',
                            ],
                        ],
                    ],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'get_income_by_category',
                    'description' => 'Get total income grouped by category for a given date range.',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'from_date' => [
                                'type' => 'string',
                                'description' => 'Start date in Y-m-d format. Defaults to first day of current month if not provided.',
                            ],
                            'to_date' => [
                                'type' => 'string',
                                'description' => 'End date in Y-m-d format. Defaults to today if not provided.',
                            ],
                        ],
                    ],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'get_recent_records',
                    'description' => 'Get the most recent transactions. Use this when the user asks about recent activity or their latest transactions.',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'limit' => [
                                'type' => 'integer',
                                'description' => 'Number of records to return. Defaults to 10.',
                            ],
                            'category_name' => [
                                'type' => 'string',
                                'description' => 'Optional: filter by category name.',
                            ],
                        ],
                    ],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'get_budgets',
                    'description' => 'Get the user\'s budgets with their current spent amounts and remaining balances.',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => (object) [],
                    ],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'search_records',
                    'description' => 'Search for transactions by name or description keyword.',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'keyword' => [
                                'type' => 'string',
                                'description' => 'Search keyword to look for in transaction names.',
                            ],
                            'limit' => [
                                'type' => 'integer',
                                'description' => 'Maximum number of results. Defaults to 20.',
                            ],
                        ],
                        'required' => ['keyword'],
                    ],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'get_categories',
                    'description' => 'Get all available expense and income categories that the user has.',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => (object) [],
                    ],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'create_records_batch',
                    'description' => 'Create multiple financial records at once. ONLY call this after the user has explicitly confirmed they want the records created. Always present the extracted data first and ask for confirmation. The user must say "yes", "create them", "confirm", or similar before you call this tool.',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'records' => [
                                'type' => 'array',
                                'description' => 'Array of records to create.',
                                'items' => [
                                    'type' => 'object',
                                    'properties' => [
                                        'date' => [
                                            'type' => 'string',
                                            'description' => 'Date in Y-m-d format.',
                                        ],
                                        'name' => [
                                            'type' => 'string',
                                            'description' => 'Transaction name/description.',
                                        ],
                                        'amount' => [
                                            'type' => 'number',
                                            'description' => 'ALWAYS a positive number (e.g., 45.50). The system handles the sign internally.',
                                        ],
                                        'type' => [
                                            'type' => 'string',
                                            'enum' => ['income', 'expense'],
                                            'description' => 'Whether this is income (money received, salary, deposit) or expense (payment, purchase, withdrawal). Required for every record.',
                                        ],
                                        'category_name' => [
                                            'type' => 'string',
                                            'description' => 'Category name. MUST match one of the user\'s real categories from get_categories. Call get_categories first.',
                                        ],
                                        'account_name' => [
                                            'type' => 'string',
                                            'description' => 'Account name. MUST match one of the user\'s real accounts from get_accounts. Call get_accounts first BEFORE presenting data to the user.',
                                        ],
                                    ],
                                    'required' => ['date', 'name', 'amount', 'type', 'account_name'],
                                ],
                            ],
                        ],
                        'required' => ['records'],
                    ],
                ],
            ],
        ];
    }

    /**
     * Call the AI provider's API.
     */
    private function callProvider(array $messages, bool $includeTools = true): ?array
    {
        $apiUrl = match ($this->provider) {
            'openai' => 'https://api.openai.com/v1/chat/completions',
            'deepseek' => 'https://api.deepseek.com/v1/chat/completions',
            default => null,
        };

        if (!$apiUrl) {
            return null;
        }

        $payload = [
            'model' => $this->getModelName(),
            'messages' => $messages,
            'temperature' => 0.3,
            'max_tokens' => 2000,
        ];

        if ($includeTools) {
            $payload['tools'] = $this->getTools();
            $payload['tool_choice'] = 'auto';
        }

        try {
            $httpResponse = Http::withHeaders([
                'Authorization' => "Bearer {$this->apiKey}",
                'Content-Type' => 'application/json',
            ])
                ->timeout(60)
                ->post($apiUrl, $payload);

            if ($httpResponse->successful()) {
                return $httpResponse->json();
            }

            Log::error('AI Provider error', [
                'provider' => $this->provider,
                'status' => $httpResponse->status(),
                'body' => $httpResponse->body(),
            ]);

            return null;
        } catch (\Exception $e) {
            Log::error('AI Provider exception', [
                'provider' => $this->provider,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Get the appropriate model name for each provider.
     */
    private function getModelName(): string
    {
        return match ($this->provider) {
            'openai' => 'gpt-4o-mini',
            'deepseek' => 'deepseek-chat',
            default => 'gpt-4o-mini',
        };
    }

    /**
     * Execute a tool call and return the result.
     */
    private function executeTool(string $name, array $arguments): array
    {
        return match ($name) {
            'get_balance' => $this->toolGetBalance(),
            'get_accounts' => $this->toolGetAccounts(),
            'get_expenses_by_category' => $this->toolGetExpensesByCategory($arguments),
            'get_income_by_category' => $this->toolGetIncomeByCategory($arguments),
            'get_recent_records' => $this->toolGetRecentRecords($arguments),
            'get_budgets' => $this->toolGetBudgets(),
            'search_records' => $this->toolSearchRecords($arguments),
            'get_categories' => $this->toolGetCategories(),
            'create_records_batch' => $this->toolCreateRecordsBatch($arguments),
            default => ['error' => "Unknown tool: {$name}"],
        };
    }

    // ─── Tool Implementations ───────────────────────────────────────

    private function toolGetBalance(): array
    {
        $balance = Account::where('user_id', $this->user->id)
            ->get()
            ->sum('balance_base_currency');

        $accounts = Account::where('user_id', $this->user->id)
            ->get()
            ->map(fn($a) => [
                'name' => $a->name,
                'balance' => round($a->balance, 2),
                'currency' => $a->currency_symbol,
            ]);

        return [
            'total_balance' => round($balance, 2),
            'currency' => $this->user->currency_symbol,
            'accounts' => $accounts->toArray(),
        ];
    }

    private function toolGetAccounts(): array
    {
        $accounts = Account::where('user_id', $this->user->id)
            ->get()
            ->map(fn($a) => [
                'name' => $a->name,
                'type' => $a->account_type_name,
                'balance' => round($a->balance, 2),
                'currency' => $a->currency_symbol,
                'initial_balance' => round($a->initial_balance, 2),
            ]);

        return [
            'accounts' => $accounts->toArray(),
            'currency' => $this->user->currency_symbol,
        ];
    }

    private function toolGetExpensesByCategory(array $args): array
    {
        $fromDate = $args['from_date'] ?? Carbon::now()->startOfMonth()->format('Y-m-d');
        $toDate = $args['to_date'] ?? Carbon::now()->format('Y-m-d');
        $categoryFilter = $args['category_name'] ?? null;

        $excludeParentIds = [1, 10]; // Exclude transfers and income

        $query = Record::where('user_id', $this->user->id)
            ->whereIn('type', ['expense'])
            ->where('date', '>=', $fromDate)
            ->where('date', '<=', $toDate)
            ->whereHas('category.parent', function ($q) use ($excludeParentIds) {
                $q->whereNotIn('id', $excludeParentIds);
            })
            ->with('category.parent');

        if ($categoryFilter) {
            $query->where(function ($q) use ($categoryFilter) {
                $q->whereHas('category', function ($sq) use ($categoryFilter) {
                    $sq->where('name', 'like', "%{$categoryFilter}%");
                })->orWhereHas('category.parent', function ($sq) use ($categoryFilter) {
                    $sq->where('name', 'like', "%{$categoryFilter}%");
                });
            });
        }

        $records = $query->get();

        $grouped = [];
        foreach ($records as $record) {
            $parentName = $record->parent_category_name ?? 'Other';
            $catName = $record->category_name ?? 'Unknown';

            $grouped[$parentName]['total'] = ($grouped[$parentName]['total'] ?? 0) + round(abs($record->amount_base_currency), 2);
            $grouped[$parentName]['categories'][$catName] = ($grouped[$parentName]['categories'][$catName] ?? 0) + round(abs($record->amount_base_currency), 2);
        }

        $totalExpenses = array_sum(array_column($grouped, 'total'));

        return [
            'from_date' => $fromDate,
            'to_date' => $toDate,
            'total_expenses' => round($totalExpenses, 2),
            'currency' => $this->user->currency_symbol,
            'by_parent_category' => $grouped,
        ];
    }

    private function toolGetIncomeByCategory(array $args): array
    {
        $fromDate = $args['from_date'] ?? Carbon::now()->startOfMonth()->format('Y-m-d');
        $toDate = $args['to_date'] ?? Carbon::now()->format('Y-m-d');

        $incomeCategoryIds = Category::where('parent_category_id', 10)->pluck('id');

        $records = Record::where('user_id', $this->user->id)
            ->whereIn('category_id', $incomeCategoryIds)
            ->where('date', '>=', $fromDate)
            ->where('date', '<=', $toDate)
            ->with('category')
            ->get();

        $grouped = [];
        foreach ($records as $record) {
            $catName = $record->category_name ?? 'Unknown';
            $grouped[$catName] = ($grouped[$catName] ?? 0) + round(abs($record->amount_base_currency), 2);
        }

        $totalIncome = array_sum($grouped);

        return [
            'from_date' => $fromDate,
            'to_date' => $toDate,
            'total_income' => round($totalIncome, 2),
            'currency' => $this->user->currency_symbol,
            'by_category' => $grouped,
        ];
    }

    private function toolGetRecentRecords(array $args): array
    {
        $limit = min($args['limit'] ?? 10, 50);
        $categoryFilter = $args['category_name'] ?? null;

        $query = Record::where('user_id', $this->user->id)
            ->with('category.parent')
            ->orderBy('date', 'desc')
            ->orderBy('id', 'desc')
            ->limit($limit);

        if ($categoryFilter) {
            $query->whereHas('category', function ($q) use ($categoryFilter) {
                $q->where('name', 'like', "%{$categoryFilter}%");
            });
        }

        $records = $query->get()->map(fn($r) => [
            'date' => $r->date,
            'name' => $r->name,
            'amount' => round($r->amount, 2),
            'type' => $r->type,
            'category' => $r->category_name ?? 'Unknown',
            'parent_category' => $r->parent_category_name ?? 'Unknown',
            'account' => $r->account_name ?? 'Unknown',
            'currency' => $r->currency_symbol,
        ]);

        return [
            'records' => $records->toArray(),
            'count' => $records->count(),
        ];
    }

    private function toolGetBudgets(): array
    {
        $budgets = Budget::where('user_id', $this->user->id)
            ->with('category.parent')
            ->get()
            ->map(fn($b) => [
                'category' => $b->category_name,
                'parent_category' => $b->parent_category_name,
                'budgeted' => round($b->amount, 2),
                'spent' => round($b->spent, 2),
                'remaining' => round($b->amount - $b->spent, 2),
                'percent_used' => round($b->spent_percent, 1),
            ]);

        return [
            'budgets' => $budgets->toArray(),
            'currency' => $this->user->currency_symbol,
        ];
    }

    private function toolSearchRecords(array $args): array
    {
        $keyword = $args['keyword'] ?? '';
        $limit = min($args['limit'] ?? 20, 50);

        $records = Record::where('user_id', $this->user->id)
            ->where('name', 'like', "%{$keyword}%")
            ->with('category.parent')
            ->orderBy('date', 'desc')
            ->limit($limit)
            ->get()
            ->map(fn($r) => [
                'date' => $r->date,
                'name' => $r->name,
                'amount' => round($r->amount, 2),
                'type' => $r->type,
                'category' => $r->category_name ?? 'Unknown',
                'parent_category' => $r->parent_category_name ?? 'Unknown',
                'currency' => $r->currency_symbol,
            ]);

        return [
            'keyword' => $keyword,
            'records' => $records->toArray(),
            'count' => $records->count(),
        ];
    }

    private function toolGetCategories(): array
    {
        $categories = Category::where(function ($q) {
            $q->where('user_id', $this->user->id)
                ->orWhereNull('user_id');
        })
            ->with('parent')
            ->get()
            ->groupBy('parent_category_id')
            ->map(function ($cats, $parentId) {
                $parentName = $cats->first()->parent_name ?? 'Other';
                return [
                    'parent_category' => $parentName,
                    'categories' => $cats->map(fn($c) => $c->name)->toArray(),
                ];
            });

        return [
            'category_groups' => $categories->values()->toArray(),
        ];
    }

    /**
     * Create multiple records in batch. Used after user confirms extracted transactions.
     */
    private function toolCreateRecordsBatch(array $args): array
    {
        $records = $args['records'] ?? [];
        if (empty($records)) {
            return ['error' => 'No records provided.', 'created' => 0];
        }

        // Get all user accounts for matching
        $userAccounts = Account::where('user_id', $this->user->id)->get();
        $defaultAccount = $userAccounts->first();

        // Pre-load all categories for fuzzy matching
        $allCategories = Category::where(function ($q) {
            $q->where('user_id', $this->user->id)
                ->orWhereNull('user_id');
        })->get();

        $created = 0;
        $skipped = 0;
        $details = [];

        foreach ($records as $record) {
            $recordName = $record['name'] ?? 'Unknown';
            $recordAmount = abs(floatval($record['amount'] ?? 0));
            $recordDate = $record['date'] ?? Carbon::now()->format('Y-m-d');
            $recordType = $record['type'] ?? 'expense';
            $recordAccountName = $record['account_name'] ?? null;

            if ($recordAmount <= 0) {
                $skipped++;
                $details[] = ['name' => $recordName, 'status' => 'skipped', 'reason' => 'Zero or negative amount'];
                continue;
            }

            // Match account
            $accountId = null;
            $matchedAccountName = 'Unknown';
            if ($recordAccountName) {
                $matchedAccount = $userAccounts->first(fn($a) =>
                    mb_strtolower($a->name) === mb_strtolower($recordAccountName) ||
                    str_contains(mb_strtolower($a->name), mb_strtolower($recordAccountName)) ||
                    str_contains(mb_strtolower($recordAccountName), mb_strtolower($a->name))
                );
                if ($matchedAccount) {
                    $accountId = $matchedAccount->id;
                    $matchedAccountName = $matchedAccount->name;
                }
            }
            if (!$accountId && $defaultAccount) {
                $accountId = $defaultAccount->id;
                $matchedAccountName = $defaultAccount->name;
            }

            if (!$accountId) {
                $skipped++;
                $details[] = ['name' => $recordName, 'status' => 'skipped', 'reason' => 'No account found'];
                continue;
            }

            // Fuzzy match category
            $categoryId = 44; // Default "Other" category
            $matchedCategoryName = 'Other';
            $categoryName = $record['category_name'] ?? null;
            if ($categoryName) {
                $matched = $this->fuzzyMatchCategory($categoryName, $allCategories);
                if ($matched) {
                    $categoryId = $matched->id;
                    $matchedCategoryName = $matched->name;
                }
            }

            // For income, try to find an income category if not matched
            if ($recordType === 'income' && (!$categoryName || $categoryId === 44)) {
                $incomeCategory = $allCategories->first(fn($c) => $c->parent_category_id == 10);
                if ($incomeCategory) {
                    $categoryId = $incomeCategory->id;
                    $matchedCategoryName = $incomeCategory->name;
                }
            }

            // Determine amount sign: expenses are negative, income is positive
            $finalAmount = $recordType === 'income' ? $recordAmount : -$recordAmount;

            try {
                $newRecord = Record::create([
                    'user_id' => $this->user->id,
                    'date' => $recordDate,
                    'from_account_id' => $accountId,
                    'type' => $recordType === 'income' ? 'income' : 'expense',
                    'category_id' => $categoryId,
                    'name' => $recordName,
                    'amount' => $finalAmount,
                    'rate' => 1,
                ]);

                $created++;
                $details[] = [
                    'name' => $recordName,
                    'status' => 'created',
                    'date' => $recordDate,
                    'amount' => $recordAmount,
                    'type' => $recordType,
                    'category' => $matchedCategoryName,
                    'account' => $matchedAccountName,
                    'id' => $newRecord->id,
                ];
            } catch (\Exception $e) {
                $skipped++;
                Log::error('Failed to create record from AI batch', [
                    'user_id' => $this->user->id,
                    'record' => $recordName,
                    'error' => $e->getMessage(),
                ]);
                $details[] = ['name' => $recordName, 'status' => 'skipped', 'reason' => 'Database error'];
            }
        }

        return [
            'created' => $created,
            'skipped' => $skipped,
            'total' => count($records),
            'details' => $details,
            'currency' => $this->user->currency_symbol,
        ];
    }

    /**
     * Fuzzy match a category name to the closest existing category.
     */
    private function fuzzyMatchCategory(string $name, $allCategories): ?Category
    {
        $name = mb_strtolower(trim($name));

        // Direct match first
        $direct = $allCategories->first(fn($c) => mb_strtolower($c->name) === $name);
        if ($direct) return $direct;

        // Contains match
        $contains = $allCategories->first(fn($c) => str_contains(mb_strtolower($c->name), $name) || str_contains($name, mb_strtolower($c->name)));
        if ($contains) return $contains;

        // Parent category match (e.g., "supermarket" matches any category under "Supermarkets")
        foreach ($allCategories as $cat) {
            $parentName = mb_strtolower($cat->parent_name ?? '');
            if ($parentName && (str_contains($parentName, $name) || str_contains($name, $parentName))) {
                return $cat; // Return first category under matched parent
            }
        }

        return null;
    }
}
