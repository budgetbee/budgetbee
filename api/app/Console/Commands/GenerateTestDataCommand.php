<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\Account;
use App\Models\Category;
use App\Models\ParentCategory;
use App\Models\UserCurrency;
use App\Models\Budget;
use App\Models\Record;
use App\Models\UpcomingExpense;
use App\Models\AccountTypes;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class GenerateTestDataCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:generate-data 
                            {--email=test@budgetbee.com : Email of the test user}
                            {--password=password : Password of the test user}
                            {--accounts=5 : Number of accounts to create}
                            {--records=200 : Number of records to create}
                            {--budgets=8 : Number of budgets to create}
                            {--upcoming=5 : Number of upcoming expenses to create}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generates complete test data for development (user, accounts, categories, records, budgets)';

    private $user;
    private $categories = [];
    private $accounts = [];

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🚀 Starting test data generation...');

        DB::beginTransaction();

        try {
            // 1. Create or find user
            $this->createOrFindUser();

            // 2. Set up user currencies
            $this->setupUserCurrencies();

            // 3. Create user categories
            $this->createCategories();

            // 4. Create accounts
            $this->createAccounts();

            // 5. Create budgets
            $this->createBudgets();

            // 6. Create records (income, expenses, transfers)
            $this->createRecords();

            // 7. Create upcoming expenses
            $this->createUpcomingExpenses();

            DB::commit();

            $this->newLine();
            $this->info('✅ Test data generated successfully!');
            $this->newLine();
            $this->table(
                ['Resource', 'Amount'],
                [
                    ['User', $this->user->email],
                    ['Accounts', count($this->accounts)],
                    ['Categories', count($this->categories)],
                    ['Records', $this->option('records')],
                    ['Budgets', $this->option('budgets')],
                    ['Upcoming Expenses', $this->option('upcoming')],
                ]
            );
            $this->newLine();
            $this->info('📧 Email: ' . $this->user->email);
            $this->info('🔑 Password: ' . $this->option('password'));

            return 0;
        } catch (\Exception $e) {
            DB::rollBack();
            $this->error('❌ Error generating test data: ' . $e->getMessage());
            $this->error($e->getTraceAsString());
            return 1;
        }
    }

    private function createOrFindUser()
    {
        $this->info('👤 Creating test user...');

        $email = $this->option('email');
        $password = $this->option('password');

        $this->user = User::where('email', $email)->first();

        if ($this->user) {
            $this->warn("⚠️  User {$email} already exists. Using existing one.");
        } else {
            $this->user = User::create([
                'name' => 'Test User',
                'email' => $email,
                'password' => Hash::make($password),
                'email_verified_at' => now(),
            ]);
            $this->info("✓ User created: {$email}");
        }
    }

    private function setupUserCurrencies()
    {
        $this->info('💰 Setting up currencies...');

        // Check that currencies exist in the currency table
        $defaultCurrencies = DB::table('currencies')->limit(3)->get();
        
        if ($defaultCurrencies->isEmpty()) {
            $this->warn('⚠️  No currencies found in the database. Make sure to run seeders.');
            return;
        }

        foreach ($defaultCurrencies as $currency) {
            $exists = UserCurrency::where('user_id', $this->user->id)
                ->where('currency_id', $currency->id)
                ->exists();

            if (!$exists) {
                UserCurrency::create([
                    'user_id' => $this->user->id,
                    'currency_id' => $currency->id
                ]);
            }
        }

        // Update user's default currency
        $userCurrency = UserCurrency::where('user_id', $this->user->id)->first();
        if ($userCurrency) {
            $this->user->update(['currency_id' => $userCurrency->id]);
        }

        $this->info('✓ Currencies configured');
    }

    private function createCategories()
    {
        $this->info('📁 Creating categories...');

        $categoriesData = json_decode(file_get_contents(database_path('seeders/data/categories.json')), true);

        foreach ($categoriesData as $parentData) {
            // Find or create parent category
            $parentCategory = ParentCategory::firstOrCreate(
                ['id' => $parentData['id']],
                [
                    'name' => $parentData['name'],
                    'color' => $parentData['color'],
                    'icon' => $parentData['icon']
                ]
            );

            // Create subcategories
            foreach ($parentData['categories'] as $categoryData) {
                $category = Category::firstOrCreate(
                    ['id' => $categoryData['id']],
                    [
                        'user_id' => $this->user->id,
                        'name' => $categoryData['name'],
                        'icon' => $categoryData['icon'],
                        'parent_category_id' => $parentCategory->id
                    ]
                );

                $this->categories[] = $category;
            }
        }

        $this->info('✓ ' . count($this->categories) . ' categories created');
    }

    private function createAccounts()
    {
        $this->info('🏦 Creating accounts...');

        $accountCount = (int) $this->option('accounts');
        $accountTypes = AccountTypes::all();
        $userCurrencies = UserCurrency::where('user_id', $this->user->id)->get();

        if ($accountTypes->isEmpty()) {
            $this->warn('⚠️  No account types found. Run seeders first.');
            return;
        }

        if ($userCurrencies->isEmpty()) {
            $this->warn('⚠️  No currencies configured for the user.');
            return;
        }

        $accountNames = [
            'Checking Account',
            'Credit Card',
            'Savings',
            'Investments',
            'Cash',
            'Payroll Account',
            'Digital Wallet',
            'Emergency Fund'
        ];

        $colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];

        for ($i = 0; $i < $accountCount; $i++) {
            $account = Account::create([
                'user_id' => $this->user->id,
                'name' => $accountNames[$i % count($accountNames)],
                'type_id' => $accountTypes->random()->id,
                'color' => $colors[$i % count($colors)],
                'initial_balance' => rand(0, 10000),
                'currency_id' => $userCurrencies->random()->id
            ]);

            $this->accounts[] = $account;
        }

        $this->info('✓ ' . count($this->accounts) . ' accounts created');
    }

    private function createBudgets()
    {
        $this->info('📊 Creating budgets...');

        $budgetCount = (int) $this->option('budgets');
        
        // Filter expense categories (exclude Transfer and Income)
        $expenseCategories = Category::where('user_id', $this->user->id)
            ->whereNotIn('parent_category_id', [1, 10]) // 1=Transfer, 10=Income
            ->inRandomOrder()
            ->limit($budgetCount)
            ->get();

        foreach ($expenseCategories as $category) {
            Budget::create([
                'user_id' => $this->user->id,
                'category_id' => $category->id,
                'amount' => rand(100, 2000)
            ]);
        }

        $this->info('✓ ' . $budgetCount . ' budgets created');
    }

    private function createRecords()
    {
        $this->info('📝 Creating records...');

        if (empty($this->accounts)) {
            $this->warn('⚠️  No accounts available to create records.');
            return;
        }

        $recordCount = (int) $this->option('records');
        Record::disableAiControllerProcessing();

        $progressBar = $this->output->createProgressBar($recordCount);
        $progressBar->start();

        $incomeCategories = Category::where('parent_category_id', 10)->pluck('id')->toArray(); // Income
        $expenseCategories = Category::whereNotIn('parent_category_id', [1, 10])->pluck('id')->toArray(); // Not Transfer or Income
        $transferCategoryId = 1; // Transfer category

        for ($i = 0; $i < $recordCount; $i++) {
            $type = $this->getRandomRecordType($i, $recordCount);
            $date = $this->getRandomDate();
            $account = $this->accounts[array_rand($this->accounts)];

            $recordData = [
                'user_id' => $this->user->id,
                'date' => $date,
                'from_account_id' => $account->id,
                'rate' => 1
            ];

            switch ($type) {
                case 'income':
                    if (empty($incomeCategories)) break;
                    $recordData['type'] = 'income';
                    $recordData['category_id'] = $incomeCategories[array_rand($incomeCategories)];
                    $recordData['amount'] = rand(500, 5000);
                    $recordData['name'] = $this->getRandomIncomeName();
                    break;

                case 'expense':
                    if (empty($expenseCategories)) break;
                    $recordData['type'] = 'expense';
                    $recordData['category_id'] = $expenseCategories[array_rand($expenseCategories)];
                    $recordData['amount'] = -rand(5, 500);
                    $recordData['name'] = $this->getRandomExpenseName();
                    break;

                case 'transfer':
                    if (count($this->accounts) < 2) break;
                    $toAccount = $this->accounts[array_rand($this->accounts)];
                    while ($toAccount->id === $account->id && count($this->accounts) > 1) {
                        $toAccount = $this->accounts[array_rand($this->accounts)];
                    }
                    
                    $recordData['type'] = 'transfer';
                    $recordData['category_id'] = $transferCategoryId;
                    $recordData['to_account_id'] = $toAccount->id;
                    $recordData['amount'] = rand(50, 1000);
                    $recordData['name'] = 'Transfer between accounts';
                    break;
            }

            Record::create($recordData);
            $progressBar->advance();
        }

        Record::enableAiControllerProcessing();
        $progressBar->finish();
        $this->newLine();
        $this->info('✓ ' . $recordCount . ' records created');
    }

    private function createUpcomingExpenses()
    {
        $this->info('📅 Creating upcoming expenses...');

        $upcomingCount = (int) $this->option('upcoming');
        
        $expenseCategories = Category::whereNotIn('parent_category_id', [1, 10])
            ->pluck('id')
            ->toArray();

        if (empty($expenseCategories)) {
            $this->warn('⚠️  No expense categories available.');
            return;
        }

        $upcomingExpenseNames = [
            'Annual Insurance',
            'License Renewal',
            'Vacation',
            'School Enrollment',
            'Scheduled Repair',
            'Annual Subscription',
            'Taxes',
            'Vehicle Maintenance'
        ];

        for ($i = 0; $i < $upcomingCount; $i++) {
            UpcomingExpense::create([
                'user_id' => $this->user->id,
                'title' => $upcomingExpenseNames[$i % count($upcomingExpenseNames)],
                'category_id' => $expenseCategories[array_rand($expenseCategories)],
                'amount' => rand(200, 5000),
                'due_date' => Carbon::now()->addMonths(rand(1, 12))->format('Y-m-d')
            ]);
        }

        $this->info('✓ ' . $upcomingCount . ' upcoming expenses created');
    }

    private function getRandomRecordType($index, $total)
    {
        // 60% expenses, 25% income, 15% transfers
        $rand = rand(1, 100);
        
        if ($rand <= 60) {
            return 'expense';
        } elseif ($rand <= 85) {
            return 'income';
        } else {
            return 'transfer';
        }
    }

    private function getRandomDate()
    {
        // Generate dates from the last 6 months
        $daysAgo = rand(0, 180);
        return Carbon::now()->subDays($daysAgo)->format('Y-m-d');
    }

    private function getRandomIncomeName()
    {
        $names = [
            'Salary',
            'Freelance',
            'Bonus',
            'Investments',
            'Sale',
            'Refund',
            'Commission',
            'Gift'
        ];

        return $names[array_rand($names)];
    }

    private function getRandomExpenseName()
    {
        $names = [
            'Supermarket',
            'Restaurant',
            'Gas',
            'Coffee',
            'Pharmacy',
            'Transportation',
            'Entertainment',
            'Subscription',
            'Clothing',
            'Utilities',
            'Repair',
            'Online Shopping',
            'Gym',
            'Hairdresser'
        ];

        return $names[array_rand($names)];
    }
}
