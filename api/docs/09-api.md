# External API

## What is the External API?

BudgetBee lets you expose your financial data via a REST API so other applications or services can securely access it. All endpoints are scoped to the user who created the API key.

**Base URL:** `https://your-budgetbee.com/api/v1/external`

## Setting Up an API Key

1. Go to **Settings → API Keys** (on either the web app or mobile app).
2. Click **Create API Key**.
3. Give it a descriptive name (e.g., "Zapier integration", "Personal app").
4. Copy the generated key (it is only shown once).

## Authentication

Include the API Key in the header of each request:

```
X-API-Key: YOUR_API_KEY
```

## Usage Example

```bash
curl -H "X-API-Key: YOUR_API_KEY" \
     https://your-budgetbee.com/api/v1/external/accounts
```

---

## Endpoints

### Records

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/records` | List records (paginated, with filters) |
| `GET` | `/records/{id}` | Get a single record by ID |
| `POST` | `/records` | Create a new record |
| `PUT` | `/records/{id}` | Update an existing record |
| `DELETE` | `/records/{id}` | Delete a record |

#### `GET /records`

Query parameters (all optional):

| Parameter | Type | Description |
|-----------|------|-------------|
| `account_id` | integer | Filter by account |
| `from_date` | string | Start date (`YYYY-MM-DD`) |
| `to_date` | string | End date (`YYYY-MM-DD`) |
| `search_term` | string | Search in record name |
| `category_id` | integer | Filter by category |
| `type` | string | `income`, `expense`, or `transfer` |
| `page` | integer | Page number (default: 1) |
| `per_page` | integer | Results per page (default: 20) |

Example:
```bash
curl -H "X-API-Key: YOUR_API_KEY" \
     "https://your-budgetbee.com/api/v1/external/records?type=expense&from_date=2026-01-01&per_page=10"
```

#### `POST /records`

Request body (JSON):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `date` | string | ✅ | Date (`YYYY-MM-DD`) |
| `from_account_id` | integer | ✅ | Account ID |
| `type` | string | ✅ | `income`, `expense`, or `transfer` |
| `amount` | number | ✅ | Amount (always positive) |
| `name` | string | | Record name/description |
| `category_id` | integer | | Category ID (default: 1) |
| `description` | string | | Additional notes |
| `rate` | number | | Exchange rate (default: 1) |
| `code` | string | | Bank code or reference |
| `to_account_id` | integer | | Target account (required for `transfer`) |

Example:
```bash
curl -X POST -H "X-API-Key: YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"date":"2026-06-11","from_account_id":1,"type":"expense","amount":45.99,"name":"Grocery shopping","category_id":3}' \
     https://your-budgetbee.com/api/v1/external/records
```

#### `PUT /records/{id}`

Same body as `POST`. All fields are required (except `category_id`, `description`, `rate`, `code` which are optional).

#### `DELETE /records/{id}`

No body required. Returns `{"message": "Record deleted"}`.

---

### Accounts (read-only)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/accounts` | List all accounts |
| `GET` | `/accounts/{id}` | Get a single account |
| `GET` | `/account-types` | List all account types |

#### `GET /accounts`

Returns an array of account objects with fields: `id`, `name`, `type_id`, `type_name`, `initial_balance`, `current_balance`, `balance`, `currency_id`, `currency_symbol`, `currency_code`, `color`.

#### `GET /account-types`

Returns available account types (`General`, `Checking`, `Savings`, `Credit Card`, `Investment`, `Cash`, `Other`).

---

### Categories (read-only)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/categories` | List all categories |
| `GET` | `/categories/{id}` | Get a single category |
| `GET` | `/parent-categories` | List parent categories |
| `GET` | `/parent-categories/{id}` | Get a single parent category |
| `GET` | `/parent-categories/{id}/categories` | List categories under a parent |

#### `GET /categories`

Returns an array of category objects with fields: `id`, `name`, `icon`, `color`, `parent_category_id`, `parent_name`.

#### `GET /parent-categories`

Returns parent categories with fields: `id`, `name`, `icon`, `type` (`income`, `expense`, or `transfer`).

---

## Security

- API Keys are stored encrypted using HMAC-SHA256 with the app secret as salt.
- The plain text key is shown only once at creation time.
- You can revoke an API Key at any time from **Settings → API Keys**.
- Each API Key only has access to the data of the user who created it.
- Keys support optional expiration (`expires_at` — not yet exposed via UI).

